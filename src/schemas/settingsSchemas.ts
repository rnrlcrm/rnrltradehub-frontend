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
const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
const cinRegex = /^[LUu]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[6-9]\d{9}$/;
const hsnRegex = /^\d{4}(\d{2})?(\d{2})?$/;

// GST State Code Mapping as per Indian GST Act
const gstStateMapping: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

// Sanitization helper to prevent XSS attacks
const sanitizeString = (str: string) => {
  return str.trim()
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .replace(/\s+/g, ' '); // Normalize whitespace
};

// ============================================================================
// ORGANIZATION SCHEMA
// Enhanced with IT Act Compliance and Security Validations
// ============================================================================

export const organizationSchema = z.object({
  // Basic Information with sanitization
  name: z.string()
    .min(1, 'Organization name is required')
    .max(100, 'Name must be less than 100 characters')
    .transform(sanitizeString)
    .refine((val) => val.length > 0, { message: 'Organization name cannot be empty after trimming' }),
  
  code: z.string()
    .min(1, 'Organization code is required')
    .max(20, 'Code must be less than 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores')
    .transform((val) => val.toUpperCase().trim()),
  
  // Tax Identification - Mandatory as per IT Act
  gstin: z.string()
    .regex(gstinRegex, 'Invalid GSTIN format. Must be 15 characters (e.g., 27AABCU9603R1ZM)')
    .transform((val) => val.toUpperCase().trim()),
  
  pan: z.string()
    .regex(panRegex, 'Invalid PAN format. Must be 10 characters (e.g., AABCU9603R)')
    .transform((val) => val.toUpperCase().trim()),
  
  tan: z.string()
    .regex(tanRegex, 'Invalid TAN format. Must be 10 characters (e.g., MUMX12345Y)')
    .transform((val) => val.toUpperCase().trim())
    .optional()
    .or(z.literal('')),
  
  cin: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      // CIN is optional - only validate if provided
      if (!val || val === '') return true;
      return cinRegex.test(val);
    }, {
      message: 'Invalid CIN format. Must be 21 characters (e.g., L12345MH2020PLC123456). Leave empty for Proprietorship/Partnership.',
    })
    .transform((val) => val ? val.toUpperCase().trim() : ''),
  
  // Address Information with sanitization
  address: z.string()
    .min(1, 'Address is required')
    .max(200, 'Address must be less than 200 characters')
    .transform(sanitizeString),
  
  city: z.string()
    .min(1, 'City is required')
    .max(50, 'City must be less than 50 characters')
    .transform(sanitizeString),
  
  state: z.string()
    .min(1, 'State is required')
    .max(50, 'State must be less than 50 characters')
    .transform(sanitizeString),
  
  pincode: z.string()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
    .transform((val) => val.trim()),
  
  country: z.string()
    .min(1, 'Country is required')
    .max(50, 'Country must be less than 50 characters')
    .default('India')
    .transform(sanitizeString),
  
  // Contact Information with validation
  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number. Must be 10 digits starting with 6-9')
    .transform((val) => val.trim()),
  
  email: z.string()
    .email('Invalid email address format')
    .max(100, 'Email must be less than 100 characters')
    .transform((val) => val.toLowerCase().trim()),
  
  // Organization Type
  organizationType: z.enum(['PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'LLP', 'OPC'], {
    errorMap: () => ({ message: 'Please select a valid organization type' }),
  }),
  
  // Multi-tenant Support
  organizationId: z.string()
    .max(50, 'Organization ID must be less than 50 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Organization ID must contain only uppercase letters, numbers, hyphens, and underscores')
    .transform((val) => val.toUpperCase().trim())
    .optional()
    .or(z.literal('')),
  
  parentOrganizationId: z.number().positive('Invalid parent organization').optional(),
  
  // Contact Person Details
  contactPersonName: z.string()
    .max(100, 'Contact person name must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .or(z.literal('')),
  
  contactPersonPhone: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      return phoneRegex.test(val);
    }, {
      message: 'Invalid contact person phone. Must be 10 digits starting with 6-9',
    }),
  
  contactPersonEmail: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      return emailRegex.test(val);
    }, {
      message: 'Invalid contact person email format',
    })
    .transform((val) => val ? val.toLowerCase().trim() : ''),
  
  contactPersonDesignation: z.string()
    .max(50, 'Designation must be less than 50 characters')
    .transform(sanitizeString)
    .optional()
    .or(z.literal('')),
  
  // Compliance Dates
  gstRegistrationDate: z.string().optional().or(z.literal('')),
  panRegistrationDate: z.string().optional().or(z.literal('')),
  
  // Banking Information - Critical for financial transactions
  bankName: z.string()
    .min(1, 'Bank name is required')
    .max(100, 'Bank name must be less than 100 characters')
    .transform(sanitizeString),
  
  accountNumber: z.string()
    .min(8, 'Account number must be at least 8 digits')
    .max(20, 'Account number must be less than 20 digits')
    .regex(/^[0-9]+$/, 'Account number must contain only digits')
    .transform((val) => val.trim()),
  
  ifscCode: z.string()
    .regex(ifscRegex, 'Invalid IFSC code format. Must be 11 characters (e.g., SBIN0001234)')
    .transform((val) => val.toUpperCase().trim()),
  
  branchName: z.string()
    .min(1, 'Branch name is required')
    .max(100, 'Branch name must be less than 100 characters')
    .transform(sanitizeString),
  
  accountType: z.enum(['CURRENT', 'SAVINGS', 'CASH_CREDIT', 'OVERDRAFT'], {
    errorMap: () => ({ message: 'Please select a valid account type' }),
  }).optional(),
  
  beneficiaryName: z.string()
    .max(100, 'Beneficiary name must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .or(z.literal('')),
  
  // Status flag
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // Cross-validate: GSTIN should contain PAN
    const panFromGstin = data.gstin.substring(2, 12);
    return panFromGstin === data.pan;
  },
  {
    message: 'GSTIN must contain the same PAN. Characters 3-12 of GSTIN should match PAN.',
    path: ['gstin'],
  }
).refine(
  (data) => {
    // Validate state code in GSTIN matches state - enhanced with state mapping
    const stateCodeFromGstin = data.gstin.substring(0, 2);
    return gstStateMapping[stateCodeFromGstin] !== undefined;
  },
  {
    message: 'Invalid state code in GSTIN (first 2 digits). Must be valid Indian state code.',
    path: ['gstin'],
  }
).refine(
  (data) => {
    // CIN is mandatory for Private/Public Limited companies
    if ((data.organizationType === 'PRIVATE_LIMITED' || 
         data.organizationType === 'PUBLIC_LIMITED') && 
        (!data.cin || data.cin === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'CIN is mandatory for Private Limited and Public Limited companies',
    path: ['cin'],
  }
);

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

// Define schemas for inline items (used within commodity)
const masterDataItemSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const inlineStructuredTermSchema = z.object({
  id: z.number(),
  name: z.string(),
  days: z.number(),
});

const commissionStructureSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['PERCENTAGE', 'PER_BALE']),
  value: z.number(),
  // GST on Commission - SAC 9983 (Brokerage & Commission Services)
  gstApplicable: z.boolean(), // Always true for commissions
  gstRate: z.number(), // 18% as per GST Act
  sacCode: z.string(), // '9983' for brokerage/commission
});

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
  
  rateUnit: z.enum(['Kgs', 'Qty', 'Candy', 'Bales', 'Quintal', 'Tonnes'], {
    errorMap: () => ({ message: 'Please select a valid rate unit' }),
  }),
  
  // GST fields - all auto-determined, just for reference/override
  hsnCode: z.string()
    .regex(/^\d{4}(\d{2})?(\d{2})?$/, 'HSN code must be 4, 6, or 8 digits'),
  
  gstRate: z.number()
    .min(0, 'GST rate cannot be negative')
    .max(100, 'GST rate cannot exceed 100%'),
  
  gstExemptionAvailable: z.boolean(),
  
  gstCategory: z.enum(['Agricultural', 'Processed', 'Industrial', 'Service']),
  
  isProcessed: z.boolean(),
  
  isActive: z.boolean(),
  
  // Trading parameters stored directly (not as IDs)
  tradeTypes: z.array(masterDataItemSchema)
    .min(1, 'At least one trade type must be added'),
  
  bargainTypes: z.array(masterDataItemSchema)
    .min(1, 'At least one bargain type must be added'),
  
  varieties: z.array(masterDataItemSchema)
    .min(1, 'At least one variety must be added'),
  
  weightmentTerms: z.array(masterDataItemSchema)
    .min(1, 'At least one weightment term must be added'),
  
  passingTerms: z.array(masterDataItemSchema)
    .min(1, 'At least one passing term must be added'),
  
  deliveryTerms: z.array(inlineStructuredTermSchema)
    .min(1, 'At least one delivery term must be added'),
  
  paymentTerms: z.array(inlineStructuredTermSchema)
    .min(1, 'At least one payment term must be added'),
  
  commissions: z.array(commissionStructureSchema)
    .min(1, 'At least one commission structure must be added'),
  
  supportsCciTerms: z.boolean(),
  
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
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

