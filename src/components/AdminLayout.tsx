import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Users, Database, FileText, BookOpen, Tag, LayoutDashboard, LogOut, Sun, Moon, ChevronRight, Mail, Image } from 'lucide-react';
import { isAdmin } from '../lib/admin';
import useStore from '../store';
import AccessDenied from './AccessDenied';
import Button from './ui/Button';
import { signOut, supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userid, isDarkMode, toggleDarkMode, resetState } = useStore();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, [userid]);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to access this page');
        navigate('/login');
        return;
      }

      const isUserAdmin = await isAdmin(session.user.id);
      if (!isUserAdmin) {
        toast.error('You do not have permission to access this page');
        navigate('/');
        return;
      }

      setHasAccess(isUserAdmin);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Error verifying admin access');
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      // Reset the store state
      resetState();
      
      // Navigate to login
      navigate('/login');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: Shield },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/database', label: 'Database', icon: Database },
    { path: '/admin/categories', label: 'Categories', icon: Tag },
    { path: '/admin/mail', label: 'Mail Server', icon: Mail },
    { path: '/admin/ocr', label: 'OCR Settings', icon: Image },
    { path: '/admin/docs', label: 'Documentation', icon: BookOpen }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Admin Panel</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link 
                to="/"
                className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <LayoutDashboard size={16} className="mr-2" />
                Back to App
              </Link>
              <Button
                variant="outline"
                onClick={handleLogout}
                icon={<LogOut size={16} />}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                    {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;