const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Transaction = require('../models/Transaction');
const Analysis = require('../models/Analysis');
const { auth } = require('../middleware/auth');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Check if OpenAI is available (has valid API key with quota)
let useOpenAI = true;

// Helper function to generate intelligent mock analysis based on real data
const generateMockSpendingAnalysis = (data) => {
  const savingsRate = parseFloat(data.summary.savingsRate);
  const topCategory = data.topCategories[0]?.category || 'General';
  const secondCategory = data.topCategories[1]?.category || 'Shopping';
  
  let overallAssessment = '';
  if (savingsRate >= 20) {
    overallAssessment = `Excellent financial health! You're saving ${savingsRate}% of your income, which exceeds the recommended 20% savings rate. Your disciplined approach to finances is commendable.`;
  } else if (savingsRate >= 10) {
    overallAssessment = `Good financial management with a ${savingsRate}% savings rate. While you're on the right track, there's room to reach the ideal 20% savings target.`;
  } else if (savingsRate > 0) {
    overallAssessment = `Your current savings rate of ${savingsRate}% indicates room for improvement. Consider reviewing your ${topCategory} expenses to boost savings.`;
  } else {
    overallAssessment = `You're currently spending more than you earn. Immediate attention to expense management is recommended, particularly in ${topCategory}.`;
  }

  return {
    overallAssessment,
    insights: [
      {
        title: `${topCategory} is your largest expense`,
        description: `${topCategory} accounts for ${data.topCategories[0]?.percentage || 0}% of your total spending. Review if all these expenses are necessary.`,
        impact: parseFloat(data.topCategories[0]?.percentage || 0) > 30 ? 'negative' : 'neutral'
      },
      {
        title: 'Spending pattern analysis',
        description: `Your top 3 categories (${data.topCategories.slice(0, 3).map(c => c.category).join(', ')}) make up the majority of expenses.`,
        impact: 'neutral'
      },
      {
        title: savingsRate >= 15 ? 'Strong savings habit' : 'Savings opportunity identified',
        description: savingsRate >= 15 
          ? 'You are maintaining a healthy savings rate. Consider investing surplus funds.'
          : `Targeting a 20% savings rate could add ₹${Math.round((data.summary.totalIncome * 0.2) - data.summary.savings).toLocaleString('en-IN')} to your monthly savings.`,
        impact: savingsRate >= 15 ? 'positive' : 'negative'
      }
    ],
    recommendations: [
      {
        title: 'Apply 50/30/20 Rule',
        action: 'Allocate 50% to needs, 30% to wants, and 20% to savings for balanced finances.',
        potentialSavings: `₹${Math.round(data.summary.totalIncome * 0.05).toLocaleString('en-IN')}/month`
      },
      {
        title: `Optimize ${topCategory} spending`,
        action: `Review your ${topCategory} expenses and identify subscriptions or recurring costs that can be reduced.`,
        potentialSavings: `₹${Math.round(data.topCategories[0]?.amount * 0.15 || 1000).toLocaleString('en-IN')}/month`
      },
      {
        title: 'Set up automatic savings',
        action: 'Transfer a fixed amount to savings immediately when income is received.',
        potentialSavings: `₹${Math.round(data.summary.totalIncome * 0.1).toLocaleString('en-IN')}/month`
      }
    ],
    concerns: savingsRate < 10 
      ? [`Low savings rate of ${savingsRate}%`, `High ${topCategory} expenses relative to income`]
      : [],
    positives: [
      `Tracking ${data.summary.transactionCount} transactions shows financial awareness`,
      savingsRate > 0 ? `Positive cash flow of ₹${data.summary.savings.toLocaleString('en-IN')}` : 'Taking steps to understand your finances'
    ]
  };
};

const generateMockBudgetSuggestions = (data) => {
  const income = data.summary.totalIncome;
  
  return {
    suggestedBudgets: data.topCategories.map(c => {
      const isEssential = ['Food', 'Groceries', 'Utilities', 'Rent', 'EMI', 'Healthcare', 'Transport'].includes(c.category);
      const suggestedLimit = isEssential 
        ? Math.round(c.amount * 1.05) 
        : Math.round(c.amount * 0.85);
      
      return {
        category: c.category,
        currentSpending: c.amount,
        suggestedLimit,
        reason: isEssential 
          ? 'Essential expense - slight buffer added for flexibility'
          : 'Discretionary expense - 15% reduction target suggested',
        priority: isEssential ? 'essential' : 'optional'
      };
    }),
    totalSuggestedBudget: Math.round(income * 0.8),
    projectedSavings: Math.round(income * 0.2),
    tips: [
      'Use the envelope budgeting method for discretionary categories',
      'Review subscriptions monthly and cancel unused services',
      'Set spending alerts at 80% of budget limits',
      'Track daily for the first month to build awareness'
    ]
  };
};

