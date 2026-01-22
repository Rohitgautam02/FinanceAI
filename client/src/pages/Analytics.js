import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
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
import { Line, Bar, Pie } from 'react-chartjs-2';
import { FiCalendar, FiTrendingUp, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import './Analytics.css';

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

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [categories, setCategories] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const [categoryRes, trendRes, summaryRes] = await Promise.all([
          dashboardAPI.getCategoryBreakdown(period),
          dashboardAPI.getMonthlyTrend(12),
          dashboardAPI.getSummary(period)
        ]);

        setCategories(categoryRes.data.data.categories);
        setMonthlyTrend(trendRes.data.data.trend);
        setSummary(summaryRes.data.data);
      } catch (error) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [period]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const chartColors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#06B6D4', '#EF4444', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#A855F7', '#22C55E', '#0EA5E9'
  ];

  // Category Pie Chart
  const categoryPieData = {
    labels: categories.slice(0, 8).map(c => c.category),
    datasets: [{
      data: categories.slice(0, 8).map(c => c.amount),
      backgroundColor: chartColors,
      borderWidth: 0
    }]
  };

  // Monthly Bar Chart
  const monthlyBarData = {
    labels: monthlyTrend.map(m => m.label),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrend.map(m => m.income),
        backgroundColor: '#10B981',
        borderRadius: 6
      },
      {
        label: 'Expenses',
        data: monthlyTrend.map(m => m.expense),
        backgroundColor: '#EF4444',
        borderRadius: 6
      }
    ]
  };

  // Savings Trend Line Chart
  const savingsLineData = {
    labels: monthlyTrend.map(m => m.label),
    datasets: [{
      label: 'Monthly Savings',
      data: monthlyTrend.map(m => m.savings),
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#8B5CF6',
      pointRadius: 5
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94A3B8',
          padding: 20,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => `${context.dataset.label || ''}: ${formatCurrency(context.raw)}`
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

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94A3B8',
          padding: 12,
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Analyzing your financial data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Deep dive into your spending patterns</p>
        </div>
        <div className="period-selector">
          {['week', 'month', 'quarter', 'year'].map(p => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-row">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiTrendingUp className="stat-icon income" />
          <div>
            <span className="stat-label">Total Income</span>
            <span className="stat-value">{formatCurrency(summary?.currentMonth?.income || 0)}</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FiBarChart2 className="stat-icon expense" />
          <div>
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">{formatCurrency(summary?.currentMonth?.expenses || 0)}</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FiPieChart className="stat-icon savings" />
          <div>
            <span className="stat-label">Net Savings</span>
            <span className="stat-value">{formatCurrency(summary?.currentMonth?.balance || 0)}</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FiCalendar className="stat-icon rate" />
          <div>
            <span className="stat-label">Savings Rate</span>
            <span className="stat-value">{summary?.currentMonth?.savingsRate || 0}%</span>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <motion.div
          className="chart-card large"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3>Income vs Expenses (12 Months)</h3>
          <div className="chart-wrapper">
            <Bar data={monthlyBarData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>Spending by Category</h3>
          <div className="chart-wrapper pie">
            <Pie data={categoryPieData} options={pieOptions} />
          </div>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3>Savings Trend</h3>
          <div className="chart-wrapper">
            <Line data={savingsLineData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown Table */}
      <motion.div
        className="breakdown-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3>Category Breakdown</h3>
        <div className="breakdown-table">
          <div className="breakdown-header">
            <span>Category</span>
            <span>Transactions</span>
            <span>Amount</span>
            <span>Percentage</span>
          </div>
          {categories.map((cat, index) => (
            <div key={cat.category} className="breakdown-row">
              <div className="category-info">
                <span
                  className="category-dot"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                ></span>
                <span>{cat.category}</span>
              </div>
              <span className="count">{cat.count}</span>
              <span className="amount">{formatCurrency(cat.amount)}</span>
              <div className="percentage-bar">
                <div
                  className="percentage-fill"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: chartColors[index % chartColors.length]
                  }}
                ></div>
                <span>{cat.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
