import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { Transaction, CreditCard } from '../types';
import { defaultCategories } from '../lib/categories';
import { suggestCategory } from '../lib/categories';
import useStore from '../store';

type TransactionFormProps = {
  transaction: Transaction | null;
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
  hideButtons?: boolean;
  creditCards?: CreditCard[];
};

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSave,
  onCancel,
  hideButtons = false,
  creditCards = [],
}) => {
  const { userid, categories } = useStore();
  const [formData, setFormData] = useState<Omit<Transaction, 'id' | 'createdAt' | 'merchant'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: 'other',
    userid: userid || '',
    payment_method: 'cash',
    credit_card_id: undefined,
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        description: transaction.description,
        amount: Math.abs(transaction.amount), // Store absolute value in form
        category: transaction.category,
        userid: transaction.userid,
        payment_method: transaction.payment_method || 'cash',
        credit_card_id: transaction.credit_card_id,
      });
    }
  }, [transaction]);

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'description' && !transaction) {
      // Only suggest category for new transactions
      const suggestedCategory = await suggestCategory(value, userid);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        category: suggestedCategory
      }));
    } else if (name === 'payment_method') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        credit_card_id: value === 'credit_card' ? prev.credit_card_id : undefined
      }));
    } else if (name === 'amount') {
      // Store positive number in form, it will be converted to negative on save
      const amount = Math.abs(parseFloat(value) || 0);
      setFormData(prev => ({
        ...prev,
        amount
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Immediately call onSave to trigger validation
    const updatedData = {
      ...formData,
      [name]: name === 'amount' ? Math.abs(parseFloat(value) || 0) : value,
      credit_card_id: name === 'payment_method' && value !== 'credit_card' ? undefined : formData.credit_card_id
    };
    onSave({
      ...updatedData,
      id: transaction?.id,
      amount: -Math.abs(updatedData.amount), // Convert to negative when saving
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: transaction?.id,
      amount: -Math.abs(formData.amount), // Convert to negative when saving
    });
  };

  const allCategories = [...defaultCategories, ...categories];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="0.01"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
        />
      </div>

      <div>
        <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
          Payment Method
        </label>
        <select
          id="payment_method"
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
        >
          <option value="cash">Cash</option>
          <option value="credit_card">Credit Card</option>
        </select>
      </div>

      {formData.payment_method === 'credit_card' && creditCards.length > 0 && (
        <div>
          <label htmlFor="credit_card_id" className="block text-sm font-medium text-gray-700">
            Credit Card
          </label>
          <select
            id="credit_card_id"
            name="credit_card_id"
            value={formData.credit_card_id || ''}
            onChange={handleChange}
            required={formData.payment_method === 'credit_card'}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
          >
            <option value="">Select a card</option>
            {creditCards.map(card => (
              <option key={card.id} value={card.id}>
                {card.name} {card.last_four && `(${card.last_four})`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
        >
          {allCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {!hideButtons && (
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      )}
    </form>
  );
};

export default TransactionForm;