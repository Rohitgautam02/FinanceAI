import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { analysisAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiSend,
  FiRefreshCw,
  FiTrendingUp,
  FiTarget,
  FiDollarSign,
  FiMessageCircle,
  FiZap,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo
} from 'react-icons/fi';
import './AIAdvisor.css';

const AIAdvisor = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your AI Financial Advisor. I can help you analyze your spending, suggest budgets, and provide personalized savings tips. What would you like to know about your finances?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [budgetSuggestions, setBudgetSuggestions] = useState(null);
  const [savingsTips, setSavingsTips] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const context = chatMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await analysisAPI.chat(userMessage, context);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.data.response
      }]);
    } catch (error) {
      toast.error('Failed to get response');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const fetchSpendingAnalysis = async () => {
    setLoading(true);
    try {
      const response = await analysisAPI.getSpendingAnalysis({});
      setAnalysis(response.data.data);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to analyze spending');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetSuggestions = async () => {
    setLoading(true);
    try {
      const response = await analysisAPI.getBudgetSuggestions();
      setBudgetSuggestions(response.data.data);
      toast.success('Budget suggestions ready!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavingsTips = async () => {
    setLoading(true);
    try {
      const response = await analysisAPI.getSavingsTips();
      setSavingsTips(response.data.data);
      toast.success('Savings tips ready!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to get tips');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const quickQuestions = [
    "How much did I spend on food this month?",
    "Am I saving enough money?",
    "What's my biggest expense category?",
    "Give me tips to reduce spending",
    "How does my spending compare to last month?"
  ];

  return (
    <div className="ai-advisor-page">
      <div className="page-header">
        <div>
          <h1>AI Financial Advisor</h1>
          <p>Get personalized financial insights powered by AI</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="advisor-tabs">
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <FiMessageCircle /> Chat with AI
        </button>
        <button
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <FiTrendingUp /> Spending Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <FiTarget /> Budget Suggestions
        </button>
        <button
          className={`tab-btn ${activeTab === 'tips' ? 'active' : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          <FiDollarSign /> Savings Tips
        </button>
      </div>

      {/* Tab Content */}
      <div className="advisor-content">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <motion.div
            className="chat-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`message ${message.role}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="message-content typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="quick-questions">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-btn"
                  onClick={() => setInputMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="chat-input-container">
              <textarea
                className="chat-input"
                placeholder="Ask me anything about your finances..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                disabled={loading}
              />
              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
              >
                <FiSend />
              </button>
            </div>
          </motion.div>
        )}

        {/* Spending Analysis Tab */}
        {activeTab === 'analysis' && (
          <motion.div
            className="analysis-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {!analysis ? (
              <div className="generate-section">
                <div className="generate-icon">
                  <FiZap />
                </div>
                <h2>Analyze Your Spending</h2>
                <p>Get AI-powered insights about your spending patterns, habits, and areas for improvement.</p>
                <button
                  className="btn btn-primary"
                  onClick={fetchSpendingAnalysis}
                  disabled={loading}
                >
                  {loading ? <FiRefreshCw className="spin" /> : <FiTrendingUp />}
                  {loading ? 'Analyzing...' : 'Generate Analysis'}
                </button>
              </div>
            ) : (
              <div className="analysis-results">
                <div className="analysis-header">
                  <h2>Your Spending Analysis</h2>
                  <button className="btn btn-secondary" onClick={fetchSpendingAnalysis} disabled={loading}>
                    <FiRefreshCw /> Refresh
                  </button>
                </div>

                <div className="analysis-summary">
                  <p>{analysis.analysis?.overallAssessment}</p>
                </div>

                <div className="analysis-grid">
                  {/* Insights */}
                  <div className="analysis-card">
                    <h3><FiInfo /> Key Insights</h3>
                    <div className="insights-list">
                      {analysis.analysis?.insights?.map((insight, index) => (
                        <div key={index} className={`insight-item ${insight.impact}`}>
                          <div className="insight-icon">
                            {insight.impact === 'positive' ? <FiCheckCircle /> :
                             insight.impact === 'negative' ? <FiAlertCircle /> : <FiInfo />}
                          </div>
                          <div>
                            <strong>{insight.title}</strong>
                            <p>{insight.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="analysis-card">
                    <h3><FiTarget /> Recommendations</h3>
                    <div className="recommendations-list">
                      {analysis.analysis?.recommendations?.map((rec, index) => (
                        <div key={index} className="recommendation-item">
                          <span className="rec-number">{index + 1}</span>
                          <div>
                            <strong>{rec.title}</strong>
                            <p>{rec.action}</p>
                            {rec.potentialSavings && (
                              <span className="savings-tag">
                                Potential savings: {rec.potentialSavings}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Concerns & Positives */}
                <div className="feedback-grid">
                  {analysis.analysis?.concerns?.length > 0 && (
                    <div className="feedback-card concerns">
                      <h4><FiAlertCircle /> Areas of Concern</h4>
                      <ul>
                        {analysis.analysis.concerns.map((concern, index) => (
                          <li key={index}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.analysis?.positives?.length > 0 && (
                    <div className="feedback-card positives">
                      <h4><FiCheckCircle /> What You're Doing Well</h4>
                      <ul>
                        {analysis.analysis.positives.map((positive, index) => (
                          <li key={index}>{positive}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Budget Suggestions Tab */}
        {activeTab === 'budget' && (
          <motion.div
            className="budget-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {!budgetSuggestions ? (
              <div className="generate-section">
                <div className="generate-icon">
                  <FiTarget />
                </div>
                <h2>Get Budget Suggestions</h2>
                <p>Let AI analyze your spending and suggest optimal budgets for each category.</p>
                <button
                  className="btn btn-primary"
                  onClick={fetchBudgetSuggestions}
                  disabled={loading}
                >
                  {loading ? <FiRefreshCw className="spin" /> : <FiTarget />}
                  {loading ? 'Generating...' : 'Generate Budgets'}
                </button>
              </div>
            ) : (
              <div className="budget-results">
                <div className="analysis-header">
                  <h2>Suggested Budgets</h2>
                  <button className="btn btn-secondary" onClick={fetchBudgetSuggestions} disabled={loading}>
                    <FiRefreshCw /> Refresh
                  </button>
                </div>

                <div className="budget-list">
                  {budgetSuggestions.budgetSuggestions?.suggestedBudgets?.map((budget, index) => (
                    <div key={index} className="budget-suggestion-card">
                      <div className="budget-header">
                        <span className="budget-category">{budget.category}</span>
                        <span className={`priority-badge ${budget.priority}`}>
                          {budget.priority}
                        </span>
                      </div>
                      <div className="budget-amounts">
                        <div className="current">
                          <span>Current</span>
                          <strong>{formatCurrency(budget.currentSpending)}</strong>
                        </div>
                        <div className="arrow">→</div>
                        <div className="suggested">
                          <span>Suggested</span>
                          <strong>{formatCurrency(budget.suggestedLimit)}</strong>
                        </div>
                      </div>
                      <p className="budget-reason">{budget.reason}</p>
                    </div>
                  ))}
                </div>

                {budgetSuggestions.budgetSuggestions?.tips?.length > 0 && (
                  <div className="budget-tips">
                    <h3>💡 Tips</h3>
                    <ul>
                      {budgetSuggestions.budgetSuggestions.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Savings Tips Tab */}
        {activeTab === 'tips' && (
          <motion.div
            className="tips-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {!savingsTips ? (
              <div className="generate-section">
                <div className="generate-icon">
                  <FiDollarSign />
                </div>
                <h2>Get Savings Tips</h2>
                <p>Receive personalized tips to help you save more money based on your spending habits.</p>
                <button
                  className="btn btn-primary"
                  onClick={fetchSavingsTips}
                  disabled={loading}
                >
                  {loading ? <FiRefreshCw className="spin" /> : <FiDollarSign />}
                  {loading ? 'Generating...' : 'Get Tips'}
                </button>
              </div>
            ) : (
              <div className="tips-results">
                <div className="analysis-header">
                  <h2>Your Personalized Savings Tips</h2>
                  <button className="btn btn-secondary" onClick={fetchSavingsTips} disabled={loading}>
                    <FiRefreshCw /> Refresh
                  </button>
                </div>

                {savingsTips.motivationalMessage && (
                  <div className="motivation-banner">
                    💪 {savingsTips.motivationalMessage}
                  </div>
                )}

                <div className="tips-grid">
                  {savingsTips.tips?.map((tip, index) => (
                    <div key={index} className="tip-card">
                      <div className="tip-header">
                        <span className="tip-number">{index + 1}</span>
                        <span className={`difficulty-badge ${tip.difficulty}`}>
                          {tip.difficulty}
                        </span>
                      </div>
                      <h4>{tip.title}</h4>
                      <p>{tip.description}</p>
                      {tip.potentialMonthlySavings > 0 && (
                        <div className="savings-potential">
                          <FiDollarSign />
                          <span>Save up to {formatCurrency(tip.potentialMonthlySavings)}/month</span>
                        </div>
                      )}
                      {tip.actionSteps?.length > 0 && (
                        <div className="action-steps">
                          <strong>Action Steps:</strong>
                          <ul>
                            {tip.actionSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {savingsTips.totalPotentialSavings > 0 && (
                  <div className="total-savings">
                    <h3>Total Potential Monthly Savings</h3>
                    <span className="savings-amount">
                      {formatCurrency(savingsTips.totalPotentialSavings)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AIAdvisor;