const generateMockSavingsTips = (data) => {
  const topCategories = data.topCategories.slice(0, 3);
  
  return {
    tips: [
      {
        title: `Reduce ${topCategories[0]?.category || 'top category'} expenses`,
        description: `Your ${topCategories[0]?.category || 'largest'} spending can be optimized with small daily changes.`,
        potentialMonthlySavings: Math.round((topCategories[0]?.amount || 5000) * 0.15),
        difficulty: 'medium',
        category: topCategories[0]?.category || 'General',
        actionSteps: [
          'Track every expense in this category for one week',
          'Identify the top 3 recurring expenses',
          'Find one alternative that costs 20% less'
        ]
      },
      {
        title: 'Implement the 24-hour rule',
        description: 'Wait 24 hours before making any non-essential purchase over ₹1,000.',
        potentialMonthlySavings: 2500,
        difficulty: 'easy',
        category: 'Shopping',
        actionSteps: [
          'Add items to cart but don\'t checkout',
          'Review cart after 24 hours',
          'Remove items you no longer want'
        ]
      },
      {
        title: 'Automate your savings',
        description: 'Set up automatic transfer of 20% of income to savings on payday.',
        potentialMonthlySavings: Math.round(data.summary.totalIncome * 0.05),
        difficulty: 'easy',
        category: 'Savings',
        actionSteps: [
          'Open a separate savings account',
          'Set up auto-debit for payday',
          'Treat savings as a non-negotiable expense'
        ]
      },
      {
        title: 'Review and cancel subscriptions',
        description: 'Audit all recurring subscriptions and cancel unused ones.',
        potentialMonthlySavings: 1500,
        difficulty: 'easy',
        category: 'Entertainment',
        actionSteps: [
          'List all active subscriptions',
          'Check last usage for each',
          'Cancel any unused for 30+ days'
        ]
      },
      {
        title: 'Meal prep on weekends',
        description: 'Preparing meals at home can significantly reduce food expenses.',
        potentialMonthlySavings: 3000,
        difficulty: 'medium',
        category: 'Food',
        actionSteps: [
          'Plan weekly meals every Sunday',
          'Buy groceries in bulk',
          'Prep 3-4 meals in advance'
        ]
      }
    ],
    totalPotentialSavings: Math.round(data.summary.totalIncome * 0.15),
    motivationalMessage: `You're taking great steps by tracking your finances! Implementing even 2-3 of these tips could save you ₹${Math.round(data.summary.totalIncome * 0.1).toLocaleString('en-IN')} monthly.`
  };
};

