import React, { useState } from 'react';
import { Category } from '../types';
import Button from './ui/Button';

type CategoryFormProps = {
  initialCategory?: Category;
  onSave: (category: Category) => void;
  onCancel: () => void;
};

const CategoryForm: React.FC<CategoryFormProps> = ({
  initialCategory,
  onSave,
  onCancel,
}) => {
  const [category, setCategory] = useState<Category>(
    initialCategory || {
      id: `custom-${Date.now()}`,
      name: '',
      color: '#3B82F6',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(category);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCategory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Category Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={category.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
          placeholder="e.g., Groceries, Entertainment, etc."
        />
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">
          Color
        </label>
        <div className="flex items-center mt-1">
          <input
            type="color"
            id="color"
            name="color"
            value={category.color}
            onChange={handleChange}
            className="h-10 w-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="text"
            name="color"
            value={category.color}
            onChange={handleChange}
            className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
            placeholder="#3B82F6"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialCategory ? 'Update Category' : 'Add Category'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;