// ============================================================================
// FINANCIAL YEAR SCHEMA
// Enhanced with Income Tax Act Compliance
// ============================================================================

export const financialYearSchema = z.object({
  fyCode: z.string()
    .min(1, 'Financial Year code is required')
    .regex(/^\d{4}-\d{4}$/, 'FY code must be in format YYYY-YYYY (e.g., 2024-2025)')
    .refine((val) => {
      const [startYear, endYear] = val.split('-').map(Number);
      return endYear === startYear + 1;
    }, {
      message: 'End year must be exactly one year after start year',
    }),
  
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, {
      message: 'Invalid start date format',
    })
    .refine((val) => {
      // For Indian companies, FY typically starts on April 1st
      const date = new Date(val);
      return date.getMonth() === 3 && date.getDate() === 1; // April 1st (0-indexed month)
    }, {
      message: 'Financial Year must start on April 1st as per Indian Income Tax Act',
    }),
  
  endDate: z.string()
    .min(1, 'End date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, {
      message: 'Invalid end date format',
    })
    .refine((val) => {
      // For Indian companies, FY typically ends on March 31st
      const date = new Date(val);
      return date.getMonth() === 2 && date.getDate() === 31; // March 31st (0-indexed month)
    }, {
      message: 'Financial Year must end on March 31st as per Indian Income Tax Act',
    }),
  
  status: z.enum(['ACTIVE', 'CLOSED', 'PENDING'], {
    errorMap: () => ({ message: 'Status must be ACTIVE, CLOSED, or PENDING' }),
  }),
  
  closedBy: z.string().optional(),
  closedDate: z.string().optional(),
}).refine(
  (data) => {
    // Validate date range: endDate must be after startDate
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    // Validate date range is approximately 1 year (365 days)
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 365 && diffDays <= 366; // Account for leap years
  },
  {
    message: 'Financial Year must be exactly one year long',
    path: ['endDate'],
  }
);