const generateMockChatResponse = (message, data) => {
  const lowerMessage = message.toLowerCase();
  
  // Check for common financial questions
  if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
    return `Based on your financial data, you're currently saving ₹${data.summary.savings.toLocaleString('en-IN')} per month (${data.summary.savingsRate}% of income). ${
      data.summary.savingsRate >= 20 
        ? 'Great job! You\'re meeting the recommended 20% savings rate.'
        : `To reach the ideal 20% savings rate, try to save an additional ₹${Math.round(data.summary.totalIncome * 0.2 - data.summary.savings).toLocaleString('en-IN')} monthly.`
    } Would you like specific tips on how to increase your savings?`;
  }
  
  if (lowerMessage.includes('spend') || lowerMessage.includes('expense')) {
    return `Your total monthly expenses are ₹${data.summary.totalExpenses.toLocaleString('en-IN')}. Your top spending category is ${data.topCategories[0]?.category} at ₹${data.topCategories[0]?.amount.toLocaleString('en-IN')} (${data.topCategories[0]?.percentage}% of expenses). Would you like suggestions on optimizing spending in any particular category?`;
  }
  
  if (lowerMessage.includes('budget')) {
    return `For your income of ₹${data.summary.totalIncome.toLocaleString('en-IN')}, I recommend the 50/30/20 budget:\n\n• **Needs (50%):** ₹${Math.round(data.summary.totalIncome * 0.5).toLocaleString('en-IN')} for essentials\n• **Wants (30%):** ₹${Math.round(data.summary.totalIncome * 0.3).toLocaleString('en-IN')} for lifestyle\n• **Savings (20%):** ₹${Math.round(data.summary.totalIncome * 0.2).toLocaleString('en-IN')} for future goals\n\nWould you like me to create a detailed budget plan for your categories?`;
  }
  
  if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
    return `Great question about investments! With your current savings of ₹${data.summary.savings.toLocaleString('en-IN')}/month, here are some options:\n\n• **Emergency Fund:** First, ensure 6 months of expenses saved\n• **PPF/EPF:** Tax-saving with guaranteed returns\n• **Mutual Funds:** SIP starting ₹500/month for long-term growth\n• **Fixed Deposits:** For short-term, guaranteed returns\n\nWhat's your investment timeline and risk tolerance?`;
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `Hello! 👋 I'm FinanceAI, your personal financial advisor. I can see you have ₹${data.summary.totalIncome.toLocaleString('en-IN')} in income and ₹${data.summary.totalExpenses.toLocaleString('en-IN')} in expenses this month. How can I help you today? I can assist with:\n\n• Spending analysis\n• Budget planning\n• Savings tips\n• Investment guidance`;
  }
  
  // Default response
  return `Thanks for your question! Based on your financial profile:\n\n• **Monthly Income:** ₹${data.summary.totalIncome.toLocaleString('en-IN')}\n• **Monthly Expenses:** ₹${data.summary.totalExpenses.toLocaleString('en-IN')}\n• **Current Savings:** ₹${data.summary.savings.toLocaleString('en-IN')} (${data.summary.savingsRate}%)\n• **Top Category:** ${data.topCategories[0]?.category}\n\nI can help you with spending analysis, budget planning, savings tips, or investment advice. What would you like to explore?`;
};

// Helper function to get transaction data for analysis
const getTransactionData = async (userId, startDate, endDate) => {
  const query = { user: userId };
  
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query.date = { $gte: thirtyDaysAgo };
  }

  const transactions = await Transaction.find(query).sort({ date: -1 });
  
  // Calculate summaries
  const summary = {
    totalIncome: 0,
    totalExpenses: 0,
    categoryBreakdown: {},
    transactionCount: transactions.length
  };

  transactions.forEach(t => {
    if (t.type === 'income') {
      summary.totalIncome += t.amount;
    } else {
      summary.totalExpenses += t.amount;
      summary.categoryBreakdown[t.category] = (summary.categoryBreakdown[t.category] || 0) + t.amount;
    }
  });

  summary.savings = summary.totalIncome - summary.totalExpenses;
  summary.savingsRate = summary.totalIncome > 0 
    ? ((summary.savings / summary.totalIncome) * 100).toFixed(1) 
    : 0;

  // Sort categories by spending
  const sortedCategories = Object.entries(summary.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / summary.totalExpenses) * 100).toFixed(1)
    }));

  return {
    transactions: transactions.slice(0, 50), // Limit for AI context
    summary,
    topCategories: sortedCategories.slice(0, 10)
  };
};

