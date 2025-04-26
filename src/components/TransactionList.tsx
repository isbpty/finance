import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Filter, Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { Transaction } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { defaultCategories } from '../lib/categories';
import useStore from '../store';
import toast from 'react-hot-toast';

type SortConfig = {
  key: keyof Transaction | '';
  direction: 'asc' | 'desc';
};

type TransactionListProps = {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleRecurring: (transaction: Transaction) => void;
  onBulkCategoryChange?: (transactions: Transaction[], category: string) => void;
};

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onEdit, 
  onDelete,
  onToggleRecurring,
  onBulkCategoryChange
}) => {
  const { categories } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [merchantFilter, setMerchantFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Get distinct merchants from transactions
  const distinctMerchants = Array.from(new Set(transactions.map(t => t.merchant || t.description))).sort();

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Transaction) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp size={14} className="ml-1 text-blue-500" /> : 
      <ArrowDown size={14} className="ml-1 text-blue-500" />;
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' ? 
        aValue.localeCompare(bValue) : 
        bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const filteredTransactions = sortedTransactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? transaction.category === categoryFilter : true;
    const matchesMerchant = merchantFilter ? 
      (transaction.merchant || transaction.description) === merchantFilter : true;
    return matchesSearch && matchesCategory && matchesMerchant;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getCategoryColor = (categoryId: string) => {
    const category = [...defaultCategories, ...categories].find((c) => c.id === categoryId);
    return category?.color || '#9CA3AF';
  };

  const getCategoryName = (categoryId: string) => {
    const category = [...defaultCategories, ...categories].find((c) => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => {
      if (prev.includes(id)) {
        return prev.filter(transId => transId !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id || ''));
    }
  };

  const handleBulkCategoryChange = (category: string) => {
    if (onBulkCategoryChange) {
      const selectedTxs = filteredTransactions.filter(t => t.id && selectedTransactions.includes(t.id));
      onBulkCategoryChange(selectedTxs, category);
      setSelectedTransactions([]);
      setShowCategorySelector(false);
    }
  };

  return (
    <Card title="Transactions" className="mt-4">
      <div className="mb-4 flex flex-col md:flex-row gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          icon={<Filter size={18} />}
        >
          Filters
        </Button>
        {selectedTransactions.length > 0 && (
          <Button
            variant="primary"
            onClick={() => setShowCategorySelector(true)}
          >
            Change Category ({selectedTransactions.length})
          </Button>
        )}
      </div>

      {showCategorySelector && (
        <div className="mb-4 p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Select Category</h3>
          <div className="flex flex-wrap gap-2">
            {[...defaultCategories, ...categories].map((category) => (
              <Button
                key={category.id}
                variant="outline"
                size="sm"
                onClick={() => handleBulkCategoryChange(category.id)}
                className="flex items-center"
              >
                <span 
                  className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: category.color }}
                ></span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={categoryFilter === '' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setCategoryFilter('')}
              >
                All
              </Button>
              {[...defaultCategories, ...categories].map((category) => (
                <Button
                  key={category.id}
                  variant={categoryFilter === category.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(category.id)}
                  className="flex items-center"
                >
                  <span 
                    className="w-3 h-3 rounded-full mr-1" 
                    style={{ backgroundColor: category.color }}
                  ></span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Merchants</h3>
            <select
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Merchants</option>
              {distinctMerchants.map((merchant) => (
                <option key={merchant} value={merchant}>
                  {merchant}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedTransactions.length === filteredTransactions.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Date
                  {getSortIcon('date')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center">
                  Description
                  {getSortIcon('description')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  {getSortIcon('category')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center">
                  Amount
                  {getSortIcon('amount')}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id || '')}
                      onChange={() => handleSelectTransaction(transaction.id || '')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: getCategoryColor(transaction.category) }}
                      ></span>
                      {getCategoryName(transaction.category)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className={`mr-3 ${transaction.is_recurring ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-900`}
                      onClick={() => onToggleRecurring(transaction)}
                      title={transaction.is_recurring ? 'Remove recurring' : 'Mark as recurring'}
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => onEdit(transaction)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => onDelete(transaction.id || '')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TransactionList;