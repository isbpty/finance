import React, { useState, useEffect } from 'react';
import { X, Bug, AlertCircle } from 'lucide-react';
import TransactionForm from './TransactionForm';
import { Transaction } from '../types';
import Button from './ui/Button';
import { findSimilarTransactions, getTransactions } from '../lib/api';
import useStore from '../store';

type EditTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction, updateAll?: boolean) => void;
  transaction: Transaction | null;
};

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
}) => {
  const { userid, setTransactions, dateRange } = useStore();
  const [debugInfo, setDebugInfo] = useState<{
    original: Transaction | null;
    current: Transaction | null;
    similarCount: number;
  }>({
    original: null,
    current: null,
    similarCount: 0
  });
  const [showDebug, setShowDebug] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (transaction) {
      setDebugInfo(prev => ({
        ...prev,
        original: transaction
      }));
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const refreshTransactions = async () => {
    if (!userid) return;
    
    try {
      const { data } = await getTransactions(userid, dateRange);
      if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  const handleSave = async (updatedTransaction: Transaction) => {
    if (updatedTransaction.category !== transaction.category) {
      // Check for similar transactions
      const { data } = await findSimilarTransactions(transaction.description, userid);
      const similarCount = (data?.length || 0) - 1; // Exclude current transaction

      if (similarCount > 0) {
        setDebugInfo({
          original: transaction,
          current: updatedTransaction,
          similarCount
        });
        setPendingTransaction(updatedTransaction);
        setShowConfirmation(true);
      } else {
        await onSave(updatedTransaction, false);
        await refreshTransactions();
        onClose();
      }
    } else {
      await onSave(updatedTransaction, false);
      await refreshTransactions();
      onClose();
    }
  };

  const handleUpdateChoice = async (updateAll: boolean) => {
    if (pendingTransaction) {
      await onSave(pendingTransaction, updateAll);
      await refreshTransactions();
      setShowConfirmation(false);
      setPendingTransaction(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingTransaction(null);
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Edit Transaction</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDebug}
              className="text-gray-500 hover:text-gray-700"
              title="Show Debug Info"
            >
              <Bug size={20} />
            </button>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {showConfirmation ? (
          <div className="p-4">
            <div className="flex items-start space-x-3 mb-4">
              <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-gray-900">Update Category</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Found {debugInfo.similarCount} similar transaction(s). Would you like to:
                </p>
                <ul className="mt-2 space-y-2">
                  <li className="text-sm text-gray-600">
                    • Update only this transaction
                  </li>
                  <li className="text-sm text-gray-600">
                    • Update all similar transactions from "{debugInfo.original?.category}" to "{debugInfo.current?.category}"
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => handleUpdateChoice(false)}>
                Update Only This
              </Button>
              <Button variant="primary" onClick={() => handleUpdateChoice(true)}>
                Update All Similar
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <TransactionForm
              transaction={transaction}
              onSave={handleSave}
              onCancel={onClose}
            />

            {showDebug && debugInfo.original && debugInfo.current && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Debug Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Original Category:</strong> {debugInfo.original.category}
                  </div>
                  <div>
                    <strong>New Category:</strong> {debugInfo.current.category}
                  </div>
                  <div>
                    <strong>Description:</strong> {debugInfo.current.description}
                  </div>
                  <div>
                    <strong>Similar Transactions:</strong> {debugInfo.similarCount}
                  </div>
                  <div>
                    <strong>Changes will apply to similar transactions:</strong>{' '}
                    {debugInfo.original.category !== debugInfo.current.category ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTransactionModal;