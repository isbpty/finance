import { supabase } from './supabase';

export interface HeaderMapping {
  id: string;
  excelHeader: string;
  systemField: string;
  isRequired: boolean;
  description?: string;
  format?: string;
  example?: string;
}

export const systemFields = [
  { 
    value: 'date', 
    label: 'Date', 
    description: 'Transaction date',
    format: 'DD/MM/YYYY or MM/DD/YYYY',
    example: '15/04/2024'
  },
  { 
    value: 'description', 
    label: 'Description', 
    description: 'Transaction description or merchant name',
    format: 'Text',
    example: 'Walmart - Groceries'
  },
  { 
    value: 'amount', 
    label: 'Amount', 
    description: 'Transaction amount (positive or negative)',
    format: 'Number (2 decimal places)',
    example: '-50.00'
  },
  { 
    value: 'category', 
    label: 'Category', 
    description: 'Transaction category (optional)',
    format: 'Text',
    example: 'groceries'
  },
  { 
    value: 'merchant', 
    label: 'Merchant', 
    description: 'Merchant name (optional)',
    format: 'Text',
    example: 'Walmart'
  }
];

export async function saveHeaderMappings(mappings: HeaderMapping[]) {
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ 
        key: 'header_mappings',
        value: mappings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error saving header mappings:', error);
    return { error };
  }
}

export async function loadHeaderMappings(): Promise<HeaderMapping[]> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'header_mappings')
      .single();

    if (error) throw error;

    if (!data?.value) {
      // Return default mappings if none exist
      return [
        { id: '1', excelHeader: 'fecha', systemField: 'date', isRequired: true },
        { id: '2', excelHeader: 'description', systemField: 'description', isRequired: true },
        { id: '3', excelHeader: 'amount', systemField: 'amount', isRequired: true },
        { id: '4', excelHeader: 'category', systemField: 'category', isRequired: false }
      ];
    }

    return data.value;
  } catch (error) {
    console.error('Error loading header mappings:', error);
    // Return default mappings on error
    return [
      { id: '1', excelHeader: 'fecha', systemField: 'date', isRequired: true },
      { id: '2', excelHeader: 'description', systemField: 'description', isRequired: true },
      { id: '3', excelHeader: 'amount', systemField: 'amount', isRequired: true },
      { id: '4', excelHeader: 'category', systemField: 'category', isRequired: false }
    ];
  }
}