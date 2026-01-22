import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155'
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#F1F5F9'
              }
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#F1F5F9'
              }
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