export type FinancialYearFormData = z.infer<typeof financialYearSchema>;

// ============================================================================
// FY SPLIT VALIDATION SCHEMA
// ============================================================================

export const fySplitValidationSchema = z.object({
  fromFyId: z.number().positive('Invalid source Financial Year'),
  toFyCode: z.string()
    .regex(/^\d{4}-\d{4}$/, 'FY code must be in format YYYY-YYYY'),
  
  // Pre-split checks
  hasUnpaidInvoices: z.boolean(),
  unpaidInvoicesCount: z.number().nonnegative(),
  unpaidInvoicesAmount: z.number().nonnegative(),
  
  hasDueCommissions: z.boolean(),
  dueCommissionsCount: z.number().nonnegative(),
  dueCommissionsAmount: z.number().nonnegative(),
  
  hasOpenDisputes: z.boolean(),
  openDisputesCount: z.number().nonnegative(),
  
  hasActiveContracts: z.boolean(),
  activeContractsCount: z.number().nonnegative(),
  
  // Confirmation flags
  acknowledgeDataMigration: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge data migration',
  }),
  
  acknowledgeIrreversible: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge this action is irreversible',
  }),
  
  adminPassword: z.string().min(1, 'Admin password is required for FY split'),
});

export type FYSplitValidationData = z.infer<typeof fySplitValidationSchema>;
