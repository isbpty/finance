import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListOrdered, 
  Settings, 
  Upload, 
  Plus, 
  LogOut,
  Menu,
  X,
  BarChart2,
  DollarSign,
  FileSpreadsheet,
  Shield,
  PiggyBank,
  FileText,
  Receipt,
  User
} from 'lucide-react';
import Button from './ui/Button';
import UploadModal from './UploadModal';
import ManualEntryModal from './ManualEntryModal';
import ThemeToggle from './ThemeToggle';
import useStore from '../store';
import { signOut } from '../lib/supabase';
import { uploadTransactions } from '../lib/api';
import toast from 'react-hot-toast';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userid, resetState, addTransactions } = useStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      resetState();
      navigate('/login');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleUpload = async (transactions: Transaction[]) => {
    try {
      if (!userid) {
        toast.error('User not authenticated');
        return;
      }
      
      const cleanTransactions = transactions.map(({ id, ...rest }) => rest);
      
      const { data, error } = await uploadTransactions(cleanTransactions);
      
      if (error) throw error;
      
      if (data) {
        addTransactions(data);
        toast.success(`${data.length} transactions uploaded successfully!`);
      }
    } catch (error) {
      toast.error('Failed to upload transactions');
      console.error('Upload error:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: ListOrdered },
    { path: '/budget', label: 'Budget', icon: PiggyBank },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/receipts', label: 'Receipts', icon: Receipt },
    { path: '/properties', label: 'Properties', icon: User },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 z-20 p-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-600 dark:text-gray-300 focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-800 shadow-md transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <BarChart2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Finance Tracker</h1>
            </div>
            <Link 
              to="/admin"
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Admin Panel"
            >
              <Shield size={20} />
            </Link>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
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
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between items-center mb-4">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={handleLogout}
                icon={<LogOut size={16} />}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800"
              >
                Sign Out
              </Button>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsUploadModalOpen(true)}
              icon={<Upload size={16} />}
              fullWidth
              className="justify-start"
            >
              Upload Statement
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsManualEntryModalOpen(true)}
              icon={<Plus size={16} />}
              fullWidth
              className="justify-start"
            >
              Add Transactions
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Modals */}
      {userid && (
        <>
          <UploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleUpload}
            userid={userid}
          />
          
          <ManualEntryModal
            isOpen={isManualEntryModalOpen}
            onClose={() => setIsManualEntryModalOpen(false)}
            onSave={handleUpload}
            userid={userid}
          />
        </>
      )}
    </div>
  );
};

export default Layout;