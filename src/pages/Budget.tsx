import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import useStore from '../store';
import { defaultCategories } from '../lib/categories';
import toast from 'react-hot-toast';

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
}

const Budget: React.FC = () => {
  const { userid, categories } = useStore();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<Budget, 'id'>>({
    category: '',
    amount: 0,
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (userid) {
      loadBudgets();
    }
  }, [userid]);

  const loadBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('userid', userid)
        .order('category');

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('budgets')
          .update({
            category: editForm.category,
            amount: editForm.amount,
            period: editForm.period,
            start_date: editForm.start_date,
          })
          .eq('id', isEditing);

        if (error) throw error;
        toast.success('Budget updated successfully');
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert({
            ...editForm,
            userid,
          });

        if (error) throw error;
        toast.success('Budget created successfully');
      }

      setIsEditing(null);
      setEditForm({
        category: '',
        amount: 0,
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
      });
      loadBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Budget deleted successfully');
      loadBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const handleEdit = (budget: Budget) => {
    setIsEditing(budget.id);
    setEditForm({
      category: budget.category,
      amount: budget.amount,
      period: budget.period,
      start_date: budget.start_date,
    });
  };

  const allCategories = [...defaultCategories, ...categories];

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
        <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
        <p className="text-gray-600">Set and manage your spending limits by category</p>
      </div>

      <Card>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isEditing ? 'Edit Budget' : 'Create New Budget'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {allCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Period</label>
                <select
                  value={editForm.period}
                  onChange={(e) => setEditForm({ ...editForm, period: e.target.value as 'monthly' | 'quarterly' | 'yearly' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(null);
                    setEditForm({
                      category: '',
                      amount: 0,
                      period: 'monthly',
                      start_date: new Date().toISOString().split('T')[0],
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!editForm.category || editForm.amount <= 0}
                icon={isEditing ? <Edit2 size={16} /> : <Plus size={16} />}
              >
                {isEditing ? 'Update Budget' : 'Add Budget'}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Budgets</h3>
            <div className="space-y-4">
              {budgets.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No budgets set yet. Create one above!</p>
              ) : (
                budgets.map((budget) => {
                  const category = allCategories.find((c) => c.id === budget.category);
                  return (
                    <div
                      key={budget.id}
                      className="flex items-center justify-between p-4 bg-white border rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category?.color }}
                        ></div>
                        <div>
                          <h4 className="font-medium">{category?.name}</h4>
                          <p className="text-sm text-gray-500">
                            ${budget.amount.toFixed(2)} per {budget.period}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(budget)}
                          icon={<Edit2 size={14} />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(budget.id)}
                          icon={<Trash2 size={14} />}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Budget;