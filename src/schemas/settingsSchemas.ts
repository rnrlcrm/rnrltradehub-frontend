/**
 * Validation Schemas
 * 
 * Zod schemas for form validation in the Settings module
 */

import { z } from 'zod';

// ============================================================================
// HELPER VALIDATORS
// ============================================================================

const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[6-9]\d{9}$/;
const hsnRegex = /^\d{4}(\d{2})?(\d{2})?$/;

// ============================================================================
// ORGANIZATION SCHEMA
// ============================================================================

export const organizationSchema = z.object({
  name: z.string()
    .min(1, 'Organization name is required')
    .max(100, 'Name must be less than 100 characters'),
  
  code: z.string()
    .min(1, 'Organization code is required')
    .max(20, 'Code must be less than 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
  
  gstin: z.string()
    .regex(gstinRegex, 'Invalid GSTIN format (e.g., 27AABCU9603R1ZM)'),
  
  pan: z.string()
    .regex(panRegex, 'Invalid PAN format (e.g., AABCU9603R)'),
  
  address: z.string()
    .min(1, 'Address is required')
    .max(200, 'Address must be less than 200 characters'),
  
  city: z.string()
    .min(1, 'City is required')
    .max(50, 'City must be less than 50 characters'),
  
  state: z.string()
    .min(1, 'State is required')
    .max(50, 'State must be less than 50 characters'),
  
  pincode: z.string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  
  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number (must be 10 digits starting with 6-9)'),
  
  email: z.string()
    .regex(emailRegex, 'Invalid email address'),
  
  website: z.string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),
  
  bankName: z.string()
    .min(1, 'Bank name is required')
    .max(100, 'Bank name must be less than 100 characters'),
  
  accountNumber: z.string()
    .min(8, 'Account number must be at least 8 characters')
    .max(20, 'Account number must be less than 20 characters'),
  
  ifscCode: z.string()
    .regex(ifscRegex, 'Invalid IFSC code format (e.g., SBIN0001234)'),
  
  branch: z.string()
    .min(1, 'Branch is required')
    .max(100, 'Branch must be less than 100 characters'),
  
  isActive: z.boolean(),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

// ============================================================================
// MASTER DATA SCHEMA
// ============================================================================

export const masterDataSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .transform(val => val.trim()),
});

export type MasterDataFormData = z.infer<typeof masterDataSchema>;

// ============================================================================
// GST RATE SCHEMA
// ============================================================================

export const gstRateSchema = z.object({
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters'),
  
  hsnCode: z.string()
    .regex(hsnRegex, 'HSN code must be 4, 6, or 8 digits'),
  
  rate: z.number()
    .min(0, 'Rate must be at least 0%')
    .max(100, 'Rate cannot exceed 100%'),
});

export type GstRateFormData = z.infer<typeof gstRateSchema>;

// ============================================================================
// LOCATION SCHEMA
// ============================================================================

export const locationSchema = z.object({
  country: z.string()
    .min(1, 'Country is required')
    .max(50, 'Country must be less than 50 characters'),
  
  state: z.string()
    .min(1, 'State is required')
    .max(50, 'State must be less than 50 characters'),
  
  city: z.string()
    .min(1, 'City is required')
    .max(50, 'City must be less than 50 characters'),
});

export type LocationFormData = z.infer<typeof locationSchema>;

// ============================================================================
// COMMISSION SCHEMA
// ============================================================================

export const commissionSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  
  type: z.enum(['PERCENTAGE', 'PER_BALE'], {
    errorMap: () => ({ message: 'Type must be either PERCENTAGE or PER_BALE' }),
  }),
  
  value: z.number()
    .positive('Value must be positive'),
}).refine(
  (data) => {
    if (data.type === 'PERCENTAGE') {
      return data.value <= 100;
    }
    return true;
  },
  {
    message: 'Percentage value cannot exceed 100%',
    path: ['value'],
  }
);

