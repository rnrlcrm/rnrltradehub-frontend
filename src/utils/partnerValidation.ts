/**
 * Partner Registration Validation Utilities
 * 
 * Features:
 * - Email validation & duplicate check
 * - Phone validation & duplicate check
 * - PAN validation & format check
 * - GST validation & format check
 * - IFSC validation
 * - Aadhar validation
 * - Pincode validation
 * - All field validations with proper error messages
 */

import { businessPartnerApi } from '../api/businessPartnerApi';

// ==================== EMAIL VALIDATION ====================

/**
 * Validate email format
 */
export const validateEmailFormat = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Additional checks
  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) {
    return { valid: false, error: 'Email local part is too long' };
  }

  return { valid: true };
};

/**
 * Check if email already exists in system
 */
export const checkEmailDuplicate = async (email: string, excludePartnerId?: string): Promise<{ duplicate: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/partners/check-email?email=${encodeURIComponent(email)}${excludePartnerId ? `&exclude=${excludePartnerId}` : ''}`);
    const data = await response.json();
    
    if (data.exists) {
      return { duplicate: true, error: 'This email is already registered in the system' };
    }
    
    return { duplicate: false };
  } catch (err) {
    console.error('Email duplicate check failed:', err);
    return { duplicate: false, error: 'Unable to verify email uniqueness. Please try again.' };
  }
};

/**
 * Complete email validation (format + duplicate check)
 */
export const validateEmail = async (email: string, excludePartnerId?: string): Promise<{ valid: boolean; error?: string }> => {
  // Format validation
  const formatCheck = validateEmailFormat(email);
  if (!formatCheck.valid) {
    return formatCheck;
  }

  // Duplicate check
  const duplicateCheck = await checkEmailDuplicate(email, excludePartnerId);
  if (duplicateCheck.duplicate) {
    return { valid: false, error: duplicateCheck.error };
  }
  
  if (duplicateCheck.error) {
    return { valid: false, error: duplicateCheck.error };
  }

  return { valid: true };
};

// ==================== PHONE VALIDATION ====================

/**
 * Validate phone number format (Indian)
 */
export const validatePhoneFormat = (phone: string): { valid: boolean; error?: string } => {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and brackets
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Check for +91 prefix
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid Indian mobile number. Must start with 6-9 and be 10 digits.' };
  }

  return { valid: true };
};

/**
 * Check if phone number already exists in system
 */
export const checkPhoneDuplicate = async (phone: string, excludePartnerId?: string): Promise<{ duplicate: boolean; error?: string }> => {
  try {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91/, '');
    const response = await fetch(`/api/partners/check-phone?phone=${encodeURIComponent(cleaned)}${excludePartnerId ? `&exclude=${excludePartnerId}` : ''}`);
    const data = await response.json();
    
    if (data.exists) {
      return { duplicate: true, error: 'This phone number is already registered in the system' };
    }
    
    return { duplicate: false };
  } catch (err) {
    console.error('Phone duplicate check failed:', err);
    return { duplicate: false, error: 'Unable to verify phone uniqueness. Please try again.' };
  }
};

/**
 * Complete phone validation (format + duplicate check)
 */
export const validatePhone = async (phone: string, excludePartnerId?: string): Promise<{ valid: boolean; error?: string }> => {
  // Format validation
  const formatCheck = validatePhoneFormat(phone);
  if (!formatCheck.valid) {
    return formatCheck;
  }

  // Duplicate check
  const duplicateCheck = await checkPhoneDuplicate(phone, excludePartnerId);
  if (duplicateCheck.duplicate) {
    return { valid: false, error: duplicateCheck.error };
  }
  
  if (duplicateCheck.error) {
    return { valid: false, error: duplicateCheck.error };
  }

  return { valid: true };
};

/**
 * Normalize phone number (remove formatting, add +91)
 */
export const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91/, '');
  return `+91${cleaned}`;
};

// ==================== PAN VALIDATION ====================

/**
 * Validate PAN number format
 */
export const validatePAN = (pan: string): { valid: boolean; error?: string } => {
  if (!pan) {
    return { valid: false, error: 'PAN is required' };
  }

  const panUpper = pan.toUpperCase();
  
  // PAN format: AAAAA9999A
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(panUpper)) {
    return { valid: false, error: 'Invalid PAN format. Must be: 5 letters, 4 digits, 1 letter (e.g., AAAAA1234A)' };
  }

  // Check 4th character (type of holder)
  const fourthChar = panUpper[3];
  const validFourthChars = ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
  if (!validFourthChars.includes(fourthChar)) {
    return { valid: false, error: 'Invalid PAN. 4th character must be P, C, H, F, A, T, B, L, J, or G' };
  }

  return { valid: true };
};

// ==================== GST VALIDATION ====================

/**
 * Validate GST number format
 */
export const validateGST = (gst: string, pan?: string): { valid: boolean; error?: string } => {
  if (!gst) {
    return { valid: false, error: 'GST number is required' };
  }

  const gstUpper = gst.toUpperCase();
  
  // GST format: 99AAAAA9999A9Z9
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(gstUpper)) {
    return { valid: false, error: 'Invalid GST format. Must be 15 characters (e.g., 27AAAAA1234A1Z5)' };
  }

  // If PAN provided, check if GST contains PAN
  if (pan) {
    const panInGST = gstUpper.substring(2, 12);
    if (panInGST !== pan.toUpperCase()) {
      return { valid: false, error: 'GST number must contain your PAN (characters 3-12)' };
    }
  }

  // Validate state code (first 2 digits)
  const stateCode = parseInt(gstUpper.substring(0, 2));
  if (stateCode < 1 || stateCode > 37) {
    return { valid: false, error: 'Invalid GST state code (first 2 digits must be 01-37)' };
  }

  return { valid: true };
};

// ==================== IFSC VALIDATION ====================

/**
 * Validate IFSC code format
 */
export const validateIFSC = (ifsc: string): { valid: boolean; error?: string } => {
  if (!ifsc) {
    return { valid: false, error: 'IFSC code is required' };
  }

  const ifscUpper = ifsc.toUpperCase();
  
  // IFSC format: ABCD0123456 (4 letters, 0, 6 alphanumeric)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifscUpper)) {
    return { valid: false, error: 'Invalid IFSC format. Must be: 4 letters, 0, then 6 characters (e.g., SBIN0001234)' };
  }

  return { valid: true };
};

// ==================== AADHAR VALIDATION ====================

/**
 * Validate Aadhar number format
 */
export const validateAadhar = (aadhar: string): { valid: boolean; error?: string } => {
  if (!aadhar) {
    return { valid: false, error: 'Aadhar number is required' };
  }

  // Remove spaces
  const cleaned = aadhar.replace(/\s/g, '');
  
  // Must be 12 digits
  const aadharRegex = /^[0-9]{12}$/;
  if (!aadharRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid Aadhar format. Must be 12 digits' };
  }

  // First digit should not be 0 or 1
  if (cleaned[0] === '0' || cleaned[0] === '1') {
    return { valid: false, error: 'Invalid Aadhar. First digit cannot be 0 or 1' };
  }

  return { valid: true };
};

// ==================== PINCODE VALIDATION ====================

/**
 * Validate Indian pincode
 */
export const validatePincode = (pincode: string): { valid: boolean; error?: string } => {
  if (!pincode) {
    return { valid: false, error: 'Pincode is required' };
  }

  const pincodeRegex = /^[1-9][0-9]{5}$/;
  if (!pincodeRegex.test(pincode)) {
    return { valid: false, error: 'Invalid pincode. Must be 6 digits and cannot start with 0' };
  }

  return { valid: true };
};

// ==================== CIN VALIDATION ====================

/**
 * Validate CIN (Corporate Identification Number)
 */
export const validateCIN = (cin: string): { valid: boolean; error?: string } => {
  if (!cin) {
    return { valid: true }; // CIN is optional
  }

  const cinUpper = cin.toUpperCase();
  
  // CIN format: U/L + 5 digits + State code (2 letters) + Year (4 digits) + Type (3 letters) + 6 digits
  const cinRegex = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
  if (!cinRegex.test(cinUpper)) {
    return { valid: false, error: 'Invalid CIN format (e.g., U12345MH2020PTC123456)' };
  }

  return { valid: true };
};

// ==================== GENERAL TEXT VALIDATION ====================

/**
 * Validate name (person or company)
 */
export const validateName = (name: string, fieldName: string = 'Name'): { valid: boolean; error?: string } => {
  if (!name) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }

  if (name.length > 200) {
    return { valid: false, error: `${fieldName} is too long (max 200 characters)` };
  }

  // Check for invalid characters
  const invalidChars = /[<>{}[\]\\\/]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { valid: true };
};

/**
 * Validate address field
 */
export const validateAddress = (address: string, fieldName: string = 'Address'): { valid: boolean; error?: string } => {
  if (!address) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (address.trim().length < 5) {
    return { valid: false, error: `${fieldName} must be at least 5 characters` };
  }

  if (address.length > 500) {
    return { valid: false, error: `${fieldName} is too long (max 500 characters)` };
  }

  return { valid: true };
};

// ==================== COMBINED VALIDATORS ====================

/**
 * Validate complete partner registration data
 */
export const validatePartnerRegistration = async (data: any, step?: number): Promise<{ valid: boolean; errors: Record<string, string> }> => {
  const errors: Record<string, string> = {};

  // Step 1: Company Info
  if (!step || step === 1) {
    const nameValidation = validateName(data.legalName, 'Legal name');
    if (!nameValidation.valid) errors.legalName = nameValidation.error!;

    if (!data.businessType) {
      errors.businessType = 'Business type is required';
    }
  }

  // Step 2: Contact & Verification
  if (!step || step === 2) {
    const personValidation = validateName(data.primaryContactPerson, 'Contact person');
    if (!personValidation.valid) errors.primaryContactPerson = personValidation.error!;

    const emailValidation = await validateEmail(data.primaryContactEmail);
    if (!emailValidation.valid) errors.primaryContactEmail = emailValidation.error!;

    const phoneValidation = await validatePhone(data.primaryContactPhone);
    if (!phoneValidation.valid) errors.primaryContactPhone = phoneValidation.error!;
  }

  // Step 3: Compliance
  if (!step || step === 3) {
    const panValidation = validatePAN(data.pan);
    if (!panValidation.valid) errors.pan = panValidation.error!;

    if (data.hasGST || ['BUYER', 'SELLER', 'TRADER'].includes(data.businessType)) {
      if (!data.gstNumber) {
        errors.gstNumber = 'GST is mandatory for this business type';
      } else {
        const gstValidation = validateGST(data.gstNumber, data.pan);
        if (!gstValidation.valid) errors.gstNumber = gstValidation.error!;
      }
    }

    if (data.registrationType === 'INDIVIDUAL' && data.aadharNumber) {
      const aadharValidation = validateAadhar(data.aadharNumber);
      if (!aadharValidation.valid) errors.aadharNumber = aadharValidation.error!;
    }

    if (data.cin) {
      const cinValidation = validateCIN(data.cin);
      if (!cinValidation.valid) errors.cin = cinValidation.error!;
    }
  }

  // Step 4: Address
  if (!step || step === 4) {
    const addressValidation = validateAddress(data.registeredAddress?.addressLine1, 'Address line 1');
    if (!addressValidation.valid) errors['registeredAddress.addressLine1'] = addressValidation.error!;

    if (!data.registeredAddress?.city) {
      errors['registeredAddress.city'] = 'City is required';
    }

    if (!data.registeredAddress?.state) {
      errors['registeredAddress.state'] = 'State is required';
    }

    const pincodeValidation = validatePincode(data.registeredAddress?.pincode);
    if (!pincodeValidation.valid) errors['registeredAddress.pincode'] = pincodeValidation.error!;
  }

  // Step 5: Banking
  if (!step || step === 5) {
    if (!data.bankDetails?.bankName) {
      errors['bankDetails.bankName'] = 'Bank name is required';
    }

    if (!data.bankDetails?.accountNumber) {
      errors['bankDetails.accountNumber'] = 'Account number is required';
    } else if (data.bankDetails.accountNumber.length < 9 || data.bankDetails.accountNumber.length > 18) {
      errors['bankDetails.accountNumber'] = 'Account number must be 9-18 digits';
    }

    const ifscValidation = validateIFSC(data.bankDetails?.ifscCode);
    if (!ifscValidation.valid) errors['bankDetails.ifscCode'] = ifscValidation.error!;

    if (!data.bankDetails?.accountHolderName) {
      errors['bankDetails.accountHolderName'] = 'Account holder name is required';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Format error messages for display
 */
export const formatValidationErrors = (errors: Record<string, string>): string => {
  const messages = Object.values(errors);
  if (messages.length === 0) return '';
  if (messages.length === 1) return messages[0];
  return `Multiple errors: ${messages.join(', ')}`;
};

