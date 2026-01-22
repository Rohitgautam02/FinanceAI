const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  limit: {
    type: Number,
    required: [true, 'Budget limit is required'],
    min: [0, 'Limit cannot be negative']
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  alertThreshold: {
    type: Number,
    default: 80, // Alert when 80% of budget is used
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  }
}, {
  timestamps: true
});

// Compound index for unique budget per user per category
budgetSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
