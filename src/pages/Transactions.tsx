import React, { useEffect, useState } from 'react';
import TransactionList from '../components/TransactionList';
import DashboardFilters from '../components/DashboardFilters';
import EditTransactionModal from '../components/EditTransactionModal';
import { getTransactions, updateTransaction, deleteTransaction, clearTransactions, updateRecurringStatus } from '../lib/api';
import useStore from '../store';
import { Transaction } from '../types';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Trash2 } from 'lucide-react';

const Transactions: React.FC = () => {
  const { 
    userid, 
    transactions, 
    setTransactions, 
    updateTransaction: updateTransactionInStore,
    deleteTransaction: deleteTransactionInStore,
    dateRange, 
    setDateRange,
    setIsLoading
  } = useStore();
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const loadTransactions = async () => {
    if (!userid) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await getTransactions(userid, dateRange);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setTransactions(data as Transaction[]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userid) {
      loadTransactions();
    }
  }, [userid, dateRange]);

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdateTransaction = async (transaction: Transaction, updateAll: boolean = false) => {
    try {
      // Remove merchant field as it's generated
      const { merchant, ...updateData } = transaction;
      
      const { data, error } = await updateTransaction(updateData);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // If updating all similar transactions, reload the entire list
        if (updateAll) {
          await loadTransactions();
        } else {
          updateTransactionInStore(data[0]);
        }
        toast.success('Transaction updated successfully');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const handleBulkCategoryChange = async (transactions: Transaction[], category: string) => {
    try {
      const updates = transactions.map(transaction => {
        // Remove merchant field and update category
        const { merchant, ...updateData } = transaction;
        return handleUpdateTransaction({ ...updateData, category }, true);
      });
      await Promise.all(updates);
      await loadTransactions();
      toast.success('Categories updated successfully');
    } catch (error) {
      console.error('Error updating categories:', error);
      toast.error('Failed to update categories');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        const { error } = await deleteTransaction(id);
        
        if (error) {
          throw error;
        }
        
        deleteTransactionInStore(id);
        toast.success('Transaction deleted successfully');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error('Failed to delete transaction');
      }
    }
  };

  const handleToggleRecurring = async (transaction: Transaction) => {
    try {
      const updatedTransaction = {
        ...transaction,
        is_recurring: !transaction.is_recurring
      };

      const { error } = await updateRecurringStatus(updatedTransaction, userid);
      
      if (error) {
        throw error;
      }
      
      // Update all transactions with the same description in the store
      const updatedTransactions = transactions.map(t => 
        t.description === transaction.description
          ? { ...t, is_recurring: updatedTransaction.is_recurring }
          : t
      );
      
      setTransactions(updatedTransactions);
      toast.success(`All transactions from ${transaction.description} marked as ${updatedTransaction.is_recurring ? 'recurring' : 'non-recurring'}`);
    } catch (error) {
      console.error('Error updating recurring status:', error);
      toast.error('Failed to update recurring status');
    }
  };

  const handleClearTransactions = async () => {
    if (!userid) return;

    if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        const { error } = await clearTransactions(userid);
        
        if (error) {
          throw error;
        }
        
        setTransactions([]);
        toast.success('All transactions cleared successfully');
      } catch (error: any) {
        console.error('Error clearing transactions:', error);
        toast.error(error.message || 'Failed to clear transactions');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">View and manage your financial transactions</p>
        </div>
        {transactions.length > 0 && (
          <Button
            variant="outline"
            onClick={handleClearTransactions}
            icon={<Trash2 size={16} />}
            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
          >
            Clear All
          </Button>
        )}
      </div>

      <DashboardFilters onChange={({ dateRange }) => setDateRange(dateRange)} />

      <TransactionList
        transactions={transactions}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onToggleRecurring={handleToggleRecurring}
        onBulkCategoryChange={handleBulkCategoryChange}
      />

      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleUpdateTransaction}
        transaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;