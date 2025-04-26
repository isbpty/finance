import React from 'react';
import { Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import Card from '../ui/Card';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: ChartData<'pie'>;
  title?: string;
  height?: number;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  title = 'Spending by Category', 
  height = 300,
  className = ''
}) => {
  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => (a as number) + (b as number), 0);
            const percentage = Math.round(value / (total as number) * 100);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Card title={title} className={className}>
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Pie data={data} options={options} />
      </div>
    </Card>
  );
};

export default PieChart;