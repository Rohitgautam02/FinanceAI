require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

const categories = {
  income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other Income'],
  expense: [
    'Food & Dining', 'Shopping', 'Transportation', 'Bills & Utilities',
    'Entertainment', 'Healthcare', 'Education', 'Travel', 'Groceries',
    'Rent', 'Insurance', 'Subscriptions', 'Personal Care', 'Gifts & Donations', 'Other Expense'
  ]
};

const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'];

const merchants = {
  'Food & Dining': ['Swiggy', 'Zomato', 'Dominos', 'McDonalds', 'Starbucks', 'Local Restaurant'],
  'Shopping': ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Local Store'],
  'Transportation': ['Uber', 'Ola', 'Rapido', 'Metro', 'Petrol Pump'],
  'Bills & Utilities': ['BESCOM', 'Jio', 'Airtel', 'BWSSB', 'Gas'],
  'Entertainment': ['Netflix', 'Prime Video', 'PVR', 'Spotify', 'Gaming'],
  'Groceries': ['BigBasket', 'Blinkit', 'DMart', 'More', 'Local Market'],
  'Healthcare': ['Apollo Pharmacy', 'MedPlus', 'Hospital', 'Practo'],
  'Subscriptions': ['Netflix', 'Spotify', 'Prime', 'Hotstar', 'YouTube Premium']
};

const getRandomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomDate = (daysBack) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
};

const generateTransactions = (userId, count = 100) => {
  const transactions = [];
  const now = new Date();

  // Generate income transactions for the past 12 months
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    // Monthly salary
    transactions.push({
      user: userId,
      type: 'income',
      amount: getRandomAmount(65000, 85000),
      category: 'Salary',
      description: 'Monthly Salary',
      date: monthDate,
      paymentMethod: 'Net Banking',
      merchant: 'Employer',
      importedFrom: 'manual'
    });

    // Occasional freelance income
    if (Math.random() > 0.6) {
      const freelanceDate = new Date(monthDate);
      freelanceDate.setDate(getRandomAmount(10, 25));
      transactions.push({
        user: userId,
        type: 'income',
        amount: getRandomAmount(10000, 30000),
        category: 'Freelance',
        description: 'Freelance Project Payment',
        date: freelanceDate,
        paymentMethod: 'Net Banking',
        merchant: 'Client',
        importedFrom: 'manual'
      });
    }
  }

  // Generate expense transactions - more for recent periods
  const expenseDistribution = {
    'Food & Dining': { min: 200, max: 2000, frequency: 25 },
    'Shopping': { min: 500, max: 5000, frequency: 8 },
    'Transportation': { min: 50, max: 500, frequency: 20 },
    'Bills & Utilities': { min: 1000, max: 5000, frequency: 4 },
    'Entertainment': { min: 200, max: 1500, frequency: 6 },
    'Healthcare': { min: 500, max: 3000, frequency: 2 },
    'Groceries': { min: 1000, max: 5000, frequency: 10 },
    'Rent': { min: 15000, max: 25000, frequency: 3 },
    'Subscriptions': { min: 199, max: 999, frequency: 5 },
    'Personal Care': { min: 200, max: 1500, frequency: 4 },
    'Other Expense': { min: 100, max: 2000, frequency: 5 }
  };

  // Generate expenses across different time periods
  // Weekly (last 7 days) - fewer transactions
  Object.entries(expenseDistribution).forEach(([category, config]) => {
    const weeklyFreq = Math.ceil(config.frequency / 12);
    for (let i = 0; i < weeklyFreq; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      const merchant = merchants[category] 
        ? merchants[category][Math.floor(Math.random() * merchants[category].length)]
        : 'Various';

      transactions.push({
        user: userId,
        type: 'expense',
        amount: getRandomAmount(config.min, config.max),
        category,
        description: `${category} - ${merchant}`,
        date,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        merchant,
        importedFrom: 'manual'
      });
    }
  });

  // Monthly (8-30 days ago) - medium transactions
  Object.entries(expenseDistribution).forEach(([category, config]) => {
    const monthlyFreq = Math.ceil(config.frequency / 4);
    for (let i = 0; i < monthlyFreq; i++) {
      const daysAgo = 7 + Math.floor(Math.random() * 23);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      const merchant = merchants[category] 
        ? merchants[category][Math.floor(Math.random() * merchants[category].length)]
        : 'Various';

      transactions.push({
        user: userId,
        type: 'expense',
        amount: getRandomAmount(config.min, config.max),
        category,
        description: `${category} - ${merchant}`,
        date,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        merchant,
        importedFrom: 'manual'
      });
    }
  });

  // Quarterly (31-90 days ago) - more transactions
  Object.entries(expenseDistribution).forEach(([category, config]) => {
    const quarterlyFreq = Math.ceil(config.frequency / 2);
    for (let i = 0; i < quarterlyFreq; i++) {
      const daysAgo = 30 + Math.floor(Math.random() * 60);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      const merchant = merchants[category] 
        ? merchants[category][Math.floor(Math.random() * merchants[category].length)]
        : 'Various';

      transactions.push({
        user: userId,
        type: 'expense',
        amount: getRandomAmount(config.min, config.max),
        category,
        description: `${category} - ${merchant}`,
        date,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        merchant,
        importedFrom: 'manual'
      });
    }
  });

  // Yearly (91-365 days ago) - full transactions
  Object.entries(expenseDistribution).forEach(([category, config]) => {
    for (let i = 0; i < config.frequency; i++) {
      const daysAgo = 90 + Math.floor(Math.random() * 275);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      const merchant = merchants[category] 
        ? merchants[category][Math.floor(Math.random() * merchants[category].length)]
        : 'Various';

      transactions.push({
        user: userId,
        type: 'expense',
        amount: getRandomAmount(config.min, config.max),
        category,
        description: `${category} - ${merchant}`,
        date,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        merchant,
        importedFrom: 'manual'
      });
    }
  });

  return transactions;
};

const generateBudgets = (userId) => {
  return [
    { user: userId, category: 'Food & Dining', limit: 8000, period: 'monthly', color: '#EF4444' },
    { user: userId, category: 'Shopping', limit: 5000, period: 'monthly', color: '#F59E0B' },
    { user: userId, category: 'Transportation', limit: 3000, period: 'monthly', color: '#10B981' },
    { user: userId, category: 'Entertainment', limit: 2000, period: 'monthly', color: '#8B5CF6' },
    { user: userId, category: 'Groceries', limit: 6000, period: 'monthly', color: '#06B6D4' },
    { user: userId, category: 'Bills & Utilities', limit: 5000, period: 'monthly', color: '#3B82F6' }
  ];
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/financeai');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Budget.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create demo user
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@financeai.com',
      password: 'demo123',
      currency: 'INR',
      monthlyBudget: 50000,
      savingsGoal: 20000
    });
    console.log('👤 Created demo user: demo@financeai.com / demo123');

    // Create transactions
    const transactions = generateTransactions(demoUser._id, 100);
    await Transaction.insertMany(transactions);
    console.log(`💰 Created ${transactions.length} sample transactions`);

    // Create budgets
    const budgets = generateBudgets(demoUser._id);
    await Budget.insertMany(budgets);
    console.log(`📊 Created ${budgets.length} budgets`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('   Email: demo@financeai.com');
    console.log('   Password: demo123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
