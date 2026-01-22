const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['spending_analysis', 'budget_suggestion', 'savings_tips', 'financial_health', 'forecast'],
    required: true
  },
  period: {
    startDate: Date,
    endDate: Date
  },
  insights: [{
    title: String,
    description: String,
    category: String,
    impact: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    actionable: Boolean,
    suggestedAction: String
  }],
  summary: {
    type: String,
    required: true
  },
  aiResponse: {
    type: String
  },
  metrics: {
    totalIncome: Number,
    totalExpenses: Number,
    savings: Number,
    savingsRate: Number,
    topCategories: [{
      category: String,
      amount: Number,
      percentage: Number
    }]
  },
  recommendations: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Auto-delete after 7 days
  }
}, {
  timestamps: true
});

analysisSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
