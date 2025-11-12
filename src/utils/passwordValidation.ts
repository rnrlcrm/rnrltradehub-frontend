/**
 * Password Validation Utilities
 * Enforces strong password requirements for security
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

// Default password requirements
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321',
];

/**
 * Validates password against security requirements
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS,
  userEmail?: string
): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  // Check for uppercase letter
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (requirements.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (requirements.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  // Check if password contains email (if provided)
  if (userEmail) {
    const emailUsername = userEmail.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailUsername)) {
      errors.push('Password cannot contain your email address');
    }
  }

  // Calculate password strength
  const strength = calculatePasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Calculates password strength score
 */
function calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'very-strong' {
  let score = 0;

  // Length bonus
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety bonus
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  // Penalize common patterns
  if (/^(.)\1+$/.test(password)) score -= 2; // All same character
  if (/^(012|123|234|345|456|567|678|789|890)+$/.test(password)) score -= 1; // Sequential numbers
  if (/^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i.test(password)) score -= 1; // Sequential letters

  // Map score to strength
  if (score <= 3) return 'weak';
  if (score <= 5) return 'medium';
  if (score <= 7) return 'strong';
  return 'very-strong';
}

/**
 * Generates a random secure password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each required type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Checks if password has been used before (against history)
 */
export function isPasswordReused(
  newPassword: string,
  passwordHistory: string[]
): boolean {
  // In production, this would compare hashed passwords
  // For now, we'll assume the history contains hashed passwords
  // and this is just a placeholder
  return passwordHistory.some(oldPassword => oldPassword === newPassword);
}

/**
 * Gets password strength color for UI
 */
export function getPasswordStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'weak':
      return 'text-red-600';
    case 'medium':
      return 'text-orange-600';
    case 'strong':
      return 'text-blue-600';
    case 'very-strong':
      return 'text-green-600';
  }
}

/**
 * Gets password strength text for UI
 */
export function getPasswordStrengthText(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
    case 'very-strong':
      return 'Very Strong';
  }
}

/**
 * Gets password strength width percentage for progress bar
 */
export function getPasswordStrengthWidth(strength: PasswordValidationResult['strength']): number {
  switch (strength) {
    case 'weak':
      return 25;
    case 'medium':
      return 50;
    case 'strong':
      return 75;
    case 'very-strong':
      return 100;
  }
}