// @route   POST /api/analysis/spending
// @desc    Get AI-powered spending analysis
// @access  Private
router.post('/spending', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const data = await getTransactionData(req.userId, startDate, endDate);

    if (data.transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions found for analysis. Please add some transactions first.'
      });
    }

    const prompt = `You are a professional financial advisor AI. Analyze the following spending data and provide personalized insights.

User's Financial Summary:
- Total Income: ₹${data.summary.totalIncome.toLocaleString('en-IN')}
- Total Expenses: ₹${data.summary.totalExpenses.toLocaleString('en-IN')}
- Net Savings: ₹${data.summary.savings.toLocaleString('en-IN')}
- Savings Rate: ${data.summary.savingsRate}%
- Number of Transactions: ${data.summary.transactionCount}

Top Spending Categories:
${data.topCategories.map(c => `- ${c.category}: ₹${c.amount.toLocaleString('en-IN')} (${c.percentage}%)`).join('\n')}

Please provide:
1. A brief overall assessment (2-3 sentences)
2. 3 key insights about spending patterns
3. 3 specific, actionable recommendations to improve financial health
4. Any concerning spending patterns you notice
5. Positive financial behaviors to continue

Format your response as JSON with this structure:
{
  "overallAssessment": "string",
  "insights": [{"title": "string", "description": "string", "impact": "positive|negative|neutral"}],
  "recommendations": [{"title": "string", "action": "string", "potentialSavings": "string"}],
  "concerns": ["string"],
  "positives": ["string"]
}`;

    let aiAnalysis;
    
    // Try OpenAI first, fallback to mock if quota exceeded
    if (useOpenAI) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert financial advisor providing personalized spending analysis. Always respond with valid JSON only.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        try {
          aiAnalysis = JSON.parse(completion.choices[0].message.content);
        } catch (parseError) {
          aiAnalysis = {
            overallAssessment: completion.choices[0].message.content,
            insights: [],
            recommendations: [],
            concerns: [],
            positives: []
          };
        }
      } catch (openaiError) {
        console.log('OpenAI unavailable, using intelligent fallback:', openaiError.code);
        if (openaiError.code === 'insufficient_quota' || openaiError.status === 429) {
          useOpenAI = false; // Disable for future requests this session
        }
        aiAnalysis = generateMockSpendingAnalysis(data);
      }
    } else {
      aiAnalysis = generateMockSpendingAnalysis(data);
    }

    // Save analysis to database
    const analysis = await Analysis.create({
      user: req.userId,
      type: 'spending_analysis',
      period: { startDate: startDate || new Date(Date.now() - 30*24*60*60*1000), endDate: endDate || new Date() },
      summary: aiAnalysis.overallAssessment,
      aiResponse: JSON.stringify(aiAnalysis),
      metrics: {
        totalIncome: data.summary.totalIncome,
        totalExpenses: data.summary.totalExpenses,
        savings: data.summary.savings,
        savingsRate: parseFloat(data.summary.savingsRate),
        topCategories: data.topCategories
      },
      insights: aiAnalysis.insights?.map(i => ({
        title: i.title,
        description: i.description,
        impact: i.impact,
        priority: 'medium',
        actionable: true
      })) || [],
      recommendations: aiAnalysis.recommendations?.map(r => r.action) || []
    });

    res.json({
      success: true,
      data: {
        analysis: aiAnalysis,
        metrics: data.summary,
        topCategories: data.topCategories,
        analysisId: analysis._id
      }
    });
  } catch (error) {
    console.error('Spending analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing spending analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/analysis/budget-suggestions
// @desc    Get AI-powered budget suggestions
// @access  Private
router.post('/budget-suggestions', auth, async (req, res) => {
  try {
    const data = await getTransactionData(req.userId);

    if (data.transactions.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 5 transactions for budget suggestions'
      });
    }

    const prompt = `As a financial advisor, analyze this spending data and suggest optimal monthly budgets for each category.

Current Monthly Spending:
${data.topCategories.map(c => `- ${c.category}: ₹${c.amount.toLocaleString('en-IN')}`).join('\n')}

Total Monthly Income: ₹${data.summary.totalIncome.toLocaleString('en-IN')}
Total Monthly Expenses: ₹${data.summary.totalExpenses.toLocaleString('en-IN')}

Provide budget recommendations following the 50/30/20 rule (50% needs, 30% wants, 20% savings).
Consider Indian cost of living and spending patterns.

Respond with JSON:
{
  "suggestedBudgets": [
    {"category": "string", "currentSpending": number, "suggestedLimit": number, "reason": "string", "priority": "essential|important|optional"}
  ],
  "totalSuggestedBudget": number,
  "projectedSavings": number,
  "tips": ["string"]
}`;

    let budgetSuggestions;
    
    if (useOpenAI) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a budget planning expert. Provide practical, achievable budget recommendations. Always respond with valid JSON only.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        try {
          budgetSuggestions = JSON.parse(completion.choices[0].message.content);
        } catch (parseError) {
          budgetSuggestions = generateMockBudgetSuggestions(data);
        }
      } catch (openaiError) {
        console.log('OpenAI unavailable for budget suggestions, using fallback');
        if (openaiError.code === 'insufficient_quota' || openaiError.status === 429) {
          useOpenAI = false;
        }
        budgetSuggestions = generateMockBudgetSuggestions(data);
      }
    } else {
      budgetSuggestions = generateMockBudgetSuggestions(data);
    }

    res.json({
      success: true,
      data: {
        budgetSuggestions,
        currentSpending: data.topCategories
      }
    });
  } catch (error) {
    console.error('Budget suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating budget suggestions'
    });
  }
});

