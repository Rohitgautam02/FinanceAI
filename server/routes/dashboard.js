const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { auth } = require('../middleware/auth');

// Helper function to get date range based on period
const getDateRange = (period) => {
  if (period === 'all') {
    return { startDate: new Date('1970-01-01'), endDate: new Date() };
  }
  const endDate = new Date();
  let startDate = new Date();
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }
  return { startDate, endDate };
};

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary (supports period parameter)
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    // Get previous period for comparison
    const periodDuration = endDate - startDate;
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime() - 1);

    // Current period stats
    const currentPeriodStats = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: { $abs: '$amount' } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Previous period stats
    const previousPeriodStats = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          date: { $gte: previousStartDate, $lte: previousEndDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: { $abs: '$amount' } }
        }
      }
    ]);

    // Process stats
    const current = { income: 0, expense: 0 };
    const previous = { income: 0, expense: 0 };

    currentPeriodStats.forEach(s => {
      current[s._id] = s.total;
    });

    previousPeriodStats.forEach(s => {
      previous[s._id] = s.total;
    });

    // Calculate changes
    const incomeChange = previous.income > 0 
      ? (((current.income - previous.income) / previous.income) * 100).toFixed(1)
      : 0;
    
    const expenseChange = previous.expense > 0
      ? (((current.expense - previous.expense) / previous.expense) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        currentMonth: {
          income: current.income,
          expenses: current.expense,
          balance: current.income - current.expense,
          savingsRate: current.income > 0 
            ? ((current.income - current.expense) / current.income * 100).toFixed(1)
            : 0
        },
        changes: {
          income: parseFloat(incomeChange),
          expenses: parseFloat(expenseChange)
        },
        period: {
          start: startDate,
          end: endDate,
          name: period
        }
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary'
    });
  }
});

// @route   GET /api/dashboard/category-breakdown
// @desc    Get spending by category for charts
// @access  Private
router.get('/category-breakdown', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: { $abs: '$amount' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    const totalExpenses = breakdown.reduce((sum, cat) => sum + cat.total, 0);

    const categories = breakdown.map(cat => ({
      category: cat._id,
      amount: cat.total,
      count: cat.count,
      percentage: totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: {
        categories,
        totalExpenses,
        period: { start: startDate, end: endDate }
      }
    });
  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category breakdown'
    });
  }
});

// @route   GET /api/dashboard/monthly-trend
// @desc    Get monthly income/expense trend for charts
// @access  Private
router.get('/monthly-trend', auth, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months) + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const trend = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: { $abs: '$amount' } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format data for charts
    const monthlyData = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    trend.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: monthNames[item._id.month - 1],
          year: item._id.year,
          income: 0,
          expense: 0
        };
      }
      monthlyData[key][item._id.type] = item.total;
    });

    const formattedTrend = Object.values(monthlyData).map(m => ({
      ...m,
      label: `${m.month} ${m.year}`,
      savings: m.income - m.expense
    }));

    res.json({
      success: true,
      data: { trend: formattedTrend }
    });
  } catch (error) {
    console.error('Monthly trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly trend'
    });
  }
});

// @route   GET /api/dashboard/recent-transactions
// @desc    Get recent transactions
// @access  Private
router.get('/recent-transactions', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const transactions = await Transaction.find({ user: req.userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .select('type amount category description date merchant');

    res.json({
      success: true,
      data: { transactions }
    });
  } catch (error) {
    console.error('Recent transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent transactions'
    });
  }
});

// @route   GET /api/dashboard/budget-status
// @desc    Get budget vs actual spending
// @access  Private
router.get('/budget-status', auth, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get budgets
    const budgets = await Budget.find({ user: req.userId, isActive: true });

    // Get current month spending by category
    const spending = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          type: 'expense',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' }
        }
      }
    ]);

    const spendingMap = {};
    spending.forEach(s => {
      spendingMap[s._id] = s.spent;
    });

    // Combine budget with spending
    const budgetStatus = budgets.map(budget => {
      const spent = spendingMap[budget.category] || 0;
      const remaining = budget.limit - spent;
      const percentage = (spent / budget.limit) * 100;

      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining,
        percentage: Math.min(percentage, 100).toFixed(1),
        status: percentage >= 100 ? 'exceeded' : percentage >= budget.alertThreshold ? 'warning' : 'ok',
        color: budget.color
      };
    });

    res.json({
      success: true,
      data: { budgetStatus }
    });
  } catch (error) {
    console.error('Budget status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget status'
    });
  }
});

// @route   POST /api/dashboard/budgets
// @desc    Create or update budget
// @access  Private
router.post('/budgets', auth, async (req, res) => {
  try {
    const { category, limit, period, alertThreshold, color } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, category },
      {
        user: req.userId,
        category,
        limit,
        period: period || 'monthly',
        alertThreshold: alertThreshold || 80,
        color: color || '#3B82F6'
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Budget saved successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Save budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving budget'
    });
  }
});

// @route   DELETE /api/dashboard/budgets/:category
// @desc    Delete budget
// @access  Private
router.delete('/budgets/:category', auth, async (req, res) => {
  try {
    await Budget.findOneAndDelete({
      user: req.userId,
      category: req.params.category
    });

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting budget'
    });
  }
});

module.exports = router;
