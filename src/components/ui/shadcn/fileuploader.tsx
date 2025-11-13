import * as React from 'react';
import { Upload, X, FileIcon, ImageIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from './button';

export interface FileUploaderProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  value = [],
  onChange,
  accept,
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  className,
  disabled = false,
}) => {
  const [files, setFiles] = React.useState<File[]>(value);
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setFiles(value);
  }, [value]);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter((file) => {
      // Check file size
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        return false;
      }
      return true;
    });

    const updatedFiles = multiple
      ? [...files, ...validFiles].slice(0, maxFiles)
      : validFiles.slice(0, 1);

    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!disabled) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
            : 'border-neutral-300 dark:border-neutral-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="h-10 w-10 text-neutral-400 mb-4" />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Drag & drop files here, or click to select
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
            {accept ? `Supported: ${accept}` : 'All file types supported'} • Max {(maxSize / 1024 / 1024).toFixed(0)}MB per file
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            Browse Files
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Uploaded Files ({files.length})
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isImage(file) ? (
                  <ImageIcon className="h-8 w-8 text-primary-500 flex-shrink-0" />
                ) : (
                  <FileIcon className="h-8 w-8 text-neutral-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
