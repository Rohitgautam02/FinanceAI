import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transactionAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiFilter,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import './Transactions.css';

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other Income'],
  expense: [
    'Food & Dining', 'Shopping', 'Transportation', 'Bills & Utilities',
    'Entertainment', 'Healthcare', 'Education', 'Travel', 'Groceries',
    'Rent', 'Insurance', 'Subscriptions', 'Personal Care', 'Gifts & Donations', 'Other Expense'
  ]
};

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Other'];

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 15,
    type: '',
    category: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    merchant: '',
    notes: ''
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAll(filters);
      setTransactions(response.data.data.transactions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 15,
      type: '',
      category: '',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.category) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingTransaction) {
        await transactionAPI.update(editingTransaction._id, formData);
        toast.success('Transaction updated');
      } else {
        await transactionAPI.create(formData);
        toast.success('Transaction added');
      }
      closeModal();
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await transactionAPI.delete(id);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const openModal = (transaction = null) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
        paymentMethod: transaction.paymentMethod || 'Other',
        merchant: transaction.merchant || '',
        notes: transaction.notes || ''
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
        merchant: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Manage your income and expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FiPlus /> Add Transaction
        </button>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <button
          className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> Filters
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filters-grid">
              <div className="filter-group">
                <label>Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="input"
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input"
                >
                  <option value="">All Categories</option>
                  <optgroup label="Income">
                    {CATEGORIES.income.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Expense">
                    {CATEGORIES.expense.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="input"
                />
              </div>

              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions Table */}
      <div className="transactions-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
            <button className="btn btn-primary" onClick={() => openModal()}>
              Add your first transaction
            </button>
          </div>
        ) : (
          <>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="date-cell">{formatDate(transaction.date)}</td>
                    <td className="desc-cell">
                      <span className="merchant">{transaction.merchant || transaction.category}</span>
                      {transaction.description && (
                        <span className="description">{transaction.description}</span>
                      )}
                    </td>
                    <td>
                      <span className={`category-badge ${transaction.type}`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="payment-cell">{transaction.paymentMethod}</td>
                    <td className={`amount-cell ${transaction.type}`}>
                      {transaction.type === 'income'
                        ? `+${formatCurrency(transaction.amount)}`
                        : `-${formatCurrency(Math.abs(transaction.amount))}`}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit"
                        onClick={() => openModal(transaction)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(transaction._id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems}
                </span>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={pagination.currentPage <= 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: pagination.currentPage - 1 }))}
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="page-number">{pagination.currentPage} / {pagination.totalPages}</span>
                  <button
                    className="pagination-btn"
                    disabled={pagination.currentPage >= pagination.totalPages}
                    onClick={() => setFilters(prev => ({ ...prev, page: pagination.currentPage + 1 }))}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
                <button className="close-btn" onClick={closeModal}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${formData.type === 'income' ? 'active income' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
                  >
                    Income
                  </button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Amount *</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Date *</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Category *</label>
                  <select
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES[formData.type].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Merchant</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Amazon, Swiggy"
                      value={formData.merchant}
                      onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Payment Method</label>
                    <select
                      className="input"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Description</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Brief description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    placeholder="Additional notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTransaction ? 'Update' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;
