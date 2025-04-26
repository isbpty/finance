import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Reports from './pages/Reports';
import Receipts from './pages/Receipts';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ConfirmEmail from './pages/ConfirmEmail';
import Properties from './pages/Properties';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDatabase from './pages/admin/Database';
import AdminMailSettings from './pages/admin/MailSettings';
import AdminOcrSettings from './pages/admin/OcrSettings';
import AdminDocumentation from './pages/admin/Documentation';
import AdminCategories from './pages/admin/Categories';
import { getCurrentUser } from './lib/supabase';
import useStore from './store';
import { Toaster } from 'react-hot-toast';

function App() {
  const { isAuthenticated, setIsAuthenticated, setUserId, setIsLoading, isDarkMode, initializeCategories } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const { user, error } = await getCurrentUser();
        if (user && !error) {
          setIsAuthenticated(true);
          setUserId(user.id);
          await initializeCategories();
        } else {
          setIsAuthenticated(false);
          setUserId(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
        setUserId(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white',
        }}
      />
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/" /> : <Register />} 
          />
          <Route 
            path="/forgot-password" 
            element={isAuthenticated ? <Navigate to="/" /> : <ForgotPassword />} 
          />
          <Route 
            path="/reset-password" 
            element={isAuthenticated ? <Navigate to="/" /> : <ResetPassword />} 
          />
          <Route 
            path="/confirm-email" 
            element={<ConfirmEmail />} 
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            )}
          />
          <Route
            path="/admin/users"
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            )}
          />
          <Route
            path="/admin/database"
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <AdminLayout>
                <AdminDatabase />
              </AdminLayout>
            )}
          />
          <Route
            path="/admin/categories"
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <AdminLayout>
                <AdminCategories />
              </AdminLayout>
            )}
          />
          <Route
            path="/admin/mail"
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <AdminLayout>
                <AdminMailSettings />
              </AdminLayout>
            )}
          />
          <Route
            path="/admin/ocr"
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <AdminLayout>
                <AdminOcrSettings />
              </AdminLayout>
            )}
          />
          <Route
            path="/admin/docs"
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <AdminLayout>
                <AdminDocumentation />
              </AdminLayout>
            )}
          />
          
          {/* User Routes */}
          <Route 
            path="/" 
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <Layout>
                <Dashboard />
              </Layout>
            )} 
          />
          <Route 
            path="/transactions" 
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <Layout>
                <Transactions />
              </Layout>
            )} 
          />
          <Route 
            path="/budget" 
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <Layout>
                <Budget />
              </Layout>
            )} 
          />
          <Route 
            path="/reports" 
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <Layout>
                <Reports />
              </Layout>
            )} 
          />
          <Route 
            path="/receipts" 
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <Layout>
                <Receipts />
              </Layout>
            )} 
          />
          <Route 
            path="/properties" 
            element={!isAuthenticated ? <Navigate to="/login" /> : (
              <Layout>
                <Properties />
              </Layout>
            )} 
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;