// @route   POST /api/analysis/savings-tips
// @desc    Get personalized savings tips
// @access  Private
router.post('/savings-tips', auth, async (req, res) => {
  try {
    const data = await getTransactionData(req.userId);

    const prompt = `Analyze this user's spending and provide 5 personalized, actionable savings tips.

Monthly Financial Summary:
- Income: ₹${data.summary.totalIncome.toLocaleString('en-IN')}
- Expenses: ₹${data.summary.totalExpenses.toLocaleString('en-IN')}
- Current Savings: ₹${data.summary.savings.toLocaleString('en-IN')} (${data.summary.savingsRate}%)

Top Spending Categories:
${data.topCategories.slice(0, 5).map(c => `- ${c.category}: ₹${c.amount.toLocaleString('en-IN')}`).join('\n')}

Recent Transactions Sample:
${data.transactions.slice(0, 10).map(t => `- ${t.category}: ₹${t.amount} - ${t.description || 'No description'}`).join('\n')}

Provide specific, actionable tips based on their actual spending patterns.
Focus on realistic changes that can save money without drastically changing lifestyle.

Respond with JSON:
{
  "tips": [
    {
      "title": "string",
      "description": "string",
      "potentialMonthlySavings": number,
      "difficulty": "easy|medium|hard",
      "category": "string",
      "actionSteps": ["string"]
    }
  ],
  "totalPotentialSavings": number,
  "motivationalMessage": "string"
}`;

    let savingsTips;
    
    if (useOpenAI) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a friendly financial coach providing practical savings advice for Indian users. Be encouraging and specific. Always respond with valid JSON only.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 1000
        });

        try {
          savingsTips = JSON.parse(completion.choices[0].message.content);
        } catch (parseError) {
          savingsTips = generateMockSavingsTips(data);
        }
      } catch (openaiError) {
        console.log('OpenAI unavailable for savings tips, using fallback');
        if (openaiError.code === 'insufficient_quota' || openaiError.status === 429) {
          useOpenAI = false;
        }
        savingsTips = generateMockSavingsTips(data);
      }
    } else {
      savingsTips = generateMockSavingsTips(data);
    }

    res.json({
      success: true,
      data: savingsTips
    });
  } catch (error) {
    console.error('Savings tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating savings tips'
    });
  }
});

// @route   POST /api/analysis/chat
// @desc    Chat with AI financial advisor
// @access  Private
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }

    const data = await getTransactionData(req.userId);

    let responseText;
    
    if (useOpenAI) {
      try {
        const systemPrompt = `You are FinanceAI, a helpful personal finance advisor chatbot. 
You have access to the user's financial data:
- Total Income: ₹${data.summary.totalIncome.toLocaleString('en-IN')}
- Total Expenses: ₹${data.summary.totalExpenses.toLocaleString('en-IN')}
- Savings: ₹${data.summary.savings.toLocaleString('en-IN')}
- Top categories: ${data.topCategories.slice(0, 5).map(c => c.category).join(', ')}

Provide helpful, personalized financial advice. Be conversational, encouraging, and practical.
For Indian users, use ₹ for currency and consider local context.
Keep responses concise but informative.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...(context || []),
            { role: 'user', content: message }
          ],
          temperature: 0.8,
          max_tokens: 500
        });
        
        responseText = completion.choices[0].message.content;
      } catch (openaiError) {
        console.log('OpenAI unavailable for chat, using fallback');
        if (openaiError.code === 'insufficient_quota' || openaiError.status === 429) {
          useOpenAI = false;
        }
        responseText = generateMockChatResponse(message, data);
      }
    } else {
      responseText = generateMockChatResponse(message, data);
    }

    res.json({
      success: true,
      data: {
        response: responseText,
        role: 'assistant'
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat message'
    });
  }
});

// @route   GET /api/analysis/history
// @desc    Get analysis history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    const query = { user: req.userId };
    if (type) query.type = type;

    const analyses = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('type summary createdAt metrics.totalExpenses metrics.savings');

    res.json({
      success: true,
      data: { analyses }
    });
  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analysis history'
    });
  }
});

module.exports = router;
