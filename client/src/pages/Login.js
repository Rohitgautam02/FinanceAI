import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiDollarSign } from 'react-icons/fi';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await login('demo@financeai.com', 'demo123');
      toast.success('Welcome to the demo!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Demo login failed. Make sure you ran the seed script.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-shape shape-1"></div>
        <div className="auth-bg-shape shape-2"></div>
        <div className="auth-bg-shape shape-3"></div>
      </div>

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <FiDollarSign size={32} />
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in to your FinanceAI account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="label">Email Address</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  className="input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-small"></span>
              ) : (
                <>
                  Sign In
                  <FiArrowRight />
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              Try Demo Account
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>
        </div>

        <div className="auth-features">
          <h2>Your AI-Powered Finance Companion</h2>
          <ul>
            <li>📊 Track all your expenses in one place</li>
            <li>🤖 Get AI-powered financial insights</li>
            <li>📈 Visualize spending patterns</li>
            <li>💡 Personalized budget recommendations</li>
            <li>📁 Import bank statements easily</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
