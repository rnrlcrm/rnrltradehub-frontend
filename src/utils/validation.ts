/**
 * Validation Utilities
 * 
 * Common validation functions for forms and data
 */

/**
 * Check for duplicate names in a list
 */
export const isDuplicateName = <T extends { name: string }>(
  items: T[],
  name: string,
  excludeId?: number | string
): boolean => {
  return items.some(
    item =>
      item.name.toLowerCase().trim() === name.toLowerCase().trim() &&
      (excludeId === undefined || ('id' in item && item.id !== excludeId))
  );
};

/**
 * Check for duplicate organization code
 */
export const isDuplicateCode = <T extends { code?: string }>(
  items: T[],
  code: string,
  excludeId?: number | string
): boolean => {
  if (!code) return false;
  return items.some(
    item =>
      item.code?.toLowerCase().trim() === code.toLowerCase().trim() &&
      (excludeId === undefined || ('id' in item && item.id !== excludeId))
  );
};

/**
 * Validate GSTIN format
 */
export const isValidGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

/**
 * Validate PAN format
 */
export const isValidPAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  // Remove common separators
  const cleanPhone = phone.replace(/[-\s()]/g, '');
  return phoneRegex.test(cleanPhone);
};

/**
 * Validate IFSC code
 */
export const isValidIFSC = (ifsc: string): boolean => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

/**
 * Validate HSN code
 */
export const isValidHSN = (hsn: string): boolean => {
  // HSN codes are 4, 6, or 8 digits
  const hsnRegex = /^\d{4}(\d{2})?(\d{2})?$/;
  return hsnRegex.test(hsn);
};

/**
 * Validate percentage (0-100)
 */
export const isValidPercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return value > 0;
};

/**
 * Validate non-negative number
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return value >= 0;
};

/**
 * Sanitize string input (basic XSS prevention)
 */
export const sanitizeString = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Trim and normalize whitespace
 */
export const normalizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};
