import { supabase } from './supabase';
import { Transaction, DateRange } from '../types';

export async function uploadTransactions(transactions: Transaction[]) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions)
    .select();
  
  return { data, error };
}

export async function getTransactions(userid: string, dateRange?: DateRange) {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('userid', userid)
    .order('date', { ascending: false });
  
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    query = query
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);
  }
  
  const { data, error } = await query;
  
  return { data, error };
}

export async function updateTransaction(transaction: Transaction) {
  // Remove the merchant field as it's generated
  const { merchant, ...updateData } = transaction;
  
  // First update the current transaction
  const { data, error: updateError } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', transaction.id)
    .select();
  
  if (updateError) return { data: null, error: updateError };

  // Then update all transactions with the same merchant
  const { error: batchError } = await supabase
    .from('transactions')
    .update({ category: transaction.category })
    .eq('userid', transaction.userid)
    .ilike('description', `%${transaction.description}%`)
    .neq('id', transaction.id);

  return { data, error: batchError };
}

export async function updateRecurringStatus(transaction: Transaction, userid: string) {
  // Remove the merchant field as it's generated
  const { merchant, ...updateData } = transaction;
  
  // First update the current transaction
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ is_recurring: updateData.is_recurring })
    .eq('id', transaction.id);

  if (updateError) return { error: updateError };

  // Then update all transactions with the same description
  const { error: batchError } = await supabase
    .from('transactions')
    .update({ is_recurring: updateData.is_recurring })
    .eq('userid', userid)
    .eq('description', transaction.description)
    .neq('id', transaction.id);

  return { error: batchError };
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  
  return { error };
}

export async function clearTransactions(userid: string) {
  // Call the stored function to clear transactions
  const { error } = await supabase
    .rpc('clear_user_transactions', {
      p_userid: userid
    });

  return { error };
}

export async function getCategoryTotals(userid: string, dateRange?: DateRange) {
  let query = supabase
    .from('transactions')
    .select('category, amount')
    .eq('userid', userid);
  
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    query = query
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);
  }
  
  const { data, error } = await query;
  
  if (error || !data) {
    return { data: null, error };
  }
  
  const categoryTotals: Record<string, number> = {};
  
  data.forEach((transaction) => {
    const { category, amount } = transaction;
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += amount;
  });
  
  return { data: categoryTotals, error: null };
}

export async function getMonthlyTotals(userid: string, year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount')
    .eq('userid', userid)
    .gte('date', startDate)
    .lte('date', endDate);
  
  if (error || !data) {
    return { data: null, error };
  }
  
  const monthlyTotals: number[] = Array(12).fill(0);
  
  data.forEach((transaction) => {
    const date = new Date(transaction.date);
    const month = date.getMonth();
    monthlyTotals[month] += transaction.amount;
  });
  
  return { data: monthlyTotals, error: null };
}

export async function findSimilarTransactions(description: string, userid: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('userid', userid)
    .eq('description', description)
    .order('date', { ascending: false });
  
  return { data, error };
}

export async function getCreditCards(userid: string) {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('userid', userid)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function createCreditCard(creditCard: Omit<CreditCard, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('credit_cards')
    .insert([creditCard])
    .select();

  return { data, error };
}

export async function deleteCreditCard(id: string) {
  const { error } = await supabase
    .from('credit_cards')
    .delete()
    .eq('id', id);

  return { error };
}