import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiUploadCloud,
  FiFile,
  FiCheck,
  FiX,
  FiDownload,
  FiAlertCircle,
  FiTrash2
} from 'react-icons/fi';
import './Upload.css';

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [clearing, setClearing] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadAPI.uploadCSV(selectedFile);
      setUploadResult(response.data.data);
      toast.success(response.data.message);
      setSelectedFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClearImported = async () => {
    if (!window.confirm('Are you sure you want to delete all imported transactions? This cannot be undone.')) {
      return;
    }
    
    setClearing(true);
    try {
      const response = await uploadAPI.clearImported();
      toast.success(response.data.message);
      setUploadResult(null);
    } catch (error) {
      toast.error('Failed to clear imported transactions');
    } finally {
      setClearing(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await uploadAPI.getTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transaction_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded!');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <div>
          <h1>Upload Bank Statement</h1>
          <p>Import transactions from CSV files</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-danger" onClick={handleClearImported} disabled={clearing}>
            <FiTrash2 /> {clearing ? 'Clearing...' : 'Clear Imported'}
          </button>
          <button className="btn btn-secondary" onClick={downloadTemplate}>
            <FiDownload /> Download Template
          </button>
        </div>
      </div>

      <div className="upload-container">
        <div className="upload-section">
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="dropzone-content">
              <FiUploadCloud className="upload-icon" />
              {isDragActive ? (
                <p>Drop the CSV file here...</p>
              ) : selectedFile ? (
                <div className="selected-file">
                  <FiFile className="file-icon" />
                  <span>{selectedFile.name}</span>
                  <button
                    className="remove-file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <>
                  <p>Drag & drop your CSV file here</p>
                  <span className="or-text">or</span>
                  <button className="btn btn-primary browse-btn">
                    Browse Files
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedFile && (
            <motion.button
              className="btn btn-primary upload-btn"
              onClick={handleUpload}
              disabled={uploading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {uploading ? (
                <>
                  <span className="spinner-small"></span>
                  Processing...
                </>
              ) : (
                <>
                  <FiUploadCloud /> Upload & Import
                </>
              )}
            </motion.button>
          )}
        </div>

        <div className="info-section">
          <h3>📋 CSV Format Guidelines</h3>
          <ul>
            <li>
              <strong>Required columns:</strong> Date, Description, Amount
            </li>
            <li>
              <strong>Date format:</strong> YYYY-MM-DD or DD/MM/YYYY
            </li>
            <li>
              <strong>Amount:</strong> Positive for income, negative for expenses
            </li>
            <li>
              <strong>Max file size:</strong> 5 MB
            </li>
          </ul>

          <h3>🏦 Supported Banks</h3>
          <p>Our parser automatically detects common formats from:</p>
          <ul className="bank-list">
            <li>HDFC Bank</li>
            <li>ICICI Bank</li>
            <li>SBI</li>
            <li>Axis Bank</li>
            <li>Kotak Bank</li>
            <li>And most other banks</li>
          </ul>

          <div className="tip-box">
            <FiAlertCircle />
            <span>
              Categories are automatically detected based on transaction descriptions using AI.
            </span>
          </div>
        </div>
      </div>

      {/* Upload Result */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div
            className="upload-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="result-header">
              <FiCheck className="success-icon" />
              <div>
                <h3>Import Successful!</h3>
                <p>Your transactions have been imported</p>
              </div>
            </div>

            <div className="result-stats">
              <div className="stat">
                <span className="stat-value">{uploadResult.total}</span>
                <span className="stat-label">Total Rows</span>
              </div>
              <div className="stat success">
                <span className="stat-value">{uploadResult.imported}</span>
                <span className="stat-label">Imported</span>
              </div>
              {uploadResult.errors?.length > 0 && (
                <div className="stat warning">
                  <span className="stat-value">{uploadResult.errors.length}</span>
                  <span className="stat-label">Errors</span>
                </div>
              )}
            </div>

            {/* Preview */}
            {uploadResult.transactions?.length > 0 && (
              <div className="preview-section">
                <h4>Preview of Imported Transactions</h4>
                <div className="preview-table">
                  {uploadResult.transactions.map((t, index) => (
                    <div key={index} className="preview-row">
                      <span className={`type-badge ${t.type}`}>{t.type}</span>
                      <span className="category">{t.category}</span>
                      <span className="description">{t.description}</span>
                      <span className={`amount ${t.type}`}>
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {uploadResult.errors?.length > 0 && (
              <div className="errors-section">
                <h4>Parsing Errors</h4>
                <ul>
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Upload;
