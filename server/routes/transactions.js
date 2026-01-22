const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');
const { transactionValidation } = require('../middleware/validation');

// @route   GET /api/transactions
// @desc    Get all transactions for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = { user: req.userId };

    if (type) query.type = type;
    if (category) query.category = category;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', auth, transactionValidation, async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      date,
      paymentMethod,
      tags,
      isRecurring,
      recurringFrequency,
      merchant,
      notes
    } = req.body;

    const transaction = await Transaction.create({
      user: req.userId,
      type,
      amount,
      category,
      description,
      date: date || new Date(),
      paymentMethod,
      tags,
      isRecurring,
      recurringFrequency,
      merchant,
      notes,
      importedFrom: 'manual'
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction'
    });
  }
});

// @route   DELETE /api/transactions
// @desc    Delete multiple transactions
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide transaction IDs to delete'
      });
    }

    const result = await Transaction.deleteMany({
      _id: { $in: ids },
      user: req.userId
    });

    res.json({
      success: true,
      message: `${result.deletedCount} transactions deleted successfully`
    });
  } catch (error) {
    console.error('Delete transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transactions'
    });
  }
});

// @route   GET /api/transactions/stats/summary
// @desc    Get transaction statistics
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = { user: req.userId };
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' }
        }
      }
    ]);

    const result = {
      income: { total: 0, count: 0, avg: 0 },
      expense: { total: 0, count: 0, avg: 0 }
    };

    stats.forEach(stat => {
      result[stat._id] = {
        total: stat.total,
        count: stat.count,
        avg: Math.round(stat.avg * 100) / 100
      };
    });

    result.balance = result.income.total - result.expense.total;
    result.savingsRate = result.income.total > 0 
      ? Math.round((result.balance / result.income.total) * 100) 
      : 0;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

module.exports = router;
