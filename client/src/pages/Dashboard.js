import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPieChart,
  FiArrowUp,
  FiArrowDown,
  FiCalendar
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {

  const [period, setPeriod] = useState('month');
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const summaryRes = await dashboardAPI.getSummary(period);
      const categoryRes = await dashboardAPI.getCategoryBreakdown(period);
      const trendRes = await dashboardAPI.getMonthlyTrend(months);
      const recentRes = await dashboardAPI.getRecentTransactions(5);
      const budgetRes = await dashboardAPI.getBudgetStatus();

      setSummary(summaryRes.data.data);
      setCategories(categoryRes.data.data.categories);
      setMonthlyTrend(trendRes.data.data.trend);
      setRecentTransactions(recentRes.data.data.transactions);
      setBudgetStatus(budgetRes.data.data.budgetStatus);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
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

  // Chart colors
  const chartColors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#06B6D4', '#EF4444', '#84CC16', '#F97316', '#6366F1'
  ];

  // Spending by Category Chart
  const categoryChartData = {
    labels: categories.slice(0, 6).map(c => c.category),
    datasets: [{
      data: categories.slice(0, 6).map(c => c.amount),
      backgroundColor: chartColors,
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94A3B8',
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };

  // Monthly Trend Chart
  const trendChartData = {
    labels: monthlyTrend.map(m => m.label),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrend.map(m => m.income),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10B981'
      },
      {
        label: 'Expenses',
        data: monthlyTrend.map(m => m.expense),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#EF4444'
      }
    ]
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94A3B8',
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#334155', drawBorder: false },
        ticks: { color: '#94A3B8' }
      },
      y: {
        grid: { color: '#334155', drawBorder: false },
        ticks: {
          color: '#94A3B8',
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your financial data...</p>
      </div>
    );
  }


  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Your financial overview at a glance</p>
        </div>
        <div className="dashboard-period-filter">
          <button className={`period-btn${period === 'week' ? ' active' : ''}`} onClick={() => setPeriod('week')}>Week</button>
          <button className={`period-btn${period === 'month' ? ' active' : ''}`} onClick={() => setPeriod('month')}>Month</button>
          <button className={`period-btn${period === 'quarter' ? ' active' : ''}`} onClick={() => setPeriod('quarter')}>Quarter</button>
          <button className={`period-btn${period === 'year' ? ' active' : ''}`} onClick={() => setPeriod('year')}>Year</button>
          <button className={`period-btn${period === 'all' ? ' active' : ''}`} onClick={() => setPeriod('all')}>All Time</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <motion.div
          className="summary-card income"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-icon income">
            <FiTrendingUp />
          </div>
          <div className="card-content">
            <p className="card-label">Total Income</p>
            <h3 className="card-value">{formatCurrency(summary?.currentMonth?.income || 0)}</h3>
            <div className={`card-change ${summary?.changes?.income >= 0 ? 'positive' : 'negative'}`}>
              {summary?.changes?.income >= 0 ? <FiArrowUp /> : <FiArrowDown />}
              <span>{Math.abs(summary?.changes?.income || 0)}% from last month</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="summary-card expense"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-icon expense">
            <FiTrendingDown />
          </div>
          <div className="card-content">
            <p className="card-label">Total Expenses</p>
            <h3 className="card-value">{formatCurrency(summary?.currentMonth?.expenses || 0)}</h3>
            <div className={`card-change ${summary?.changes?.expenses <= 0 ? 'positive' : 'negative'}`}>
              {summary?.changes?.expenses <= 0 ? <FiArrowDown /> : <FiArrowUp />}
              <span>{Math.abs(summary?.changes?.expenses || 0)}% from last month</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="summary-card balance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-icon balance">
            <FiDollarSign />
          </div>
          <div className="card-content">
            <p className="card-label">Net Balance</p>
            <h3 className={`card-value ${summary?.currentMonth?.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(summary?.currentMonth?.balance || 0)}
            </h3>
            <div className="card-change neutral">
              <span>This month</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="summary-card savings"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-icon savings">
            <FiPieChart />
          </div>
          <div className="card-content">
            <p className="card-label">Savings Rate</p>
            <h3 className="card-value">{summary?.currentMonth?.savingsRate || 0}%</h3>
            <div className="card-change neutral">
              <span>of income saved</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="chart-title">Income vs Expenses Trend</h3>
          <div className="chart-container trend-chart">
            {monthlyTrend.length > 0 ? (
              <Line data={trendChartData} options={trendChartOptions} />
            ) : (
              <div className="no-data">No trend data available</div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="chart-title">Spending by Category</h3>
          <div className="chart-container doughnut-chart">
            {categories.length > 0 ? (
              <Doughnut data={categoryChartData} options={categoryChartOptions} />
            ) : (
              <div className="no-data">No spending data available</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-grid">
        {/* Recent Transactions */}
        <motion.div
          className="card transactions-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="section-title">Recent Transactions</h3>
          <div className="transactions-list">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction._id} className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-category">{transaction.category}</span>
                    <span className="transaction-desc">{transaction.description || transaction.merchant}</span>
                  </div>
                  <span className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-data">No recent transactions</p>
            )}
          </div>
        </motion.div>

        {/* Budget Progress */}
        <motion.div
          className="card budget-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="section-title">Budget Status</h3>
          <div className="budget-list">
            {budgetStatus.length > 0 ? (
              budgetStatus.slice(0, 5).map((budget) => (
                <div key={budget.category} className="budget-item">
                  <div className="budget-header">
                    <span className="budget-category">{budget.category}</span>
                    <span className="budget-values">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </span>
                  </div>
                  <div className="budget-bar">
                    <div
                      className={`budget-progress ${budget.status}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No budgets set. Set budgets in Settings.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
