import React, { useState, useEffect } from 'react';
import { Upload, Search, FileText, Image as ImageIcon, Trash2, Plus, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import useStore from '../store';
import { createWorker } from 'tesseract.js';
import toast from 'react-hot-toast';
import TransactionForm from '../components/TransactionForm';
import { Transaction } from '../types';

interface Receipt {
  id: string;
  userid: string;
  transaction_id: string | null;
  image_url: string;
  ocr_text: string | null;
  created_at: string;
  transaction?: {
    date: string;
    description: string;
    amount: number;
  };
}

interface ExtractedData {
  date?: string;
  amount?: number;
  description?: string;
}

const Receipts: React.FC = () => {
  const { userid } = useStore();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 5242880, // 5MB
    onDrop: handleFileDrop
  });

  useEffect(() => {
    if (userid) {
      loadReceipts();
    }
  }, [userid]);

  async function loadReceipts() {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          transaction:transactions (
            date,
            description,
            amount
          )
        `)
        .eq('userid', userid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error('Failed to load receipts');
    } finally {
      setIsLoading(false);
    }
  }

  function extractDataFromText(text: string): ExtractedData {
    const data: ExtractedData = {};
    
    // Try to find a date
    const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      const dateParts = dateMatch[0].split(/[-/]/);
      // Assume MM/DD/YYYY format
      const year = dateParts[2].length === 2 ? '20' + dateParts[2] : dateParts[2];
      data.date = `${year}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
    }

    // Try to find amount (look for currency symbols or common patterns)
    const amountRegex = /\$?\s*\d+\.\d{2}/g;
    const amounts = text.match(amountRegex);
    if (amounts) {
      // Get the largest amount as it's likely the total
      const parsedAmounts = amounts.map(a => parseFloat(a.replace('$', '')));
      data.amount = Math.max(...parsedAmounts);
    }

    // Try to find merchant name (first line or after "MERCHANT:")
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const merchantLine = lines.find(line => 
      line.toUpperCase().includes('MERCHANT:') || 
      !line.match(/\d/) // Line without numbers is likely the merchant name
    );
    if (merchantLine) {
      data.description = merchantLine.replace(/MERCHANT:\s*/i, '').trim();
    }

    return data;
  }

  async function handleFileDrop(acceptedFiles: File[]) {
    if (!userid) return;
    
    setIsProcessing(true);
    try {
      for (const file of acceptedFiles) {
        // Upload image to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(`${userid}/${Date.now()}-${file.name}`, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(uploadData.path);

        // Perform OCR
        const worker = await createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();

        // Extract structured data
        const extractedData = extractDataFromText(text);
        setExtractedData(extractedData);

        // Save receipt to database
        const { data: receipt, error: dbError } = await supabase
          .from('receipts')
          .insert({
            userid,
            image_url: publicUrl,
            ocr_text: text,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setCurrentReceipt(receipt);
        setShowTransactionForm(true);
        await loadReceipts();
      }

      toast.success('Receipt processed successfully');
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error('Failed to process receipt');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(id: string, imageUrl: string) {
    if (!confirm('Are you sure you want to delete this receipt?')) return;

    try {
      // Delete from storage
      const path = imageUrl.split('/').pop();
      if (path) {
        await supabase.storage
          .from('receipts')
          .remove([`${userid}/${path}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Receipt deleted successfully');
      setReceipts(receipts.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast.error('Failed to delete receipt');
    }
  }

  async function handleCreateTransaction(transaction: Transaction) {
    try {
      // Insert transaction
      const { data: newTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          userid,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update receipt with transaction_id
      if (currentReceipt) {
        const { error: updateError } = await supabase
          .from('receipts')
          .update({ transaction_id: newTransaction.id })
          .eq('id', currentReceipt.id);

        if (updateError) throw updateError;
      }

      toast.success('Transaction created successfully');
      setShowTransactionForm(false);
      setCurrentReceipt(null);
      setExtractedData(null);
      await loadReceipts();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction');
    }
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Receipt Management</h1>
        <p className="text-gray-600">Upload and manage your receipts</p>
      </div>

      <Card>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isProcessing ? 'bg-gray-50' : 'hover:border-blue-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600">
                {isProcessing
                  ? 'Processing receipt...'
                  : 'Drag & drop receipts here, or click to select files'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports: PNG, JPG, JPEG (max 5MB)
              </p>
            </div>
          </div>
        </div>
      </Card>

      {showTransactionForm && extractedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Create Transaction from Receipt</h3>
              <button onClick={() => {
                setShowTransactionForm(false);
                setCurrentReceipt(null);
                setExtractedData(null);
              }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <TransactionForm
              transaction={{
                date: extractedData.date || new Date().toISOString().split('T')[0],
                description: extractedData.description || '',
                amount: extractedData.amount || 0,
                category: 'other',
                userid,
              }}
              onSave={handleCreateTransaction}
              onCancel={() => {
                setShowTransactionForm(false);
                setCurrentReceipt(null);
                setExtractedData(null);
              }}
            />
          </div>
        </div>
      )}

      <Card title="Receipts" icon={<FileText className="h-5 w-5" />}>
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search receipts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-md"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="border rounded-lg overflow-hidden bg-white"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  <img
                    src={receipt.image_url}
                    alt="Receipt"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  {receipt.transaction ? (
                    <div className="mb-2">
                      <p className="font-medium">{receipt.transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {receipt.transaction.date} - ${Math.abs(receipt.transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentReceipt(receipt);
                        setExtractedData(extractDataFromText(receipt.ocr_text || ''));
                        setShowTransactionForm(true);
                      }}
                      icon={<Plus size={14} />}
                      className="mb-2"
                    >
                      Create Transaction
                    </Button>
                  )}
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(receipt.image_url, '_blank')}
                      icon={<ImageIcon size={14} />}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(receipt.id, receipt.image_url)}
                      icon={<Trash2 size={14} />}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {receipts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No receipts found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Receipts;