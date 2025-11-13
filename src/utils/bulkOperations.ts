/**
 * Bulk Operations Utilities
 * 
 * Provides:
 * - Excel import/export for master data
 * - Multi-select operations
 * - Bulk update functionality
 */

import type { MasterData, Organization, GstRate, Location } from '../types';

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  // Determine columns
  const cols = columns || Object.keys(data[0]).map(key => ({
    key: key as keyof T,
    label: key
  }));
  
  // Create CSV header
  const header = cols.map(col => col.label).join(',');
  
  // Create CSV rows
  const rows = data.map(row => 
    cols.map(col => {
      const value = row[col.key];
      // Handle values that need escaping
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );
  
  const csv = [header, ...rows].join('\n');
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Import data from CSV file
 */
export function importFromCSV<T>(
  file: File,
  columnMapping: Record<string, keyof T>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('File is empty'));
          return;
        }
        
        // Parse header
        const header = lines[0].split(',').map(h => h.trim());
        
        // Parse rows
        const data: T[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row: any = {};
          
          header.forEach((col, index) => {
            const mappedKey = columnMapping[col];
            if (mappedKey && values[index] !== undefined) {
              row[mappedKey] = values[index];
            }
          });
          
          data.push(row as T);
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Export master data to Excel-compatible CSV
 */
export function exportMasterData(
  data: MasterData[],
  type: string
): void {
  exportToCSV(
    data,
    `${type}-${new Date().toISOString().split('T')[0]}.csv`,
    [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { key: 'createdAt', label: 'Created At' },
      { key: 'createdBy', label: 'Created By' }
    ]
  );
}

/**
 * Export organizations to Excel-compatible CSV
 */
export function exportOrganizations(data: Organization[]): void {
  exportToCSV(
    data,
    `organizations-${new Date().toISOString().split('T')[0]}.csv`,
    [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'gstin', label: 'GSTIN' },
      { key: 'pan', label: 'PAN' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'pincode', label: 'Pincode' }
    ]
  );
}

/**
 * Export GST rates to Excel-compatible CSV
 */
export function exportGSTRates(data: GstRate[]): void {
  exportToCSV(
    data,
    `gst-rates-${new Date().toISOString().split('T')[0]}.csv`,
    [
      { key: 'id', label: 'ID' },
      { key: 'hsnCode', label: 'HSN Code' },
      { key: 'description', label: 'Description' },
      { key: 'gstRate', label: 'GST Rate (%)' },
      { key: 'cgst', label: 'CGST (%)' },
      { key: 'sgst', label: 'SGST (%)' },
      { key: 'igst', label: 'IGST (%)' }
    ]
  );
}

/**
 * Import master data from CSV
 */
export async function importMasterData(file: File): Promise<MasterData[]> {
  return importFromCSV<MasterData>(file, {
    'ID': 'id',
    'Name': 'name',
    'Code': 'code',
    'Created At': 'createdAt',
    'Created By': 'createdBy'
  });
}

/**
 * Bulk update operation
 */
export interface BulkUpdateOperation<T> {
  ids: (string | number)[];
  updates: Partial<T>;
}

/**
 * Apply bulk updates to array of items
 */
export function applyBulkUpdates<T extends { id: string | number }>(
  items: T[],
  operation: BulkUpdateOperation<T>
): T[] {
  const idSet = new Set(operation.ids);
  
  return items.map(item => {
    if (idSet.has(item.id)) {
      return { ...item, ...operation.updates };
    }
    return item;
  });
}

/**
 * Bulk delete operation
 */
export function applyBulkDelete<T extends { id: string | number }>(
  items: T[],
  ids: (string | number)[]
): T[] {
  const idSet = new Set(ids);
  return items.filter(item => !idSet.has(item.id));
}

/**
 * Validate imported data
 */
export function validateImportedData<T>(
  data: T[],
  validators: {
    field: keyof T;
    validate: (value: any) => boolean;
    errorMessage: string;
  }[]
): {
  valid: T[];
  invalid: { row: number; data: T; errors: string[] }[];
} {
  const valid: T[] = [];
  const invalid: { row: number; data: T; errors: string[] }[] = [];
  
  data.forEach((row, index) => {
    const errors: string[] = [];
    
    validators.forEach(({ field, validate, errorMessage }) => {
      if (!validate(row[field])) {
        errors.push(`${String(field)}: ${errorMessage}`);
      }
    });
    
    if (errors.length === 0) {
      valid.push(row);
    } else {
      invalid.push({
        row: index + 2, // +2 because 1 is header, and Excel is 1-indexed
        data: row,
        errors
      });
    }
  });
  
  return { valid, invalid };
}

/**
 * Generate import template
 */
export function generateImportTemplate<T>(
  columns: { key: keyof T; label: string; example: string }[],
  filename: string
): void {
  // Create header row
  const header = columns.map(col => col.label).join(',');
  
  // Create example row
  const example = columns.map(col => col.example).join(',');
  
  const csv = [header, example].join('\n');
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate master data import template
 */
export function generateMasterDataTemplate(type: string): void {
  generateImportTemplate(
    [
      { key: 'name', label: 'Name', example: 'Sample Name' },
      { key: 'code', label: 'Code', example: 'SAMPLE001' }
    ],
    `${type}-import-template.csv`
  );
}

/**
 * Generate organization import template
 */
export function generateOrganizationTemplate(): void {
  generateImportTemplate(
    [
      { key: 'name', label: 'Name', example: 'ABC Traders' },
      { key: 'type', label: 'Type', example: 'Client' },
      { key: 'gstin', label: 'GSTIN', example: '29ABCDE1234F1Z5' },
      { key: 'pan', label: 'PAN', example: 'ABCDE1234F' },
      { key: 'email', label: 'Email', example: 'contact@example.com' },
      { key: 'phone', label: 'Phone', example: '+91-9876543210' },
      { key: 'address', label: 'Address', example: '123 Main Street' },
      { key: 'city', label: 'City', example: 'Mumbai' },
      { key: 'state', label: 'State', example: 'Maharashtra' },
      { key: 'pincode', label: 'Pincode', example: '400001' }
    ],
    'organizations-import-template.csv'
  );
}

/**
 * Generate GST rate import template
 */
export function generateGSTRateTemplate(): void {
  generateImportTemplate(
    [
      { key: 'hsnCode', label: 'HSN Code', example: '5201' },
      { key: 'description', label: 'Description', example: 'Cotton, not carded or combed' },
      { key: 'gstRate', label: 'GST Rate (%)', example: '5' },
      { key: 'cgst', label: 'CGST (%)', example: '2.5' },
      { key: 'sgst', label: 'SGST (%)', example: '2.5' },
      { key: 'igst', label: 'IGST (%)', example: '5' }
    ],
    'gst-rates-import-template.csv'
  );
}

/**
 * Merge imported data with existing data
 * Handles duplicates based on key field
 */
export function mergeImportedData<T extends Record<string, any>>(
  existing: T[],
  imported: T[],
  keyField: keyof T,
  strategy: 'skip' | 'replace' | 'merge' = 'skip'
): {
  merged: T[];
  skipped: T[];
  updated: T[];
  added: T[];
} {
  const existingMap = new Map(existing.map(item => [item[keyField], item]));
  
  const skipped: T[] = [];
  const updated: T[] = [];
  const added: T[] = [];
  
  imported.forEach(item => {
    const key = item[keyField];
    const existingItem = existingMap.get(key);
    
    if (existingItem) {
      if (strategy === 'skip') {
        skipped.push(item);
      } else if (strategy === 'replace') {
        existingMap.set(key, item);
        updated.push(item);
      } else if (strategy === 'merge') {
        const merged = { ...existingItem, ...item };
        existingMap.set(key, merged);
        updated.push(merged);
      }
    } else {
      existingMap.set(key, item);
      added.push(item);
    }
  });
  
  return {
    merged: Array.from(existingMap.values()),
    skipped,
    updated,
    added
  };
}
