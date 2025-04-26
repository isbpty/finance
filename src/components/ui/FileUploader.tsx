import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import Button from './Button';

type FileUploaderProps = {
  onFileSelect: (files: File[]) => void;
  accept: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  className?: string;
  label?: string;
  loading?: boolean;
  selectedFiles?: File[];
  onRemoveFile?: (file: File) => void;
};

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  accept,
  maxSize = 10485760, // 10MB
  maxFiles = 5, // Allow up to 5 files by default
  className = '',
  label = 'Drag & drop your files here, or click to browse',
  loading = false,
  selectedFiles = [],
  onRemoveFile,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Limit the number of files that can be selected
      const totalFiles = selectedFiles.length + acceptedFiles.length;
      if (totalFiles > maxFiles) {
        alert(`You can only upload up to ${maxFiles} files at a time.`);
        return;
      }
      onFileSelect(acceptedFiles);
    },
    [onFileSelect, maxFiles, selectedFiles.length]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - selectedFiles.length,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        } ${isDragReject ? 'border-red-400 bg-red-50' : ''} ${className}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-xs text-gray-400">
          Supported formats: Excel (.xlsx, .xls), PDF (.pdf)
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Maximum file size: {formatFileSize(maxSize)}
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={loading || selectedFiles.length >= maxFiles}
          >
            {loading ? 'Processing...' : 'Select Files'}
          </Button>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-white p-2 rounded-md text-sm"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">{file.name}</span>
                  <span className="text-gray-400">({formatFileSize(file.size)})</span>
                </div>
                {onRemoveFile && (
                  <button
                    onClick={() => onRemoveFile(file)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;