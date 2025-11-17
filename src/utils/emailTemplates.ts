/**
 * Email Templates for Change Request Notifications
 * CRITICAL: All change requests must send email for audit trail
 */

export interface ChangeRequestEmailData {
  partnerCode: string;
  partnerName: string;
  userEmail: string;
  userName: string;
  requestId: string;
  requestDate: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress: string;
  disclaimerAccepted: boolean;
}

/**
 * Email template for change request submission
 */
export const generateChangeRequestSubmissionEmail = (data: ChangeRequestEmailData): string => {
  const changesHtml = data.changes.map((change, index) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${index + 1}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">${change.field}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; color: #64748b;">${change.oldValue || '<em>Not set</em>'}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; color: #2563eb; font-weight: 600;">${change.newValue}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Change Request Submitted - RNRL TradeHub</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 20px;">
  
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Profile Change Request Submitted</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">RNRL TradeHub</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      
      <!-- Confirmation Message -->
      <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; color: #166534; font-weight: 600;">✅ Your change request has been submitted successfully!</p>
      </div>

      <!-- User Details -->
      <div style="margin-bottom: 25px;">
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #64748b;">Dear <strong>${data.userName}</strong>,</p>
        <p style="margin: 0; font-size: 14px;">Your profile change request has been received and is now pending approval.</p>
      </div>

      <!-- Request Details -->
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0f172a;">Request Details</h2>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Request ID:</td>
            <td style="padding: 5px 0; font-weight: 600;">${data.requestId}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Partner Code:</td>
            <td style="padding: 5px 0; font-weight: 600;">${data.partnerCode}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Company Name:</td>
            <td style="padding: 5px 0; font-weight: 600;">${data.partnerName}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Submitted On:</td>
            <td style="padding: 5px 0; font-weight: 600;">${data.requestDate}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">IP Address:</td>
            <td style="padding: 5px 0; font-family: monospace;">${data.ipAddress}</td>
          </tr>
        </table>
      </div>

      <!-- Changes Requested -->
      <div style="margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0f172a;">Changes Requested (${data.changes.length})</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">#</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Field</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Current Value</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">New Value</th>
            </tr>
          </thead>
          <tbody>
            ${changesHtml}
          </tbody>
        </table>
      </div>

      <!-- Important Disclaimer -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">⚠️ Important: Ongoing Trades Protection</p>
        <p style="margin: 0; font-size: 13px; color: #78350f;">
          <strong>This change will NOT affect any ongoing trades or contracts.</strong> All existing trades will continue 
          to use your original profile information. Once approved, only NEW trades will use the updated information.
        </p>
      </div>

      <!-- Disclaimer Accepted -->
      <div style="background-color: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #5b21b6;">
          <strong>✓ Disclaimer Accepted:</strong> You have acknowledged and accepted that this change will not impact 
          ongoing trades and that the information provided is accurate.
        </p>
      </div>

      <!-- Next Steps -->
      <div style="margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0f172a;">What Happens Next?</h2>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 10px;"><strong>Review:</strong> Our team will review your change request within 1-2 business days.</li>
          <li style="margin-bottom: 10px;"><strong>Notification:</strong> You'll receive an email when your request is approved or requires clarification.</li>
          <li style="margin-bottom: 10px;"><strong>Approval:</strong> Once approved, changes will be applied to your profile immediately.</li>
          <li style="margin-bottom: 10px;"><strong>Audit Trail:</strong> This email and all related actions are recorded for compliance purposes.</li>
        </ol>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://tradehub.rnrl.com/profile" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View My Profile
        </a>
      </div>

      <!-- Help Section -->
      <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-top: 25px;">
        <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #0f172a;">Need Help?</p>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          If you did not make this change request or have questions, please contact our support team immediately at 
          <a href="mailto:support@rnrl.com" style="color: #2563eb;">support@rnrl.com</a> or call +91-XXXXXXXXXX.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">
        This is an automated email from RNRL TradeHub. Please do not reply to this email.
      </p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        © ${new Date().getFullYear()} RNRL TradeHub. All rights reserved.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8;">
        <strong>Audit Trail ID:</strong> ${data.requestId} | <strong>Timestamp:</strong> ${data.requestDate}
      </p>
    </div>

  </div>

  <!-- Legal Notice -->
  <div style="max-width: 600px; margin: 20px auto; text-align: center; font-size: 11px; color: #94a3b8;">
    <p style="margin: 0;">
      This email contains confidential information and is intended only for the named recipient. 
      If you are not the intended recipient, please delete this email and notify the sender immediately.
    </p>
  </div>

</body>
</html>
  `;
};

/**
 * Email template for change request approval
 */
export const generateChangeRequestApprovalEmail = (data: ChangeRequestEmailData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Change Request Approved - RNRL TradeHub</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">✅ Change Request Approved</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your profile has been updated</p>
    </div>

    <div style="padding: 30px;">
      <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; color: #166534; font-weight: 600;">🎉 Great news! Your change request has been approved.</p>
      </div>

      <p style="font-size: 14px;">Dear <strong>${data.userName}</strong>,</p>
      <p style="font-size: 14px;">
        Your profile change request (ID: <strong>${data.requestId}</strong>) has been approved and the changes 
        have been applied to your account.
      </p>

      <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #1e40af;">
          <strong>📝 Note:</strong> All NEW trades and transactions from now on will use your updated information. 
          Ongoing trades continue to use the original information as per the disclaimer you accepted.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://tradehub.rnrl.com/profile" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Updated Profile
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
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
 * Email template for change request rejection
 */
export const generateChangeRequestRejectionEmail = (data: ChangeRequestEmailData & { rejectionReason: string }): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Change Request Update - RNRL TradeHub</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Change Request - Action Required</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Additional information needed</p>
    </div>

    <div style="padding: 30px;">
      <p style="font-size: 14px;">Dear <strong>${data.userName}</strong>,</p>
      <p style="font-size: 14px;">
        Your change request (ID: <strong>${data.requestId}</strong>) requires additional information or clarification.
      </p>

      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #991b1b;">Reason:</p>
        <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${data.rejectionReason}</p>
      </div>

      <p style="font-size: 14px;">
        Please review the reason above and submit a new change request with the correct information.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://tradehub.rnrl.com/profile" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Go to Profile
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
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
 * Email template data for sales confirmation
 */
export interface SalesConfirmationEmailData {
  confirmationNo: string;
  confirmationDate: string;
  buyerName: string;
  sellerName: string;
  buyerEmail: string;
  sellerEmail: string;
  lineItems: Array<{
    commodity: string;
    variety: string;
    quantity: string;
    rate: string;
    amount: string;
  }>;
  totalAmount: string;
  deliveryLocation: string;
  deliveryTerms: string;
  paymentTerms: string;
  remarks?: string;
  createdBy: string;
  status: string;
}

/**
 * Email template for new sales confirmation
 */
export const generateSalesConfirmationEmail = (data: SalesConfirmationEmailData): string => {
  const lineItemsHtml = data.lineItems.map((item, index) => `
    <tr>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">${item.commodity}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">${item.variety}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${item.quantity}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${item.rate}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${item.amount}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Confirmation - ${data.confirmationNo}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 20px;">
  
  <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">📋 Sales Confirmation</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">RNRL TradeHub</p>
    </div>

    <div style="padding: 30px;">
      <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af; font-weight: 600;">✅ Sales Confirmation Generated Successfully</p>
      </div>

      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0f172a;">Confirmation Details</h2>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0; color: #64748b; width: 40%;">Confirmation No:</td>
            <td style="padding: 5px 0; font-weight: 600;">${data.confirmationNo}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Date:</td>
            <td style="padding: 5px 0; font-weight: 600;">${data.confirmationDate}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Status:</td>
            <td style="padding: 5px 0; font-weight: 600; color: #2563eb;">${data.status}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Created By:</td>
            <td style="padding: 5px 0; font-weight: 600;">${data.createdBy}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0f172a;">Commodity Details</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">#</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">Commodity</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">Variety</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Quantity</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Rate</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9;">
              <td colspan="5" style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">Total Amount:</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #2563eb;">${data.totalAmount}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://tradehub.rnrl.com/sales-confirmation" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
          View Confirmation Details
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        © ${new Date().getFullYear()} RNRL TradeHub Pvt. Ltd. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Email template for sales confirmation amendment
 */
export const generateSalesConfirmationAmendmentEmail = (data: SalesConfirmationEmailData & { amendmentReason: string; previousVersion: number }): string => {
  const lineItemsHtml = data.lineItems.map((item, index) => `
    <tr>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">${item.commodity}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">${item.variety}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${item.quantity}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${item.rate}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${item.amount}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Confirmation Amendment - ${data.confirmationNo}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 20px;">
  
  <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">🔄 Sales Confirmation Amendment</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">RNRL TradeHub</p>
    </div>

    <div style="padding: 30px;">
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ This is an amended version of the sales confirmation</p>
      </div>

      <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #991b1b;">Amendment Information</h2>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0; color: #991b1b; width: 40%;">Previous Version:</td>
            <td style="padding: 5px 0; font-weight: 600;">Version ${data.previousVersion}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #991b1b;">New Version:</td>
            <td style="padding: 5px 0; font-weight: 600;">Version ${data.previousVersion + 1}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #991b1b;">Amendment Date:</td>
            <td style="padding: 5px 0; font-weight: 600;">${data.confirmationDate}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #991b1b; vertical-align: top;">Reason for Amendment:</td>
            <td style="padding: 5px 0; font-weight: 600;">${data.amendmentReason}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0f172a;">Updated Commodity Details</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">#</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">Commodity</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">Variety</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Quantity</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Rate</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9;">
              <td colspan="5" style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">Total Amount:</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #2563eb;">${data.totalAmount}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://tradehub.rnrl.com/sales-confirmation" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
          View Updated Confirmation
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        © ${new Date().getFullYear()} RNRL TradeHub Pvt. Ltd. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
