const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Category mapping for automatic categorization
const categoryMapping = {
  // Food & Dining
  'swiggy': 'Food & Dining',
  'zomato': 'Food & Dining',
  'restaurant': 'Food & Dining',
  'cafe': 'Food & Dining',
  'food': 'Food & Dining',
  'dining': 'Food & Dining',
  'pizza': 'Food & Dining',
  'burger': 'Food & Dining',
  
  // Shopping
  'amazon': 'Shopping',
  'flipkart': 'Shopping',
  'myntra': 'Shopping',
  'shopping': 'Shopping',
  'mall': 'Shopping',
  'store': 'Shopping',
  
  // Transportation
  'uber': 'Transportation',
  'ola': 'Transportation',
  'rapido': 'Transportation',
  'petrol': 'Transportation',
  'fuel': 'Transportation',
  'metro': 'Transportation',
  'bus': 'Transportation',
  'train': 'Transportation',
  
  // Bills & Utilities
  'electricity': 'Bills & Utilities',
  'water': 'Bills & Utilities',
  'gas': 'Bills & Utilities',
  'internet': 'Bills & Utilities',
  'broadband': 'Bills & Utilities',
  'mobile': 'Bills & Utilities',
  'recharge': 'Bills & Utilities',
  
  // Entertainment
  'netflix': 'Subscriptions',
  'spotify': 'Subscriptions',
  'prime': 'Subscriptions',
  'hotstar': 'Subscriptions',
  'movie': 'Entertainment',
  'cinema': 'Entertainment',
  'pvr': 'Entertainment',
  'inox': 'Entertainment',
  
  // Healthcare
  'hospital': 'Healthcare',
  'pharmacy': 'Healthcare',
  'medical': 'Healthcare',
  'doctor': 'Healthcare',
  'clinic': 'Healthcare',
  'medicine': 'Healthcare',
  
  // Groceries
  'grocery': 'Groceries',
  'bigbasket': 'Groceries',
  'blinkit': 'Groceries',
  'zepto': 'Groceries',
  'dmart': 'Groceries',
  'supermarket': 'Groceries',
  
  // Rent
  'rent': 'Rent',
  'housing': 'Rent',
  
  // Salary
  'salary': 'Salary',
  'payroll': 'Salary',
  
  // Investment
  'investment': 'Investment',
  'mutual fund': 'Investment',
  'stocks': 'Investment',
  'zerodha': 'Investment',
  'groww': 'Investment'
};

// Detect category from description
const detectCategory = (description, amount, type) => {
  const lowerDesc = description.toLowerCase();
  
  for (const [keyword, category] of Object.entries(categoryMapping)) {
    if (lowerDesc.includes(keyword)) {
      return category;
    }
  }
  
  return type === 'income' ? 'Other Income' : 'Other Expense';
};

// Detect transaction type based on amount sign AND description
const detectType = (amount, description) => {
  const lowerDesc = description.toLowerCase();
  
  // CRITICAL: Negative amounts are ALWAYS expenses
  if (amount < 0) {
    return 'expense';
  }
  
  // Check for expense keywords even if amount is positive (some CSVs use absolute values)
  const expenseKeywords = ['debit', 'paid', 'payment', 'purchase', 'bought', 'expense', 'bill', 
    'shopping', 'food', 'petrol', 'electricity', 'recharge', 'subscription', 'atm', 'withdrawal',
    'amazon', 'flipkart', 'swiggy', 'zomato', 'uber', 'ola', 'grocery', 'medical', 'movie', 
    'dinner', 'lunch', 'coffee', 'rent', 'emi', 'loan'];
  
  for (const keyword of expenseKeywords) {
    if (lowerDesc.includes(keyword)) {
      return 'expense';
    }
  }
  
  // Check for income keywords
  const incomeKeywords = ['salary', 'credit', 'received', 'refund', 'cashback', 'interest', 
    'dividend', 'bonus', 'freelance', 'payment received', 'deposit', 'transfer to'];
  
  for (const keyword of incomeKeywords) {
    if (lowerDesc.includes(keyword)) {
      return 'income';
    }
  }
  
  // Default: positive amounts without keywords are treated as income
  return amount > 0 ? 'income' : 'expense';
};

// Parse date from various formats
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  const str = dateStr.trim();
  
  // Handle D/M/YYYY or DD/MM/YYYY format (common in Indian bank statements)
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Handle DD/MM/YYYY format with dashes
  const dmyDashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDashMatch) {
    const [, day, month, year] = dmyDashMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Handle YYYY-MM-DD (ISO format)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Handle DD/MM/YY format
  const shortYearMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (shortYearMatch) {
    const [, day, month, year] = shortYearMatch;
    const fullYear = parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
  }
  
  // Try standard JS date parsing as fallback
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

// @route   POST /api/upload/csv
// @desc    Upload and parse CSV bank statement
// @access  Private
router.post('/csv', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }

    const transactions = [];
    const errors = [];
    let rowNumber = 0;

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          try {
            // Flexible column mapping
            const date = row.Date || row.date || row.DATE || row['Transaction Date'] || row['Txn Date'];
            const description = row.Description || row.description || row.DESCRIPTION || 
                               row.Narration || row.narration || row.Particulars || row.particulars || '';
            const amount = parseFloat(
              row.Amount || row.amount || row.AMOUNT || 
              row.Debit || row.Credit || row['Withdrawal Amt'] || row['Deposit Amt'] || '0'
            );
            
            if (isNaN(amount) || amount === 0) {
              errors.push(`Row ${rowNumber}: Invalid amount`);
              return;
            }

            // CRITICAL: Use original amount to detect type (negative = expense)
            const type = detectType(amount, description);
            const category = detectCategory(description, Math.abs(amount), type);

            // Store expenses as negative, income as positive
            transactions.push({
              user: req.userId,
              date: parseDate(date),
              description: description.substring(0, 200),
              amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
              type,
              category,
              merchant: description.split(' ')[0] || '',
              importedFrom: 'csv'
            });
          } catch (err) {
            errors.push(`Row ${rowNumber}: ${err.message}`);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert transactions
    let inserted = 0;
    if (transactions.length > 0) {
      const result = await Transaction.insertMany(transactions, { ordered: false });
      inserted = result.length;
    }

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    res.json({
      success: true,
      message: `Successfully imported ${inserted} transactions`,
      data: {
        total: rowNumber - 1, // Exclude header
        imported: inserted,
        errors: errors.slice(0, 10), // Return first 10 errors
        transactions: transactions.slice(0, 5) // Preview first 5
      }
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing CSV file'
    });
  }
});

// @route   GET /api/upload/template
// @desc    Download CSV template
// @access  Public
router.get('/template', (req, res) => {
  const template = 'Date,Description,Amount,Type\n2024-01-15,Salary from Company,50000,income\n2024-01-16,Grocery Shopping at DMart,-2500,expense\n2024-01-17,Uber Ride to Office,-350,expense\n2024-01-18,Netflix Subscription,-649,expense\n2024-01-19,Freelance Payment,15000,income';
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transaction_template.csv');
  res.send(template);
});

// @route   DELETE /api/upload/clear-imported
// @desc    Delete all CSV imported transactions for the user
// @access  Private
router.delete('/clear-imported', auth, async (req, res) => {
  try {
    const result = await Transaction.deleteMany({ 
      user: req.userId, 
      importedFrom: 'csv' 
    });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} imported transactions`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear imported error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing imported transactions'
    });
  }
});

module.exports = router;
