/**
 * Enhanced Input Sanitization Service
 * 
 * Provides comprehensive input sanitization to prevent XSS attacks
 * and ensure data integrity across the application
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize text input to prevent XSS attacks
 * Removes HTML tags and potentially harmful content
 */
export const sanitizeText = (input: string): string => {
  if (!input) return '';
  
  // Use DOMPurify to remove any HTML/script tags
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
  
  // Additional cleanup
  return cleaned
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 500); // Enforce max length
};

/**
 * Sanitize commodity name with strict validation
 */
export const sanitizeCommodityName = (input: string): string => {
  if (!input) return '';
  
  const sanitized = sanitizeText(input);
  
  // Only allow letters, numbers, spaces, hyphens, and common punctuation
  return sanitized.replace(/[^a-zA-Z0-9\s\-().&,]/g, '');
};

/**
 * Sanitize commodity symbol - uppercase alphanumeric only
 */
export const sanitizeSymbol = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Only letters and numbers
    .substring(0, 10); // Max 10 characters
};

/**
 * Sanitize description with limited HTML support
 */
export const sanitizeDescription = (input: string): string => {
  if (!input) return '';
  
  // Allow basic formatting tags only
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
  });
  
  return cleaned.substring(0, 1000); // Max 1000 characters
};

/**
 * Validate and sanitize number input
 */
export const sanitizeNumber = (input: any): number | null => {
  if (input === null || input === undefined || input === '') return null;
  
  const num = Number(input);
  
  if (isNaN(num) || !isFinite(num)) return null;
  
  return num;
};

/**
 * Validate and sanitize array of IDs
 */
export const sanitizeIdArray = (input: any): number[] => {
  if (!Array.isArray(input)) return [];
  
  return input
    .map(id => sanitizeNumber(id))
    .filter((id): id is number => id !== null && id > 0);
};

/**
 * Detect potential SQL injection patterns
 */
export const detectSQLInjection = (input: string): boolean => {
  if (!input) return false;
  
  const sqlPatterns = [
    /(\bOR\b|\bAND\b).*=.*$/i,
    /UNION\s+SELECT/i,
    /DROP\s+(TABLE|DATABASE)/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /UPDATE\s+.*\s+SET/i,
    /--/,
    /\/\*/,
    /xp_/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Detect potential XSS patterns
 */
export const detectXSS = (input: string): boolean => {
  if (!input) return false;
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Comprehensive input validation
 */
export interface SanitizationResult {
  sanitized: string;
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export const comprehensiveSanitization = (
  input: string,
  fieldName: string
): SanitizationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check for SQL injection
  if (detectSQLInjection(input)) {
    errors.push(`${fieldName} contains potentially harmful SQL patterns`);
  }
  
  // Check for XSS
  if (detectXSS(input)) {
    errors.push(`${fieldName} contains potentially harmful script patterns`);
  }
  
  // Check for excessive length
  if (input.length > 1000) {
    warnings.push(`${fieldName} is very long and will be truncated`);
  }
  
  // Check for unusual characters
  if (/[^\x00-\x7F]/.test(input) && fieldName === 'symbol') {
    warnings.push(`${fieldName} contains non-ASCII characters`);
  }
  
  const sanitized = sanitizeText(input);
  
  return {
    sanitized,
    isValid: errors.length === 0,
    warnings,
    errors,
  };
};
