import { supabase } from './supabase';
import { Transaction } from '../types';
import { defaultCategories } from './categories';

const generateRandomAmount = () => {
  return Math.round(Math.random() * 1000 * 100) / 100;
};

const generateRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString()
    .split('T')[0];
};

const merchants = [
  'Walmart', 'Target', 'Amazon', 'Costco', 'Whole Foods',
  'Netflix', 'Spotify', 'Apple', 'Uber', 'Lyft',
  'Shell', 'Chevron', 'Home Depot', 'Starbucks', 'McDonald\'s'
];

const generateTransaction = (userid: string): Omit<Transaction, 'id'> => {
  const merchant = merchants[Math.floor(Math.random() * merchants.length)];
  const category = defaultCategories[Math.floor(Math.random() * defaultCategories.length)].id;
  const amount = generateRandomAmount();
  const date = generateRandomDate(new Date('2024-01-01'), new Date());
  
  return {
    userid,
    date,
    description: `${merchant} - Purchase`,
    amount: amount * (Math.random() > 0.8 ? -1 : 1), // Some refunds
    category,
    payment_method: Math.random() > 0.5 ? 'credit_card' : 'cash',
    is_recurring: Math.random() > 0.8, // 20% chance of being recurring
  };
};

export const generateTestData = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('No authenticated user');
    }

    const userid = session.user.id;
    const transactions = Array(100) // Generate 100 test transactions
      .fill(null)
      .map(() => generateTransaction(userid));

    // Insert transactions in batches of 10 to avoid timeouts
    for (let i = 0; i < transactions.length; i += 10) {
      const batch = transactions.slice(i, i + 10);
      const { error } = await supabase
        .from('transactions')
        .insert(batch);

      if (error) throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error generating test data:', error);
    return { error };
  }
};

export const cleanupTestData = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('No authenticated user');
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('userid', session.user.id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return { error };
  }
};