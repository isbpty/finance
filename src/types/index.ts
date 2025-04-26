export type Transaction = {
  id?: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  learned_category?: string;
  merchant?: string;
  userid: string;
  is_recurring?: boolean;
  createdAt?: string;
  payment_method?: 'cash' | 'credit_card' | 'unknown';
  credit_card_id?: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

type User = {
  id: string;
  email: string;
};

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type FilterOptions = {
  dateRange: DateRange;
  category: string;
  merchant: string;
  minAmount: string;
  maxAmount: string;
};

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
};

export type CreditCard = {
  id: string;
  userid: string;
  name: string;
  last_four?: string;
  created_at?: string;
};