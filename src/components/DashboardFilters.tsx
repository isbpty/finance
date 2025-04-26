import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Search, Filter } from 'lucide-react';
import Button from './ui/Button';
import { DateRange, FilterOptions } from '../types';
import dayjs from 'dayjs';
import { defaultCategories } from '../lib/categories';
import { getCreditCards } from '../lib/api';
import useStore from '../store';

type DashboardFiltersProps = {
  onChange: (filters: FilterOptions) => void;
};

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ onChange }) => {
  const { userid, categories } = useStore();
  const [activeFilter, setActiveFilter] = useState<string>('month');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [creditCards, setCreditCards] = useState([]);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    },
    category: '',
    merchant: '',
    creditCard: '',
    minAmount: '',
    maxAmount: '',
  });

  useEffect(() => {
    if (userid) {
      loadCreditCards();
    }
  }, [userid]);

  const loadCreditCards = async () => {
    const { data } = await getCreditCards(userid);
    if (data) {
      setCreditCards(data);
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    
    let dateRange: DateRange = {
      startDate: '',
      endDate: dayjs().format('YYYY-MM-DD'),
    };
    
    switch (filter) {
      case 'week':
        dateRange.startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
        break;
      case 'month':
        dateRange.startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        break;
      case 'quarter':
        dateRange.startDate = dayjs().subtract(90, 'day').format('YYYY-MM-DD');
        break;
      case 'year':
        dateRange.startDate = dayjs().subtract(365, 'day').format('YYYY-MM-DD');
        break;
      case 'custom':
        dateRange = filters.dateRange;
        break;
      default:
        break;
    }
    
    const newFilters = { ...filters, dateRange };
    setFilters(newFilters);
    onChange(newFilters);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value,
    };
    setFilters(newFilters);
    onChange(newFilters);
  };

  const allCategories = [...defaultCategories, ...categories];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-medium text-gray-700 mr-2">Time Range:</div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('week')}
          >
            Last 7 Days
          </Button>
          <Button
            variant={activeFilter === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('month')}
          >
            Last 30 Days
          </Button>
          <Button
            variant={activeFilter === 'quarter' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('quarter')}
          >
            Last 90 Days
          </Button>
          <Button
            variant={activeFilter === 'year' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('year')}
          >
            Last Year
          </Button>
          <Button
            variant={activeFilter === 'custom' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('custom')}
            icon={<Calendar size={14} />}
          >
            Custom
          </Button>
          <Button
            variant={showAdvancedFilters ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            icon={<Filter size={14} />}
          >
            More Filters
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFilterChange(activeFilter)}
          icon={<RefreshCw size={14} />}
          className="ml-auto"
        >
          Refresh
        </Button>
      </div>
      
      {activeFilter === 'custom' && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.dateRange.startDate}
              onChange={(e) => handleInputChange({
                target: {
                  name: 'dateRange',
                  value: { ...filters.dateRange, startDate: e.target.value }
                }
              } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.dateRange.endDate}
              onChange={(e) => handleInputChange({
                target: {
                  name: 'dateRange',
                  value: { ...filters.dateRange, endDate: e.target.value }
                }
              } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filters.category === '' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => handleInputChange({ target: { name: 'category', value: '' } } as any)}
              >
                All
              </Button>
              {allCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={filters.category === category.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleInputChange({ target: { name: 'category', value: category.id } } as any)}
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
            <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-1">
              Merchant
            </label>
            <input
              type="text"
              id="merchant"
              name="merchant"
              value={filters.merchant}
              onChange={handleInputChange}
              placeholder="Search by merchant"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="creditCard" className="block text-sm font-medium text-gray-700 mb-1">
              Credit Card
            </label>
            <select
              id="creditCard"
              name="creditCard"
              value={filters.creditCard}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cards</option>
              {creditCards.map((card: any) => (
                <option key={card.id} value={card.id}>
                  {card.name} {card.last_four && `(${card.last_four})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Min Amount
            </label>
            <input
              type="number"
              id="minAmount"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Max Amount
            </label>
            <input
              type="number"
              id="maxAmount"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFilters;