/**
 * Security Configuration
 * Configurable password policies and session management
 */

import { PasswordPolicy, SessionConfig } from '../types/auth';

/**
 * Default Password Policy - Can be overridden via Settings
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventReuse: 5, // Prevent reusing last 5 passwords
  expiryDays: 90, // Password expires after 90 days
  maxAttempts: 5, // Lock account after 5 failed attempts
  lockoutDurationMinutes: 30, // Account locked for 30 minutes
};

/**
 * Default Session Configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timeoutMinutes: 30, // 30 minutes of inactivity
  warningMinutes: 5, // Show warning 5 minutes before timeout
  maxDurationHours: 12, // Absolute max session duration
  allowConcurrentSessions: false, // One session per user
  refreshTokenExpiryDays: 7, // Refresh token valid for 7 days
};

/**
 * Email Configuration for Gmail SMTP
 */
export interface EmailConfig {
  provider: 'gmail';
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
  auth: {
    user: string; // Gmail address
    pass: string; // App-specific password
  };
  from: {
    name: string;
    email: string;
  };
}

export const DEFAULT_EMAIL_CONFIG: Partial<EmailConfig> = {
  provider: 'gmail',
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
  },
  from: {
    name: 'RNRL TradeHub',
    email: '', // To be configured
  },
};

/**
 * Email Templates
 */
export const EMAIL_TEMPLATES = {
  WELCOME_USER: {
    subject: 'Welcome to RNRL TradeHub - Your Account is Ready',
    template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .credentials { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #1e40af; }
    .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to RNRL TradeHub</h1>
    </div>
    <div class="content">
      <h2>Hello {{userName}},</h2>
      <p>Your account has been created and approved. You can now access the RNRL TradeHub system.</p>
      
      <div class="credentials">
        <h3>Your Login Credentials:</h3>
        <p><strong>Email:</strong> {{userEmail}}</p>
        <p><strong>Temporary Password:</strong> {{temporaryPassword}}</p>
        <p><strong>Business Partner:</strong> {{businessPartnerName}}</p>
      </div>
      
      <p><strong>Important:</strong> You will be required to change your password on first login for security purposes.</p>
      
      <a href="{{loginUrl}}" class="button">Login to TradeHub</a>
      
      <p>If you have any questions, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 RNRL TradeHub. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
  
  PASSWORD_RESET: {
    subject: 'RNRL TradeHub - Password Reset Request',
    template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hello {{userName}},</h2>
      <p>We received a request to reset your password for your RNRL TradeHub account.</p>
      
      <a href="{{resetUrl}}" class="button">Reset Password</a>
      
      <p>This link will expire in 1 hour for security purposes.</p>
      
      <div class="warning">
        <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email or contact support immediately.
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2024 RNRL TradeHub. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
  
  SUB_USER_INVITE: {
    subject: 'Invitation to Join RNRL TradeHub',
    template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .info { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #1e40af; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited!</h1>
    </div>
    <div class="content">
      <h2>Hello {{inviteeName}},</h2>
      <p><strong>{{inviterName}}</strong> has invited you to join their team on RNRL TradeHub.</p>
      
      <div class="info">
        <p><strong>Organization:</strong> {{businessPartnerName}}</p>
        <p><strong>Your Role:</strong> Sub-User</p>
        <p><strong>Access Level:</strong> {{accessDescription}}</p>
      </div>
      
      <a href="{{acceptUrl}}" class="button">Accept Invitation</a>
      
      <p>This invitation will expire in 7 days.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 RNRL TradeHub. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
  
  APPROVAL_PENDING: {
    subject: 'RNRL TradeHub - User Approval Pending',
    template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New User Approval Required</h1>
    </div>
    <div class="content">
      <h2>Hello Admin,</h2>
      <p>A new user account is pending your approval:</p>
      
      <ul>
        <li><strong>Name:</strong> {{userName}}</li>
        <li><strong>Email:</strong> {{userEmail}}</li>
        <li><strong>Business Partner:</strong> {{businessPartnerName}}</li>
        <li><strong>Requested Role:</strong> {{roleName}}</li>
      </ul>
      
      <a href="{{approvalUrl}}" class="button">Review & Approve</a>
    </div>
    <div class="footer">
      <p>&copy; 2024 RNRL TradeHub. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
};

/**
 * Validate password against policy
 */
export function validatePassword(password: string, policy: PasswordPolicy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  
  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }
  
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (policy.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${policy.specialChars})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a random password that meets policy requirements
 */
export function generatePassword(policy: PasswordPolicy): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = policy.specialChars;
  
  let password = '';
  let allChars = lowercase;
  
  // Add at least one character from each required category
  if (policy.requireUppercase) {
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    allChars += uppercase;
  }
  if (policy.requireLowercase) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
  }
  if (policy.requireNumbers) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
    allChars += numbers;
  }
  if (policy.requireSpecialChars) {
    password += special[Math.floor(Math.random() * special.length)];
    allChars += special;
  }
  
  // Fill the rest with random characters
  const remainingLength = policy.minLength - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
