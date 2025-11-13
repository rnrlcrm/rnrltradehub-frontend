/**
 * ID Generation Utilities
 * 
 * Utilities for generating unique IDs
 * Replaces Date.now() with more robust UUID generation
 */

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID() if available, falls back to custom implementation
 */
export const generateId = (): string => {
  // Use native crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generate a numeric ID (for backward compatibility)
 * Still uses timestamp but adds random component to reduce collision risk
 */
export const generateNumericId = (): number => {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
};

/**
 * Generate a short ID (8 characters)
 * Useful for display purposes
 */
export const generateShortId = (): string => {
  return generateId().split('-')[0];
};
