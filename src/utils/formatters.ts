/**
 * Formatting Utilities
 * Common formatting functions for currency, dates, and numbers
 */

/**
 * Format a number as Indian currency (INR)
 * @param amount - Amount to format
 * @param options - Additional formatting options
 * @returns Formatted currency string with ₹ symbol
 * @example formatCurrency(1234.56) => "₹1,234.56"
 */
export const formatCurrency = (
  amount: number,
  options?: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  const { showSymbol = true, minimumFractionDigits = 2, maximumFractionDigits = 2 } = options || {};
  
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits,
  });
  
  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format a number using Indian locale
 * @param value - Number to format
 * @param options - Additional formatting options
 * @returns Formatted number string
 * @example formatNumber(1234567) => "12,34,567"
 */
export const formatNumber = (
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  return value.toLocaleString('en-IN', options);
};

/**
 * Format a date using standard locale string format
 * @param date - Date to format (Date object or ISO string)
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 * @example formatDate(new Date()) => "12/11/2023"
 */
export const formatDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', options);
};

/**
 * Format a date with time using standard locale string format
 * @param date - Date to format (Date object or ISO string)
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date and time string
 * @example formatDateTime(new Date()) => "12/11/2023, 2:30:45 PM"
 */
export const formatDateTime = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-IN', options);
};

/**
 * Format a percentage value
 * @param value - Value to format as percentage
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 * @example formatPercentage(12.5) => "12.50%"
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a compact number (e.g., 1.2K, 3.4M)
 * @param value - Number to format
 * @returns Compact formatted number
 * @example formatCompactNumber(1234) => "1.2K"
 */
export const formatCompactNumber = (value: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    compactDisplay: 'short',
  });
  return formatter.format(value);
};
