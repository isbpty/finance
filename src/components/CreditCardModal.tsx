import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from './ui/Button';
import { CreditCard } from '../types';

type CreditCardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (creditCard: Omit<CreditCard, 'id' | 'created_at'>) => void;
  initialCard?: CreditCard;
};

const CreditCardModal: React.FC<CreditCardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCard,
}) => {
  const [formData, setFormData] = useState({
    name: initialCard?.name || '',
    last_four: initialCard?.last_four || '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      userid: initialCard?.userid || '',
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {initialCard ? 'Edit Credit Card' : 'Add Credit Card'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Card Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Personal Visa"
                required
              />
            </div>
            <div>
              <label htmlFor="last_four" className="block text-sm font-medium text-gray-700">
                Last 4 Digits
              </label>
              <input
                type="text"
                id="last_four"
                value={formData.last_four}
                onChange={(e) => setFormData({ ...formData, last_four: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
              />
              <p className="mt-1 text-sm text-gray-500">Optional - helps identify the card</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {initialCard ? 'Update' : 'Add'} Card
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditCardModal;