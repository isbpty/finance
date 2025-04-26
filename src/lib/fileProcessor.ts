import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { categorizeTransaction } from './categories';
import { findSimilarTransactions } from './api';

// Helper function to normalize text
function normalizeText(text: any): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[""'']/g, '')
    .replace(/\s+/g, ' ');
}

// Helper function to parse amount
function parseAmount(value: any): number {
  if (!value) return 0;
  
  // Handle string values
  if (typeof value === 'string') {
    // Remove currency symbols and thousands separators
    const cleanValue = value
      .replace(/[^0-9.-]/g, '')
      .replace(/,/g, '');
    return parseFloat(cleanValue) || 0;
  }
  
  // Handle numeric values
  if (typeof value === 'number') {
    return value;
  }
  
  return 0;
}

// Helper function to find column index with multiple possible header names
function findColumnIndex(headers: string[], patterns: RegExp[]): number {
  const normalizedHeaders = headers.map(h => normalizeText(h));
  console.log('Normalized headers:', normalizedHeaders);
  console.log('Looking for patterns:', patterns.map(p => p.toString()));
  
  const index = normalizedHeaders.findIndex(header => 
    patterns.some(pattern => pattern.test(header))
  );
  
  console.log('Found index:', index);
  return index;
}

export async function processExcelFile(file: File, userid: string): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read file contents');
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('The Excel file is empty');
        }

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with all rows
        const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (!Array.isArray(allRows) || allRows.length === 0) {
          throw new Error('No data found in the worksheet');
        }

        console.log('Processing file:', file.name);
        console.log('First few rows:', allRows.slice(0, 10));

        // Define patterns for column headers
        const datePatterns = [
          /fecha.*transaccion/i,
          /fecha/i,
          /date/i,
          /fecha.*operacion/i
        ];

        const descriptionPatterns = [
          /descripcion/i,
          /merchant/i,
          /description/i,
          /concepto/i
        ];

        const amountPatterns = [
          /cargos.*db/i,
          /amount/i,
          /monto/i,
          /cargo/i,
          /debito/i
        ];

        // Find header row (search first 10 rows)
        let headerRow: string[] = [];
        let headerIndex = -1;

        for (let i = 0; i < Math.min(10, allRows.length); i++) {
          const row = allRows[i];
          if (!Array.isArray(row)) continue;

          console.log('Checking row', i, ':', row);
          const normalizedRow = row.map(cell => normalizeText(cell));
          
          // Check if this row contains our expected headers
          const hasDateColumn = normalizedRow.some(cell => 
            datePatterns.some(pattern => pattern.test(cell))
          );
          
          const hasDescriptionColumn = normalizedRow.some(cell => 
            descriptionPatterns.some(pattern => pattern.test(cell))
          );
          
          const hasAmountColumn = normalizedRow.some(cell => 
            amountPatterns.some(pattern => pattern.test(cell))
          );

          console.log('Row analysis:', {
            hasDateColumn,
            hasDescriptionColumn,
            hasAmountColumn,
            normalizedRow
          });

          if (hasDateColumn && hasDescriptionColumn && hasAmountColumn) {
            headerRow = row.map(String);
            headerIndex = i;
            console.log('Found header row at index:', i);
            console.log('Header row:', headerRow);
            break;
          }
        }

        if (headerIndex === -1) {
          throw new Error('Could not find a valid header row in the first 10 rows of the file');
        }

        // Find column indices
        const dateIndex = findColumnIndex(headerRow, datePatterns);
        const descriptionIndex = findColumnIndex(headerRow, descriptionPatterns);
        const amountIndex = findColumnIndex(headerRow, amountPatterns);

        console.log('Column indices:', {
          dateIndex,
          descriptionIndex,
          amountIndex
        });

        if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
          throw new Error('Required columns not found in the header row');
        }

        const transactions: Transaction[] = [];
        const today = new Date().toISOString().slice(0, 10);
        const processedDescriptions = new Map<string, string>();

        // Process data rows
        for (let i = headerIndex + 1; i < allRows.length; i++) {
          const row = allRows[i];
          if (!Array.isArray(row)) continue;

          const description = String(row[descriptionIndex] || '').trim();
          if (!description) continue;

          let date = row[dateIndex];
          if (typeof date === 'number') {
            // Handle Excel date number
            const excelDate = new Date(Math.round((date - 25569) * 86400 * 1000));
            date = excelDate.toISOString().slice(0, 10);
          } else if (typeof date === 'string') {
            // Try to parse date string
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              date = parsedDate.toISOString().slice(0, 10);
            } else {
              // Try to parse DD/MM/YYYY format
              const parts = date.split(/[/-]/);
              if (parts.length === 3) {
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                const month = parts[1].padStart(2, '0');
                const day = parts[0].padStart(2, '0');
                date = `${year}-${month}-${day}`;
              } else {
                date = today;
              }
            }
          } else {
            date = today;
          }

          const amount = parseAmount(row[amountIndex]);
          if (amount === 0) continue;

          // Get category from similar transactions or categorize new ones
          let category = processedDescriptions.get(description);
          
          if (!category) {
            try {
              const { data: similarTransactions } = await findSimilarTransactions(description, userid);
              if (similarTransactions?.length) {
                category = similarTransactions[0].category;
              } else {
                category = categorizeTransaction(description);
              }
              processedDescriptions.set(description, category);
            } catch (error) {
              console.error('Error finding similar transactions:', error);
              category = categorizeTransaction(description);
            }
          }

          transactions.push({
            date,
            description,
            amount,
            category: category || 'other',
            userid,
          });
        }

        if (transactions.length === 0) {
          throw new Error('No valid transactions found in the file');
        }

        console.log(`Successfully processed ${transactions.length} transactions`);
        resolve(transactions);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export async function processPdfFile(file: File, userid: string): Promise<Transaction[]> {
  // PDF processing is not implemented yet
  throw new Error('PDF processing is not supported yet');
}