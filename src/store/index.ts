import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Category, DateRange } from '../types';
import { defaultCategories, loadAllCategories } from '../lib/categories';

// Helper function to get formatted date string
const getFormattedDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get default date range
const getDefaultDateRange = (): DateRange => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return {
    startDate: getFormattedDate(startDate),
    endDate: getFormattedDate(endDate),
  };
};

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  dateRange: DateRange;
  isAuthenticated: boolean;
  userid: string | null;
  isLoading: boolean;
  error: string | null;
  isDarkMode: boolean;
  setTransactions: (transactions: Transaction[]) => void;
  addTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  setDateRange: (dateRange: DateRange) => void;
  setUserId: (userid: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleDarkMode: () => void;
  resetState: () => void;
  initializeCategories: () => Promise<void>;
}

const initialState = {
  transactions: [],
  categories: [],
  dateRange: getDefaultDateRange(),
  isAuthenticated: false,
  userid: null,
  isLoading: false,
  error: null,
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
};

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setTransactions: (transactions) => set({ transactions }),
      
      addTransactions: (newTransactions) => set((state) => ({ 
        transactions: [...state.transactions, ...newTransactions] 
      })),
      
      updateTransaction: (updatedTransaction) => set((state) => ({
        transactions: state.transactions.map((t) => 
          t.id === updatedTransaction.id ? updatedTransaction : t
        ),
      })),
      
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      })),
      
      setCategories: (categories) => set({ categories }),
      
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, category],
      })),
      
      updateCategory: (updatedCategory) => set((state) => ({
        categories: state.categories.map((c) => 
          c.id === updatedCategory.id ? updatedCategory : c
        ),
      })),
      
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      })),
      
      setDateRange: (dateRange) => set({ dateRange }),
      
      setUserId: (userid) => set({ userid }),
      
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      setIsLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      resetState: () => set(initialState),

      initializeCategories: async () => {
        try {
          const allCategories = await loadAllCategories();
          set({ categories: allCategories.filter(c => !defaultCategories.find(dc => dc.id === c.id)) });
        } catch (error) {
          console.error('Error initializing categories:', error);
          set({ categories: [] });
        }
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);

export default useStore;