export type CommissionFormData = z.infer<typeof commissionSchema>;

// ============================================================================
// STRUCTURED TERM SCHEMA
// ============================================================================

export const structuredTermSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  
  days: z.number()
    .int('Days must be a whole number')
    .nonnegative('Days cannot be negative'),
});

export type StructuredTermFormData = z.infer<typeof structuredTermSchema>;

// ============================================================================
// CCI TERM SCHEMA (Basic - can be expanded)
// ============================================================================

export const cciTermSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  
  effectiveFrom: z.string()
    .min(1, 'Effective from date is required'),
  
  effectiveTo: z.string()
    .optional(),
  
  version: z.number()
    .int('Version must be a whole number')
    .positive('Version must be positive'),
  
  isActive: z.boolean(),
  
  candy_factor: z.number()
    .positive('Candy factor must be positive'),
  
  gst_rate: z.number()
    .min(0, 'GST rate must be at least 0%')
    .max(100, 'GST rate cannot exceed 100%'),
  
  // Add other CCI term fields as needed
  emd_payment_days: z.number()
    .int('Days must be a whole number')
    .nonnegative('Days cannot be negative')
    .optional(),
  
  emd_interest_percent: z.number()
    .min(0, 'Interest must be at least 0%')
    .max(100, 'Interest cannot exceed 100%')
    .optional(),
});

export type CciTermFormData = z.infer<typeof cciTermSchema>;

// ============================================================================
// COMMODITY SCHEMA
// ============================================================================

export const commoditySchema = z.object({
  name: z.string()
    .min(1, 'Commodity name is required')
    .max(100, 'Name must be less than 100 characters')
    .transform(val => val.trim()),
  
  symbol: z.string()
    .min(2, 'Symbol must be at least 2 characters')
    .max(10, 'Symbol must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Symbol must contain only uppercase letters and numbers')
    .transform(val => val.toUpperCase().trim()),
  
  unit: z.enum(['Kgs', 'Qty', 'Candy', 'Bales', 'Quintal', 'Tonnes'], {
    errorMap: () => ({ message: 'Please select a valid unit' }),
  }),
  
  defaultGstRateId: z.number()
    .nullable()
    .optional(),
  
  isActive: z.boolean(),
  
  tradeTypeIds: z.array(z.number())
    .min(1, 'At least one trade type must be selected'),
  
  bargainTypeIds: z.array(z.number())
    .min(1, 'At least one bargain type must be selected'),
  
  varietyIds: z.array(z.number())
    .default([]),
  
  weightmentTermIds: z.array(z.number())
    .min(1, 'At least one weightment term must be selected'),
  
  passingTermIds: z.array(z.number())
    .min(1, 'At least one passing term must be selected'),
  
  deliveryTermIds: z.array(z.number())
    .min(1, 'At least one delivery term must be selected'),
  
  paymentTermIds: z.array(z.number())
    .min(1, 'At least one payment term must be selected'),
  
  commissionIds: z.array(z.number())
    .min(1, 'At least one commission structure must be selected'),
  
  supportsCciTerms: z.boolean(),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type CommodityFormData = z.infer<typeof commoditySchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate if a name is unique in a list
 */
export const createUniqueNameValidator = <T extends { name: string }>(
  items: T[],
  excludeId?: number | string
) => {
  return (name: string) => {
    const isDuplicate = items.some(
      item =>
        item.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        (excludeId === undefined || ('id' in item && item.id !== excludeId))
    );
    return !isDuplicate;
  };
};

/**
 * Add unique name validation to a schema
 */
export const withUniqueNameValidation = <T extends { name: string }>(
  schema: z.ZodObject<any>,
  items: T[],
  excludeId?: number | string
) => {
  return schema.refine(
    (data) => createUniqueNameValidator(items, excludeId)(data.name),
    {
      message: 'An item with this name already exists',
      path: ['name'],
    }
  );
};
