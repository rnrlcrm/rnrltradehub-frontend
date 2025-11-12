/**
 * Email Service Implementation
 * Sends emails via Gmail SMTP
 */

import { apiClient } from '../api/realApiClient';

export enum EmailType {
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  KYC_REMINDER = 'KYC_REMINDER',
  APPROVAL_NOTIFICATION = 'APPROVAL_NOTIFICATION',
  SUB_USER_INVITATION = 'SUB_USER_INVITATION',
}

export interface EmailPayload {
  type: EmailType;
  to: string;
  data: Record<string, any>;
}

/**
 * Send email via backend API
 * Backend handles Gmail SMTP configuration
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    await apiClient.post('/api/email/send', payload);
    console.log(`[EMAIL] Sent ${payload.type} to ${payload.to}`);
  } catch (error) {
    console.error('[EMAIL] Failed to send:', error);
    throw error;
  }
}

/**
 * Email Templates
 */
export const EMAIL_TEMPLATES = {
  WELCOME: (data: any) => ({
    subject: `Welcome to Trade Hub - Your Account is Ready`,
    html: `
      <h2>Welcome ${data.userName}!</h2>
      <p>Your account has been created for ${data.companyName}.</p>
      <p><strong>Login Details:</strong></p>
      <ul>
        <li>Email: ${data.email}</li>
        <li>Temporary Password: ${data.password}</li>
      </ul>
      <p>Please login and change your password immediately:</p>
      <a href="${data.loginUrl}">Login Now</a>
      <p><em>For security reasons, you will be required to change your password on first login.</em></p>
    `,
  }),

  PASSWORD_RESET: (data: any) => ({
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${data.resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `,
  }),

  KYC_REMINDER: (data: any) => ({
    subject: `KYC Verification Due in ${data.daysRemaining} Days`,
    html: `
      <h2>KYC Verification Reminder</h2>
      <p>Dear ${data.companyName},</p>
      <p>Your KYC verification is due on ${data.dueDate}.</p>
      <p>Days Remaining: <strong>${data.daysRemaining}</strong></p>
      <p>Please update your documents:</p>
      <a href="${data.dashboardUrl}">Update KYC</a>
    `,
  }),

  APPROVAL_NOTIFICATION: (data: any) => ({
    subject: `${data.requestType} ${data.status}`,
    html: `
      <h2>Request ${data.status}</h2>
      <p>Your ${data.requestType} request has been ${data.status.toLowerCase()}.</p>
      ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
      <a href="${data.dashboardUrl}">View Details</a>
    `,
  }),

  SUB_USER_INVITATION: (data: any) => ({
    subject: 'Invitation to Join Trade Hub',
    html: `
      <h2>You've Been Invited</h2>
      <p>${data.invitedBy} has invited you to join ${data.companyName} on Trade Hub.</p>
      <p><strong>Your Login:</strong></p>
      <ul>
        <li>Email: ${data.email}</li>
        <li>Temporary Password: ${data.password}</li>
      </ul>
      <a href="${data.loginUrl}">Accept Invitation</a>
    `,
  }),
};
