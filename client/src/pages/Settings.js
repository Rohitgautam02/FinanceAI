import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI, dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiLock,
  FiTarget,
  FiSave,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';
import './Settings.css';

const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Shopping', 'Transportation', 'Bills & Utilities',
  'Entertainment', 'Healthcare', 'Education', 'Travel', 'Groceries',
  'Rent', 'Insurance', 'Subscriptions', 'Personal Care', 'Gifts & Donations'
];

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    currency: user?.currency || 'INR',
    monthlyBudget: user?.monthlyBudget || 0,
    savingsGoal: user?.savingsGoal || 0
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Budgets State
  const [budgets, setBudgets] = useState([]);
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(profileData);
      updateUser(response.data.data.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.limit) {
      toast.error('Please select category and enter limit');
      return;
    }

    setLoading(true);
    try {
      await dashboardAPI.saveBudget({
        category: newBudget.category,
        limit: parseFloat(newBudget.limit)
      });
      toast.success('Budget added!');
      setNewBudget({ category: '', limit: '' });
      // Refresh budgets
      const response = await dashboardAPI.getBudgetStatus();
      setBudgets(response.data.data.budgetStatus);
    } catch (error) {
      toast.error('Failed to add budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (category) => {
    if (!window.confirm(`Delete budget for ${category}?`)) return;

    try {
      await dashboardAPI.deleteBudget(category);
      setBudgets(prev => prev.filter(b => b.category !== category));
      toast.success('Budget deleted');
    } catch (error) {
      toast.error('Failed to delete budget');
    }
  };

  // Load budgets on tab switch
  React.useEffect(() => {
    if (activeTab === 'budgets') {
      const loadBudgets = async () => {
        try {
          const response = await dashboardAPI.getBudgetStatus();
          setBudgets(response.data.data.budgetStatus);
        } catch (error) {
          console.error('Failed to load budgets');
        }
      };
      loadBudgets();
    }
  }, [activeTab]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div className="settings-container">
        {/* Sidebar */}
        <div className="settings-sidebar">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <FiLock /> Password
          </button>
          <button
            className={`settings-tab ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('budgets')}
          >
            <FiTarget /> Budgets
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              className="settings-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2><FiUser /> Profile Settings</h2>
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={user?.email || ''}
                    disabled
                  />
                  <span className="hint">Email cannot be changed</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Currency</label>
                    <select
                      className="input"
                      value={profileData.currency}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currency: e.target.value }))}
                    >
                      <option value="INR">₹ INR (Indian Rupee)</option>
                      <option value="USD">$ USD (US Dollar)</option>
                      <option value="EUR">€ EUR (Euro)</option>
                      <option value="GBP">£ GBP (British Pound)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Monthly Budget Goal</label>
                    <input
                      type="number"
                      className="input"
                      value={profileData.monthlyBudget}
                      onChange={(e) => setProfileData(prev => ({ ...prev, monthlyBudget: e.target.value }))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Monthly Savings Goal</label>
                  <input
                    type="number"
                    className="input"
                    value={profileData.savingsGoal}
                    onChange={(e) => setProfileData(prev => ({ ...prev, savingsGoal: e.target.value }))}
                    min="0"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <motion.div
              className="settings-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2><FiLock /> Change Password</h2>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <FiLock /> {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Budgets Tab */}
          {activeTab === 'budgets' && (
            <motion.div
              className="settings-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2><FiTarget /> Budget Settings</h2>
              
              {/* Add New Budget */}
              <div className="add-budget-section">
                <h3>Add Category Budget</h3>
                <div className="add-budget-form">
                  <select
                    className="input"
                    value={newBudget.category}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select Category</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input"
                    placeholder="Monthly Limit"
                    value={newBudget.limit}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, limit: e.target.value }))}
                    min="0"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleAddBudget}
                    disabled={loading}
                  >
                    <FiPlus /> Add
                  </button>
                </div>
              </div>

              {/* Existing Budgets */}
              <div className="budgets-list">
                <h3>Your Budgets</h3>
                {budgets.length === 0 ? (
                  <p className="no-budgets">No budgets set yet. Add your first budget above.</p>
                ) : (
                  <div className="budget-items">
                    {budgets.map((budget) => (
                      <div key={budget.category} className="budget-item">
                        <div className="budget-info">
                          <span className="budget-category">{budget.category}</span>
                          <span className="budget-limit">{formatCurrency(budget.limit)}/month</span>
                        </div>
                        <div className="budget-progress-wrapper">
                          <div className="budget-bar">
                            <div
                              className={`budget-fill ${budget.status}`}
                              style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="budget-percentage">{budget.percentage}%</span>
                        </div>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteBudget(budget.category)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
