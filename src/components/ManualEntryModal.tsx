import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import TransactionForm from './TransactionForm';
import { Transaction, CreditCard } from '../types';
import Button from './ui/Button';
import { getCreditCards } from '../lib/api';
import useStore from '../store';

type ManualEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactions: Transaction[]) => void;
  userid: string;
};

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userid,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([{
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: 'other',
    userid,
    payment_method: 'cash',
  }]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [validTransactions, setValidTransactions] = useState<boolean[]>([false]);

  useEffect(() => {
    if (userid) {
      loadCreditCards();
    }
  }, [userid]);

  useEffect(() => {
    // Reset state when modal is opened
    if (isOpen) {
      setTransactions([{
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: 'other',
        userid,
        payment_method: 'cash',
      }]);
      setValidTransactions([false]);
    }
  }, [isOpen, userid]);

  const loadCreditCards = async () => {
    const { data } = await getCreditCards(userid);
    if (data) {
      setCreditCards(data);
    }
  };

  if (!isOpen) return null;

  const validateTransaction = (transaction: Transaction): boolean => {
    const isValidAmount = Math.abs(transaction.amount) > 0;
    const isValidDescription = transaction.description.trim().length > 0;
    const isValidDate = Boolean(transaction.date);
    const isValidCategory = Boolean(transaction.category);
    const isValidPayment = transaction.payment_method === 'cash' || 
      (transaction.payment_method === 'credit_card' && Boolean(transaction.credit_card_id));

    return isValidAmount && isValidDescription && isValidDate && isValidCategory && isValidPayment;
  };

  const handleSave = () => {
    const cleanTransactions = transactions.map(({ id, ...rest }) => ({
      ...rest,
      amount: -Math.abs(rest.amount) // Ensure amount is negative
    }));
    onSave(cleanTransactions);
    onClose();
  };

  const handleAddTransaction = () => {
    setTransactions([...transactions, {
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      category: 'other',
      userid,
      payment_method: 'cash',
    }]);
    setValidTransactions([...validTransactions, false]);
  };

  const handleRemoveTransaction = (index: number) => {
    setTransactions(transactions.filter((_, i) => i !== index));
    setValidTransactions(validTransactions.filter((_, i) => i !== index));
  };

  const handleUpdateTransaction = (index: number, updatedTransaction: Transaction) => {
    const newTransactions = [...transactions];
    newTransactions[index] = updatedTransaction;
    setTransactions(newTransactions);

    const newValidTransactions = [...validTransactions];
    newValidTransactions[index] = validateTransaction(updatedTransaction);
    setValidTransactions(newValidTransactions);
  };

  const isFormValid = validTransactions.every(Boolean) && transactions.length > 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Add Transactions</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          <div className="space-y-6">
            {transactions.map((transaction, index) => (
              <div key={index} className="relative bg-gray-50 p-4 rounded-lg">
                {transactions.length > 1 && (
                  <button
                    onClick={() => handleRemoveTransaction(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <TransactionForm
                  transaction={transaction}
                  onSave={(updatedTransaction) => handleUpdateTransaction(index, updatedTransaction)}
                  onCancel={onClose}
                  hideButtons
                  creditCards={creditCards}
                />
                {!validTransactions[index] && (
                  <p className="mt-2 text-sm text-red-600">
                    Please fill in all required fields
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTransaction}
              icon={<Plus size={16} />}
              fullWidth
            >
              Add Another Transaction
            </Button>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="primary" 
            onClick={handleSave}
            disabled={!isFormValid}
          >
            Save All Transactions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManualEntryModal;