import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import Card from '../components/ui/Card';
import DashboardFilters from '../components/DashboardFilters';
import { getCategoryTotals, getMonthlyTotals, getTransactions } from '../lib/api';
import useStore from '../store';
import { FilterOptions, Transaction } from '../types';
import { defaultCategories } from '../lib/categories';
import toast from 'react-hot-toast';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard: React.FC = () => {
  const { userid, categories, dateRange, setDateRange, transactions, setTransactions, isLoading, setIsLoading } = useStore();
  const [categoryData, setCategoryData] = useState<Record<string, number>>({});
  const [merchantData, setMerchantData] = useState<Record<string, number>>({});
  const [monthlyData, setMonthlyData] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    avgTransaction: 0,
    largestExpense: 0,
    transactionCount: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async (filters: FilterOptions) => {
    if (!userid) {
      setError('User not authenticated. Please sign in again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await getTransactions(userid, filters.dateRange);
      
      if (apiError) {
        throw apiError;
      }
      
      if (data) {
        let filteredData = data as Transaction[];

        // Apply additional filters
        if (filters.category) {
          filteredData = filteredData.filter(t => t.category === filters.category);
        }
        if (filters.merchant) {
          filteredData = filteredData.filter(t => 
            t.merchant?.toLowerCase().includes(filters.merchant.toLowerCase())
          );
        }
        if (filters.minAmount) {
          filteredData = filteredData.filter(t => Math.abs(t.amount) >= parseFloat(filters.minAmount));
        }
        if (filters.maxAmount) {
          filteredData = filteredData.filter(t => Math.abs(t.amount) <= parseFloat(filters.maxAmount));
        }

        setTransactions(filteredData);
        updateChartData(filteredData);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transactions. Please try again.');
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const updateChartData = (filteredTransactions: Transaction[]) => {
    try {
      // Calculate category totals
      const categoryTotals: Record<string, number> = {};
      const merchantTotals: Record<string, number> = {};
      
      // Filter transactions by selected categories first
      const relevantTransactions = selectedCategories.length > 0
        ? filteredTransactions.filter(t => selectedCategories.includes(t.category))
        : filteredTransactions;

      // Calculate totals
      relevantTransactions.forEach(transaction => {
        // Update category totals
        if (!categoryTotals[transaction.category]) {
          categoryTotals[transaction.category] = 0;
        }
        categoryTotals[transaction.category] += Math.abs(transaction.amount);

        // Update merchant totals
        const merchant = transaction.merchant || transaction.description;
        if (!merchantTotals[merchant]) {
          merchantTotals[merchant] = 0;
        }
        merchantTotals[merchant] += Math.abs(transaction.amount);
      });

      setCategoryData(categoryTotals);
      setMerchantData(merchantTotals);

      // Calculate monthly totals
      const monthlyTotals = Array(12).fill(0);
      relevantTransactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const month = date.getMonth();
        monthlyTotals[month] += Math.abs(transaction.amount);
      });
      setMonthlyData(monthlyTotals);

      // Calculate stats
      const totalSpent = relevantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const avgTransaction = totalSpent / (relevantTransactions.length || 1);
      const largestExpense = Math.max(...relevantTransactions.map(t => Math.abs(t.amount)), 0);

      setStats({
        totalSpent,
        avgTransaction,
        largestExpense,
        transactionCount: relevantTransactions.length,
      });
    } catch (error) {
      console.error('Error updating chart data:', error);
      setError('Failed to update dashboard data');
    }
  };

  useEffect(() => {
    if (userid) {
      loadTransactions({ dateRange });
    }
  }, [userid, dateRange, selectedCategories]);

  const handleFilterChange = (filters: FilterOptions) => {
    setDateRange(filters.dateRange);
    loadTransactions(filters);
  };

  const allCategories = [...defaultCategories, ...categories];

  // Prepare pie chart data based on selection
  const pieChartData = {
    labels: selectedCategories.length > 0 
      ? Object.keys(merchantData)
      : Object.keys(categoryData).map(key => allCategories.find((c) => c.id === key)?.name || 'Unknown'),
    datasets: [
      {
        label: selectedCategories.length > 0 ? 'Spending by Merchant' : 'Spending by Category',
        data: selectedCategories.length > 0 
          ? Object.values(merchantData)
          : Object.values(categoryData),
        backgroundColor: selectedCategories.length > 0
          ? Object.keys(merchantData).map((_, index) => {
              const hue = (index * 137.5) % 360;
              return `hsl(${hue}, 70%, 50%)`;
            })
          : Object.keys(categoryData).map(
              (key) => allCategories.find((c) => c.id === key)?.color || '#9CA3AF'
            ),
        borderColor: selectedCategories.length > 0
          ? Object.keys(merchantData).map((_, index) => {
              const hue = (index * 137.5) % 360;
              return `hsl(${hue}, 70%, 50%)`;
            })
          : Object.keys(categoryData).map(
              (key) => allCategories.find((c) => c.id === key)?.color || '#9CA3AF'
            ),
        borderWidth: 1,
      },
    ],
  };

  // Prepare bar chart data
  const barChartData = {
    labels: months,
    datasets: [
      {
        label: 'Monthly Spending',
        data: monthlyData,
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => loadTransactions({ dateRange })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-600">Track and analyze your spending habits</p>
      </div>

      <DashboardFilters onChange={handleFilterChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm">Total Spent</p>
              <h3 className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm">Avg. Transaction</p>
              <h3 className="text-2xl font-bold">${stats.avgTransaction.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <TrendingUp size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm">Largest Expense</p>
              <h3 className="text-2xl font-bold">${stats.largestExpense.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <TrendingDown size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm">Total Transactions</p>
              <h3 className="text-2xl font-bold">{stats.transactionCount}</h3>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Calendar size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={selectedCategories.length > 0 ? 'Spending by Merchant' : 'Spending by Category'}>
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategories(prev => {
                      if (prev.includes(category.id)) {
                        return prev.filter(id => id !== category.id);
                      }
                      return [...prev, category.id];
                    });
                  }}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    selectedCategories.includes(category.id)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
            <PieChart data={pieChartData} height={300} />
          </div>
        </Card>
        
        <BarChart 
          data={barChartData} 
          title="Monthly Spending"
          height={300}
        />
      </div>
    </div>
  );
};

export default Dashboard;