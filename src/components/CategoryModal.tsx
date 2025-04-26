import React, { useState } from 'react';
import { X, CheckCircle2, Edit, Trash } from 'lucide-react';
import { Category } from '../types';
import { defaultCategories, updateAllTransactionsCategory } from '../lib/categories';
import Button from './ui/Button';
import CategoryForm from './CategoryForm';
import useStore from '../store';
import toast from 'react-hot-toast';

type CategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userid, categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleSaveCategory = async (category: Category) => {
    try {
      if (isAdding) {
        addCategory(category);
        toast.success('Category added successfully');
      } else if (editingCategory) {
        // Update existing category and all related transactions
        await updateAllTransactionsCategory(editingCategory.id, category.id, userid);
        updateCategory(category);
        toast.success('Category and transactions updated successfully');
      }
      
      setIsAdding(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = (id: string) => {
    // Only allow deleting custom categories
    if (id.startsWith('custom-')) {
      deleteCategory(id);
      toast.success('Category deleted successfully');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Manage Categories</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow p-4">
          {isAdding || editingCategory ? (
            <CategoryForm
              initialCategory={editingCategory || undefined}
              onSave={handleSaveCategory}
              onCancel={() => {
                setIsAdding(false);
                setEditingCategory(null);
              }}
            />
          ) : (
            <>
              <ul className="space-y-2">
                {[...defaultCategories, ...categories].map((category) => (
                  <li 
                    key={category.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-5 h-5 rounded-full mr-3" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span>{category.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setEditingCategory(category)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={!category.id.startsWith('custom-')}
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant="outline" 
                onClick={() => setIsAdding(true)}
                className="mt-4 w-full"
              >
                Add New Category
              </Button>
            </>
          )}
        </div>
        
        <div className="p-4 border-t">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;