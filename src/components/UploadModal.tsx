import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import FileUploader from './ui/FileUploader';
import Button from './ui/Button';
import { processExcelFile, processPdfFile } from '../lib/fileProcessor';
import { Transaction, CreditCard } from '../types';
import { getCreditCards } from '../lib/api';
import useStore from '../store';

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (transactions: Transaction[]) => void;
  userid: string;
};

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  userid,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCreditCard, setSelectedCreditCard] = useState<string>('');
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [processedFiles, setProcessedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (userid && isOpen) {
      loadCreditCards();
    }
  }, [userid, isOpen]);

  useEffect(() => {
    // Reset state when modal is closed
    if (!isOpen) {
      setFiles([]);
      setError(null);
      setSelectedCreditCard('');
      setProcessedFiles([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  const loadCreditCards = async () => {
    try {
      const { data } = await getCreditCards(userid);
      if (data) {
        setCreditCards(data);
      }
    } catch (err) {
      console.error('Error loading credit cards:', err);
      setError('Failed to load credit cards. Please try again.');
    }
  };

  if (!isOpen) return null;

  const handleFileSelect = (selectedFiles: File[]) => {
    setFiles(prev => [...prev, ...selectedFiles]);
    setError(null);
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
    setProcessedFiles(prev => prev.filter(name => name !== fileToRemove.name));
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    if (!selectedCreditCard) {
      setError('Please select a credit card');
      return;
    }

    setIsLoading(true);
    setError(null);

    const allTransactions: Transaction[] = [];
    const failedFiles: { name: string; error: string }[] = [];

    for (const file of files) {
      if (processedFiles.includes(file.name)) continue;

      try {
        let transactions: Transaction[] = [];

        if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
          transactions = await processExcelFile(file, userid, selectedCreditCard);
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
          transactions = await processPdfFile(file, userid, selectedCreditCard);
        } else {
          throw new Error('Unsupported file format');
        }

        if (transactions.length > 0) {
          allTransactions.push(...transactions);
          setProcessedFiles(prev => [...prev, file.name]);
        } else {
          throw new Error('No valid transactions found in file');
        }
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        failedFiles.push({
          name: file.name,
          error: err instanceof Error ? err.message : 'Unknown error occurred'
        });
      }
    }

    if (failedFiles.length > 0) {
      const errorMessages = failedFiles.map(f => `${f.name}: ${f.error}`).join('\n');
      setError(`Failed to process some files:\n${errorMessages}`);
    }

    if (allTransactions.length > 0) {
      onUpload(allTransactions);
      if (failedFiles.length === 0) {
        onClose();
      }
    } else if (failedFiles.length === 0) {
      setError('No valid transactions found in any of the selected files');
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Upload Statements</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="creditCard" className="block text-sm font-medium text-gray-700 mb-1">
              Select Credit Card
            </label>
            <select
              id="creditCard"
              value={selectedCreditCard}
              onChange={(e) => setSelectedCreditCard(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a card</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} {card.last_four && `(${card.last_four})`}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <a 
              href="https://docs.google.com/spreadsheets/d/1-0X-QxbFm_D9kukLbus4gy4WvqMcOyqh/edit?usp=sharing&ouid=100891042656582574661&rtpof=true&sd=true"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Download size={16} className="mr-2" />
              Download Excel Template
            </a>
          </div>
          
          <FileUploader
            onFileSelect={handleFileSelect}
            accept={{
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
              'application/pdf': ['.pdf'],
            }}
            loading={isLoading}
            selectedFiles={files}
            onRemoveFile={handleRemoveFile}
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm whitespace-pre-wrap">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpload}
              disabled={isLoading || files.length === 0 || !selectedCreditCard}
            >
              {isLoading ? 'Processing...' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;