import { supabase } from './supabase';
import { Transaction } from '../types';
import { Category } from '../types';
import { BarChart2, Coffee, CreditCard, Home, Plane, ShoppingCart, Utensils, Car, Heart, Wrench, Globe, BookOpen, Gift } from 'lucide-react';

// Load both default and admin-created categories
export async function loadAllCategories(): Promise<Category[]> {
  try {
    // Get admin-created categories from system settings
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'system_categories')
      .single();

    if (error) throw error;

    // Combine default categories with admin categories if they exist
    const adminCategories = data?.value || [];
    return [...defaultCategories, ...adminCategories];
  } catch (error) {
    console.error('Error loading categories:', error);
    // Fallback to default categories if there's an error
    return defaultCategories;
  }
}

// Default categories as fallback
export const defaultCategories: Category[] = [
  { id: 'groceries', name: 'Groceries', color: '#10B981', icon: 'ShoppingCart' },
  { id: 'dining', name: 'Dining Out', color: '#F59E0B', icon: 'Utensils' },
  { id: 'entertainment', name: 'Entertainment', color: '#8B5CF6', icon: 'BarChart2' },
  { id: 'transportation', name: 'Transportation', color: '#3B82F6', icon: 'Car' },
  { id: 'shopping', name: 'Shopping', color: '#EC4899', icon: 'ShoppingCart' },
  { id: 'travel', name: 'Travel', color: '#06B6D4', icon: 'Plane' },
  { id: 'housing', name: 'Housing', color: '#6366F1', icon: 'Home' },
  { id: 'utilities', name: 'Utilities', color: '#D97706', icon: 'Home' },
  { id: 'healthcare', name: 'Healthcare', color: '#EF4444', icon: 'Heart' },
  { id: 'education', name: 'Education', color: '#0EA5E9', icon: 'BookOpen' },
  { id: 'gifts', name: 'Gifts', color: '#F472B6', icon: 'Gift' },
  { id: 'services', name: 'Services', color: '#71717A', icon: 'Wrench' },
  { id: 'subscriptions', name: 'Subscriptions', color: '#9333EA', icon: 'CreditCard' },
  { id: 'other', name: 'Other', color: '#9CA3AF', icon: 'Globe' },
];

// Function to categorize a transaction based on its description
export function categorizeTransaction(description: string): string {
  const normalizedDesc = description.toLowerCase();

  // Common keywords for each category
  const categoryKeywords: { [key: string]: string[] } = {
    groceries: ['grocery', 'supermarket', 'food', 'market', 'walmart', 'target', 'costco', 'safeway', 'trader', 'whole foods'],
    dining: ['restaurant', 'cafe', 'coffee', 'bar', 'grill', 'pizzeria', 'mcdonalds', 'starbucks'],
    entertainment: ['cinema', 'movie', 'theater', 'netflix', 'spotify', 'hulu', 'disney+', 'game', 'concert'],
    transportation: ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'transit', 'train'],
    shopping: ['amazon', 'ebay', 'store', 'shop', 'retail', 'clothing', 'mall'],
    travel: ['hotel', 'airline', 'flight', 'airbnb', 'booking.com', 'expedia', 'travel'],
    housing: ['rent', 'mortgage', 'apartment', 'home', 'lease', 'property'],
    utilities: ['electric', 'water', 'gas', 'internet', 'phone', 'cable', 'utility'],
    healthcare: ['medical', 'doctor', 'hospital', 'pharmacy', 'dental', 'health', 'clinic'],
    education: ['school', 'university', 'college', 'tuition', 'course', 'book', 'education'],
    gifts: ['gift', 'present', 'donation', 'charity'],
    services: ['service', 'repair', 'maintenance', 'cleaning', 'insurance'],
    subscriptions: ['subscription', 'membership', 'monthly', 'annual']
  };

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => normalizedDesc.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

export async function suggestCategory(description: string, userid: string): Promise<string> {
  try {
    // First, check for exact matches in learned patterns
    const { data: exactMatches } = await supabase
      .from('learned_patterns')
      .select('category, confidence')
      .eq('userid', userid)
      .eq('pattern', description)
      .neq('category', 'other') // Exclude 'other' category
      .order('confidence', { ascending: false })
      .limit(1);

    if (exactMatches?.[0]?.category) {
      return exactMatches[0].category;
    }

    // Then check for similar descriptions from other users
    const { data: similarMatches } = await supabase
      .from('transactions')
      .select('category, learned_category')
      .ilike('description', `%${description}%`)
      .neq('category', 'other') // Exclude 'other' category
      .order('created_at', { ascending: false })
      .limit(10);

    if (similarMatches?.length) {
      // Count category occurrences, excluding 'other'
      const categoryCounts = similarMatches.reduce((acc: { [key: string]: number }, curr) => {
        const category = curr.learned_category || curr.category;
        if (category && category !== 'other') {
          acc[category] = (acc[category] || 0) + 1;
        }
        return acc;
      }, {});

      if (Object.keys(categoryCounts).length > 0) {
        // Return the most common category
        const mostCommonCategory = Object.entries(categoryCounts)
          .sort(([,a], [,b]) => b - a)[0][0];
        
        // Store this pattern for future use
        await supabase
          .from('learned_patterns')
          .insert({
            userid,
            pattern: description,
            category: mostCommonCategory,
            confidence: 0.7 // Initial confidence score
          })
          .onConflict(['userid', 'pattern'])
          .ignore();

        return mostCommonCategory;
      }
    }

    // If no matches found, use default categorization but exclude 'other'
    const suggestedCategory = categorizeTransaction(description);
    return suggestedCategory === 'other' ? 'shopping' : suggestedCategory; // Default to 'shopping' instead of 'other'
  } catch (error) {
    console.error('Error suggesting category:', error);
    return 'shopping'; // Default to 'shopping' on error instead of 'other'
  }
}

export async function updateAllTransactionsCategory(oldCategory: string, newCategory: string, userid: string): Promise<void> {
  if (newCategory === 'other') return; // Don't update if new category is 'other'

  try {
    // Update all transactions with the old category
    await supabase
      .from('transactions')
      .update({ 
        category: newCategory,
        learned_category: newCategory 
      })
      .eq('userid', userid)
      .eq('category', oldCategory);

    // Update learned patterns
    await supabase
      .from('learned_patterns')
      .update({ 
        category: newCategory,
        confidence: 0.9, // High confidence since it's a manual update
        updated_at: new Date().toISOString()
      })
      .eq('userid', userid)
      .eq('category', oldCategory);
  } catch (error) {
    console.error('Error updating categories:', error);
    throw error;
  }
}

export async function updateSimilarTransactions(transaction: Transaction): Promise<void> {
  if (!transaction.id || !transaction.userid || transaction.category === 'other') return;

  try {
    // Update similar transactions
    await supabase
      .from('transactions')
      .update({ 
        category: transaction.category,
        learned_category: transaction.category 
      })
      .eq('userid', transaction.userid)
      .ilike('description', `%${transaction.description}%`);

    // Update or insert learned pattern
    await supabase
      .from('learned_patterns')
      .upsert({
        userid: transaction.userid,
        pattern: transaction.description,
        category: transaction.category,
        confidence: 0.8, // High confidence for manual categorization
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['userid', 'pattern']
      });
  } catch (error) {
    console.error('Error updating similar transactions:', error);
    throw error;
  }
}