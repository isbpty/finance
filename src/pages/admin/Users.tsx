import React, { useState, useEffect } from 'react';
import { User, UserPlus, UserMinus, Shield, ShieldOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { isAdmin, promoteToAdmin, demoteFromAdmin, deleteUser, listUsers } from '../../lib/admin';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DatabaseUser {
  id: string;
  email: string;
  raw_user_meta_data: {
    role?: string;
  };
  created_at: string;
  last_sign_in_at: string | null;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }

      if (!session) {
        toast.error('Please sign in to access this page');
        navigate('/login');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('User error:', userError);
        throw new Error(`Failed to get user: ${userError.message}`);
      }

      if (!user) {
        toast.error('Please sign in to access this page');
        navigate('/login');
        return;
      }

      try {
        const adminStatus = await isAdmin(user.id);
        
        if (!adminStatus) {
          toast.error('Unauthorized: Admin access required');
          navigate('/');
          return;
        }

        setCurrentUser(user);
        loadUsers();
      } catch (adminError: any) {
        console.error('Admin check error:', adminError);
        throw new Error(`Failed to verify admin status: ${adminError.message}`);
      }
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      toast.error(`Authentication error: ${error.message}`);
      navigate('/');
    }
  };

  const loadUsers = async () => {
    try {
      const { users, error } = await listUsers();
      
      if (error) throw error;
      
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      const { error } = await promoteToAdmin(userId);
      if (error) throw error;

      await loadUsers();
      toast.success('User promoted to admin');
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Failed to promote user');
    }
  };

  const handleDemoteFromAdmin = async (userId: string) => {
    try {
      // Prevent self-demotion
      if (userId === currentUser?.id) {
        toast.error('Cannot demote yourself from admin');
        return;
      }

      const { error } = await demoteFromAdmin(userId);
      if (error) throw error;

      await loadUsers();
      toast.success('Admin demoted to user');
    } catch (error) {
      console.error('Error demoting admin:', error);
      toast.error('Failed to demote admin');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Prevent self-deletion
    if (userId === currentUser?.id) {
      toast.error('Cannot delete your own account');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await deleteUser(userId);
      if (error) throw error;

      await loadUsers();
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage system users and their permissions</p>
      </div>

      <Card>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <Button
            variant="primary"
            onClick={loadUsers}
            icon={<RefreshCw size={16} />}
          >
            Refresh Users
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Sign In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.raw_user_meta_data?.role === 'admin'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {user.raw_user_meta_data?.role || 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {user.id !== currentUser?.id && (
                        <>
                          {user.raw_user_meta_data?.role === 'admin' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDemoteFromAdmin(user.id)}
                              icon={<ShieldOff size={14} />}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              Remove Admin
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteToAdmin(user.id)}
                              icon={<Shield size={14} />}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Make Admin
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            icon={<UserMinus size={14} />}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Users;