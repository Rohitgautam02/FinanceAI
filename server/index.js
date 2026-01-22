require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const uploadRoutes = require('./routes/upload');
const analysisRoutes = require('./routes/analysis');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Trust proxy for Codespaces/reverse proxy environments
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
// Updated CORS: Allow all origins for development and Codespaces
app.use(cors({
  origin: (origin, callback) => {
    // Always allow requests from localhost, Codespaces, GitHub.dev, Gitpod, or no origin (curl, mobile, etc.)
    if (!origin ||
      /localhost/.test(origin) ||
      /github\.dev/.test(origin) ||
      /app\.github\.dev/.test(origin) ||
      /\.gitpod\.io/.test(origin)
    ) {
      return callback(null, true);
    }
    // For any other origin, allow in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // In production, restrict as needed (customize here)
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200
}));
// Handle preflight OPTIONS requests for all routes
app.options('*', cors());

// Rate limiting - relaxed for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limiting in development
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FinanceAI API is running' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Atlas connected successfully');
    
    // Auto-seed demo user
    await seedDemoUser();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Seed demo user function
const seedDemoUser = async () => {
  try {
    const User = require('./models/User');
    const Transaction = require('./models/Transaction');
    
    // Check if demo user exists
    const existingUser = await User.findOne({ email: 'demo@financeai.com' });
    if (existingUser) {
      // Delete existing transactions and re-seed for proper date distribution
      await Transaction.deleteMany({ user: existingUser._id });
      await generateTransactionsForUser(existingUser._id);
      console.log('📦 Demo user refreshed with updated transactions');
      return;
    }
    
    // Create demo user
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@financeai.com',
      password: 'demo123',
      currency: 'INR',
      monthlyBudget: 50000,
      savingsGoal: 10000
    });
    
    await generateTransactionsForUser(demoUser._id);
    console.log('🌱 Demo user seeded with sample transactions');
    console.log('📧 Demo login: demo@financeai.com / demo123');
  } catch (error) {
    console.error('⚠️ Error seeding demo user:', error.message);
  }
};

// Generate realistic transactions across different time periods
const generateTransactionsForUser = async (userId) => {
  const Transaction = require('./models/Transaction');
  const transactions = [];
  const now = new Date();
  
  const categories = {
    expense: ['Food & Dining', 'Shopping', 'Transportation', 'Bills & Utilities', 'Entertainment', 'Healthcare', 'Groceries'],
    income: ['Salary', 'Freelance', 'Investments']
  };
  
  const amounts = {
    'Food & Dining': [200, 500, 800, 1200, 1500],
    'Shopping': [500, 1500, 3000, 5000, 8000],
    'Transportation': [100, 300, 500, 800, 1200],
    'Bills & Utilities': [500, 1000, 2000, 3000, 4500],
    'Entertainment': [200, 500, 1000, 2000, 3000],
    'Healthcare': [500, 1000, 2000, 3500],
    'Groceries': [500, 1000, 2000, 3000, 4000]
  };

  // Generate 12 months of salary income
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const salaryDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const baseSalary = 70000 + Math.floor(Math.random() * 15000);
    
    transactions.push({
      user: userId,
      description: 'Monthly Salary',
      amount: baseSalary,
      type: 'income',
      category: 'Salary',
      date: salaryDate
    });
    
    // Occasional freelance income
    if (Math.random() > 0.6) {
      const freelanceDate = new Date(salaryDate);
      freelanceDate.setDate(10 + Math.floor(Math.random() * 15));
      transactions.push({
        user: userId,
        description: 'Freelance Project',
        amount: 10000 + Math.floor(Math.random() * 20000),
        type: 'income',
        category: 'Freelance',
        date: freelanceDate
      });
    }
  }

  // WEEKLY: Transactions in last 7 days (lower amounts, fewer)
  for (let i = 0; i < 8; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const category = categories.expense[Math.floor(Math.random() * categories.expense.length)];
    const amountOptions = amounts[category];
    // Use lower range for weekly
    const amount = amountOptions[Math.floor(Math.random() * Math.min(2, amountOptions.length))];
    
    transactions.push({
      user: userId,
      description: `${category} expense`,
      amount,
      type: 'expense',
      category,
      date
    });
  }

  // MONTHLY: Transactions 8-30 days ago (medium amounts)
  for (let i = 0; i < 20; i++) {
    const daysAgo = 7 + Math.floor(Math.random() * 23);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const category = categories.expense[Math.floor(Math.random() * categories.expense.length)];
    const amountOptions = amounts[category];
    const amount = amountOptions[Math.floor(Math.random() * Math.min(3, amountOptions.length))];
    
    transactions.push({
      user: userId,
      description: `${category} expense`,
      amount,
      type: 'expense',
      category,
      date
    });
  }

  // QUARTERLY: Transactions 31-90 days ago (higher variety)
  for (let i = 0; i < 35; i++) {
    const daysAgo = 30 + Math.floor(Math.random() * 60);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const category = categories.expense[Math.floor(Math.random() * categories.expense.length)];
    const amountOptions = amounts[category];
    const amount = amountOptions[Math.floor(Math.random() * amountOptions.length)];
    
    transactions.push({
      user: userId,
      description: `${category} expense`,
      amount,
      type: 'expense',
      category,
      date
    });
  }

  // YEARLY: Transactions 91-365 days ago (full range)
  for (let i = 0; i < 100; i++) {
    const daysAgo = 90 + Math.floor(Math.random() * 275);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const category = categories.expense[Math.floor(Math.random() * categories.expense.length)];
    const amountOptions = amounts[category];
    const amount = amountOptions[Math.floor(Math.random() * amountOptions.length)];
    
    transactions.push({
      user: userId,
      description: `${category} expense`,
      amount,
      type: 'expense',
      category,
      date
    });
  }
    
  await Transaction.insertMany(transactions);
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 FinanceAI API ready at http://localhost:${PORT}/api`);
  });
});

module.exports = app;
