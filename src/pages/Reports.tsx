import React, { useState, useEffect } from 'react';
import { Download, FileText, BarChart2, PieChartIcon, Calendar, Filter, RefreshCw } from 'lucide-react';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import useStore from '../store';
import { Transaction } from '../types';
import { defaultCategories } from '../lib/categories';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: '100%',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
  },
  chartContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  chartImage: {
    width: '100%',
    maxWidth: 500,
    height: 300,
  },
});

const Reports: React.FC = () => {
  const { userid, categories } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState('month');
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [pieChartDataUrl, setPieChartDataUrl] = useState<string | null>(null);
  const [barChartDataUrl, setBarChartDataUrl] = useState<string | null>(null);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    if (userid) {
      loadTransactions();
    }
  }, [userid, startDate, endDate]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedCategories, minAmount, maxAmount]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('userid', userid)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
      setFilteredTransactions(data || []);
      setChartsReady(false);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.category));
    }

    // Filter by amount range
    if (minAmount) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(t => Math.abs(t.amount) <= parseFloat(maxAmount));
    }

    setFilteredTransactions(filtered);
  };

  const handlePeriodChange = (period: string) => {
    setReportPeriod(period);
    const end = dayjs();
    let start;

    switch (period) {
      case 'week':
        start = end.subtract(1, 'week');
        break;
      case 'month':
        start = end.subtract(1, 'month');
        break;
      case 'quarter':
        start = end.subtract(3, 'month');
        break;
      case 'year':
        start = end.subtract(1, 'year');
        break;
      default:
        return;
    }

    setStartDate(start.format('YYYY-MM-DD'));
    setEndDate(end.format('YYYY-MM-DD'));
  };

  // Function to capture chart as image
  const captureChart = async (chartRef: HTMLElement | null): Promise<string> => {
    if (!chartRef) return '';
    
    try {
      const canvas = chartRef.querySelector('canvas');
      if (!canvas) return '';
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing chart:', error);
      return '';
    }
  };

  // Update chart data URLs when charts are rendered
  useEffect(() => {
    const updateChartImages = async () => {
      // Wait for charts to be rendered
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pieChartElement = document.getElementById('pie-chart');
      const barChartElement = document.getElementById('bar-chart');

      const pieDataUrl = await captureChart(pieChartElement);
      const barDataUrl = await captureChart(barChartElement);

      if (pieDataUrl && barDataUrl) {
        setPieChartDataUrl(pieDataUrl);
        setBarChartDataUrl(barDataUrl);
        setChartsReady(true);
      }
    };

    if (filteredTransactions.length > 0) {
      updateChartImages();
    }
  }, [filteredTransactions]);

  const allCategories = [...defaultCategories, ...categories];

  // Prepare chart data
  const categoryData = filteredTransactions.reduce((acc, t) => {
    const category = allCategories.find(c => c.id === t.category);
    const key = category?.name || t.category;
    acc[key] = (acc[key] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = {
    labels: Object.keys(categoryData),
    datasets: [{
      data: Object.values(categoryData),
      backgroundColor: Object.keys(categoryData).map(name => {
        const category = allCategories.find(c => c.name === name);
        return category?.color || '#9CA3AF';
      }),
    }],
  };

  // Prepare daily spending data
  const dailyData = filteredTransactions.reduce((acc, t) => {
    const date = dayjs(t.date).format('MMM DD');
    acc[date] = (acc[date] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const barChartData = {
    labels: Object.keys(dailyData),
    datasets: [{
      label: 'Daily Spending',
      data: Object.values(dailyData),
      backgroundColor: '#3B82F6',
    }],
  };

  const generatePDF = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Financial Report</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text>Period: {startDate} to {endDate}</Text>
          <Text>Total Transactions: {filteredTransactions.length}</Text>
          <Text>Total Spent: ${filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}</Text>
        </View>

        {pieChartDataUrl && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <Image src={pieChartDataUrl} style={styles.chartImage} />
          </View>
        )}

        {barChartDataUrl && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Daily Spending Trend</Text>
            <Image src={barChartDataUrl} style={styles.chartImage} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Date</Text>
              <Text style={styles.tableCell}>Description</Text>
              <Text style={styles.tableCell}>Amount</Text>
              <Text style={styles.tableCell}>Category</Text>
            </View>
            {filteredTransactions.map((t, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>{t.date}</Text>
                <Text style={styles.tableCell}>{t.description}</Text>
                <Text style={styles.tableCell}>${Math.abs(t.amount).toFixed(2)}</Text>
                <Text style={styles.tableCell}>{
                  allCategories.find(c => c.id === t.category)?.name || t.category
                }</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );

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
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600">Generate and analyze your financial reports</p>
      </div>

      <Card>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">Period</label>
              <select
                value={reportPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {reportPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <Button
              variant="outline"
              onClick={() => setSelectedCategories([])}
              icon={<Filter size={16} />}
            >
              Clear Filters
            </Button>

            {chartsReady && (
              <PDFDownloadLink
                document={generatePDF()}
                fileName={`financial-report-${startDate}-to-${endDate}.pdf`}
              >
                {({ loading }) => (
                  <Button
                    variant="primary"
                    disabled={loading}
                    icon={<Download size={16} />}
                  >
                    {loading ? 'Generating PDF...' : 'Download Report'}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Amount</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Amount</label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card title="Spending by Category" icon={<PieChartIcon className="h-5 w-5" />}>
          <div style={{ height: '300px' }} id="pie-chart">
            <PieChart data={pieChartData} />
          </div>
        </Card>
        
        <Card title="Daily Spending Trend" icon={<BarChart2 className="h-5 w-5" />}>
          <div style={{ height: '300px' }} id="bar-chart">
            <BarChart data={barChartData} />
          </div>
        </Card>
      </div>

      <Card title="Transaction Summary" icon={<FileText className="h-5 w-5" />} className="mt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Total Spent</h3>
              <p className="mt-2 text-2xl font-semibold text-blue-900">
                ${filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Average Transaction</h3>
              <p className="mt-2 text-2xl font-semibold text-green-900">
                ${(filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / (filteredTransactions.length || 1)).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">Total Transactions</h3>
              <p className="mt-2 text-2xl font-semibold text-purple-900">
                {filteredTransactions.length}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Reports;