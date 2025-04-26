import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit2, Save } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SystemCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  is_default?: boolean;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<SystemCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<SystemCategory | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<SystemCategory>>({
    name: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'system_categories')
        .single();

      if (error) throw error;

      setCategories(data?.value || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCategories = async (updatedCategories: SystemCategory[]) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'system_categories',
          value: updatedCategories,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      setCategories(updatedCategories);
      toast.success('Categories saved successfully');
    } catch (error) {
      console.error('Error saving categories:', error);
      toast.error('Failed to save categories');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.color) {
      toast.error('Please fill in all required fields');
      return;
    }

    const category: SystemCategory = {
      id: `system-${Date.now()}`,
      name: newCategory.name,
      color: newCategory.color,
      is_default: false
    };

    await saveCategories([...categories, category]);
    setNewCategory({ name: '', color: '#3B82F6' });
  };

  const handleUpdateCategory = async (category: SystemCategory) => {
    const updatedCategories = categories.map(c => 
      c.id === category.id ? category : c
    );
    await saveCategories(updatedCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category?.is_default) {
      toast.error('Cannot delete default categories');
      return;
    }

    if (confirm('Are you sure you want to delete this category?')) {
      const updatedCategories = categories.filter(c => c.id !== id);
      await saveCategories(updatedCategories);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
        <p className="text-gray-600">Manage system-wide transaction categories</p>
      </div>

      <Card title="Categories" icon={<Tag className="h-5 w-5" />}>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Category</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Transportation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="h-10 w-20 p-1 rounded-md border"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleAddCategory}
                icon={<Plus size={16} />}
              >
                Add Category
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg"
              >
                {editingCategory?.id === category.id ? (
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        name: e.target.value
                      })}
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <input
                      type="color"
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        color: e.target.value
                      })}
                      className="h-10 w-20 p-1 rounded-md border"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateCategory(editingCategory)}
                      icon={<Save size={16} />}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCategory(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      <div
                        className="w-6 h-6 rounded-full mr-3"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="font-medium">{category.name}</span>
                      {category.is_default && (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCategory(category)}
                        icon={<Edit2 size={16} />}
                      >
                        Edit
                      </Button>
                      {!category.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          icon={<Trash2 size={16} />}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Categories;