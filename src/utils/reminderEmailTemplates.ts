/**
 * Reminder Email Templates - SIMPLIFIED
 * 
 * IMPORTANT: Only ONE reminder email sent
 * 
 * WHEN TO SEND:
 * - Registration completed
 * - User clicked "Submit"
 * - But documents not uploaded OR KYC pending
 * 
 * WHEN NOT TO SEND:
 * - During registration (user still filling form)
 * - Draft saved (user not submitted)
 * - Already approved partners
 */

export interface ReminderEmailData {
  partnerCode: string;
  partnerName: string;
  userEmail: string;
  userName: string;
  registrationDate: string;
  pendingItems: string[]; // e.g., ['PAN Card', 'GST Certificate']
  resumeLink: string;
}

/**
 * SINGLE Reminder Email - Sent ONLY if:
 * 1. User submitted registration (clicked final submit)
 * 2. Documents missing OR KYC not verified
 * 3. Status is PENDING_VERIFICATION or PENDING_APPROVAL
 * 
 * Sent ONCE after submission, not repeatedly
 */
export const generatePendingDocumentsReminderEmail = (data: ReminderEmailData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Registration Pending - Action Required</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 20px;">
  
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">⚠️ Registration Pending - Action Required</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Complete your registration to get started</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      
      <p style="margin: 0 0 15px 0; font-size: 14px;">Dear <strong>${data.userName}</strong>,</p>
      
      <p style="margin: 0 0 20px 0; font-size: 14px;">
        Thank you for submitting your business partner registration on <strong>${new Date(data.registrationDate).toLocaleDateString('en-IN')}</strong>.
      </p>

      <!-- Status Box -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">Your Registration Status: PENDING DOCUMENTS</p>
        <p style="margin: 0; font-size: 13px; color: #78350f;">
          Your registration is <strong>almost complete</strong>! We just need a few more documents from you to proceed with approval.
        </p>
      </div>

      <!-- Pending Items -->
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0f172a;">📋 Pending Documents</h2>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">Please upload the following:</p>
        <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #0f172a;">
          ${data.pendingItems.map(item => `<li style="margin-bottom: 5px;"><strong>${item}</strong></li>`).join('')}
        </ul>
      </div>

      <!-- Partner Code -->
      <div style="background-color: #e0e7ff; border-left: 4px solid #6366f1; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #4338ca;">Your Partner Code:</p>
        <p style="margin: 0; font-size: 20px; font-weight: 600; font-family: monospace; color: #3730a3;">${data.partnerCode}</p>
      </div>

      <!-- Important Note -->
      <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #166534;">✅ What's Complete:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #166534;">
          <li>Email verified ✓</li>
          <li>Mobile verified ✓</li>
          <li>Company details submitted ✓</li>
          <li>Banking details submitted ✓</li>
        </ul>
      </div>

      <!-- What Happens Next -->
      <div style="margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0f172a;">What Happens After Upload?</h2>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 10px;"><strong>Immediate:</strong> Document verification starts</li>
          <li style="margin-bottom: 10px;"><strong>Within 1-2 days:</strong> KYC verification completed</li>
          <li style="margin-bottom: 10px;"><strong>Upon approval:</strong> Welcome email with login credentials</li>
          <li style="margin-bottom: 10px;"><strong>You're ready:</strong> Start trading immediately</li>
        </ol>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resumeLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          📤 Upload Documents Now
        </a>
      </div>

      <!-- Help Section -->
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin-top: 25px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #0f172a;">Need Help?</p>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          If you have questions about which documents to upload or need assistance, 
          please contact us at <a href="mailto:support@rnrl.com" style="color: #2563eb;">support@rnrl.com</a> 
          or call <strong>+91-XXXXXXXXXX</strong>
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">
        This is a one-time reminder from RNRL TradeHub. Please do not reply to this email.
      </p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        © ${new Date().getFullYear()} RNRL TradeHub. All rights reserved.
      </p>
    </div>

  </div>

</body>
</html>
  `;
};

/**
 * Email Logic Documentation
 * 
 * CORRECT FLOW:
 * ================
 * 
 * 1. User fills registration form
 *    Status: DRAFT
 *    Action: NO EMAIL
 * 
 * 2. User clicks "Submit Registration"
 *    Status: PENDING_VERIFICATION
 *    Action: Check if all documents uploaded
 *    
 *    If documents complete:
 *      - Move to PENDING_APPROVAL
 *      - Send "Registration Received" email
 *      - NO reminder needed
 *    
 *    If documents missing:
 *      - Stay at PENDING_VERIFICATION
 *      - Send ONE reminder email (this template)
 *      - Email says: "Complete documents to proceed"
 * 
 * 3. User uploads documents
 *    Status: PENDING_APPROVAL
 *    Action: Send "Documents Received, Under Review" email
 *    
 * 4. Admin approves
 *    Status: ACTIVE
 *    Action: Send "Welcome Email with Login Credentials"
 * 
 * 
 * INCORRECT FLOW (DON'T DO THIS):
 * =================================
 * 
 * ❌ Send reminders during registration (user filling form)
 * ❌ Send multiple reminders (24h, 3d, 7d)
 * ❌ Send reminders for drafts
 * ❌ Create system load with scheduled reminders
 * 
 * 
 * WHEN TO TRIGGER THIS EMAIL:
 * ============================
 * 
 * Backend Logic:
 * ```javascript
 * // After user clicks "Submit Registration"
 * if (registration.status === 'SUBMITTED') {
 *   const missingDocs = checkMissingDocuments(registration);
 *   
 *   if (missingDocs.length > 0) {
 *     // Send ONE reminder email
 *     sendPendingDocumentsEmail({
 *       pendingItems: missingDocs,
 *       ...registration
 *     });
 *     
 *     // Set status
 *     registration.status = 'PENDING_VERIFICATION';
 *   } else {
 *     // All docs present
 *     registration.status = 'PENDING_APPROVAL';
 *     sendRegistrationReceivedEmail(registration);
 *   }
 * }
 * ```
 * 
 * NO CRON JOBS NEEDED!
 * NO SCHEDULED TASKS!
 * NO REPEATED REMINDERS!
 * 
 * Just ONE email at the right time.
 */

export const emailTriggerLogic = {
  /**
   * When user submits registration
   */
  onRegistrationSubmit: async (registration: any) => {
    // Check documents
    const requiredDocs = getRequiredDocuments(registration.businessType, registration.hasGST);
    const uploadedDocs = registration.documents.map((d: any) => d.documentType);
    const missingDocs = requiredDocs.filter((doc: string) => !uploadedDocs.includes(doc));

    if (missingDocs.length > 0) {
      // Send ONE reminder
      await sendEmail({
        to: registration.primaryContactEmail,
        template: 'pending-documents-reminder',
        data: {
          partnerCode: registration.partnerCode,
          partnerName: registration.legalName,
          userEmail: registration.primaryContactEmail,
          userName: registration.primaryContactPerson,
          registrationDate: registration.createdAt,
          pendingItems: missingDocs.map(formatDocumentName),
          resumeLink: `https://tradehub.rnrl.com/registration/resume/${registration.id}`,
        },
      });

      // Update status
      registration.status = 'PENDING_VERIFICATION';
    } else {
      // All complete
      registration.status = 'PENDING_APPROVAL';
      
      // Send different email
      await sendEmail({
        to: registration.primaryContactEmail,
        template: 'registration-received',
        data: { ...registration },
      });
    }
  },

  /**
   * When user uploads documents later
   */
  onDocumentUpload: async (registration: any) => {
    // Check if now complete
    const requiredDocs = getRequiredDocuments(registration.businessType, registration.hasGST);
    const uploadedDocs = registration.documents.map((d: any) => d.documentType);
    const missingDocs = requiredDocs.filter((doc: string) => !uploadedDocs.includes(doc));

    if (missingDocs.length === 0 && registration.status === 'PENDING_VERIFICATION') {
      // Now complete!
      registration.status = 'PENDING_APPROVAL';
      
      await sendEmail({
        to: registration.primaryContactEmail,
        template: 'documents-received',
        data: {
          message: 'All documents received. Your registration is now under review.',
          ...registration,
        },
      });
    }
  },
};

/**
 * Helper function to get required documents based on business type
 */
function getRequiredDocuments(businessType: string, hasGST: boolean): string[] {
  const baseDocs = ['PAN_CARD', 'CANCELLED_CHECK'];
  
  if (['BUYER', 'SELLER', 'TRADER'].includes(businessType) || hasGST) {
    baseDocs.push('GST_CERTIFICATE');
  }
  
  if (businessType === 'TRANSPORTER' && !hasGST) {
    baseDocs.push('TRANSPORTER_DECLARATION');
  }
  
  return baseDocs;
}

/**
 * Helper to format document type name for display
 */
function formatDocumentName(docType: string): string {
  const names: Record<string, string> = {
    'PAN_CARD': 'PAN Card',
    'GST_CERTIFICATE': 'GST Certificate',
    'CANCELLED_CHECK': 'Cancelled Cheque',
    'AADHAR_CARD': 'Aadhar Card',
    'TRANSPORTER_DECLARATION': 'Transporter Declaration',
  };
  return names[docType] || docType;
}

async function sendEmail(config: any) {
  // Backend implementation
  console.log('Send email:', config);
}

