/**
 * Notification and Timeline Tracking Service
 * Handles automated notifications and timeline management
 */

export interface Notification {
  id: string;
  type: NotificationType;
  recipient: string;
  recipientType: 'buyer' | 'seller' | 'controller' | 'transporter' | 'admin';
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'failed' | 'read';
  createdAt: string;
  sentAt?: string;
  readAt?: string;
  relatedEntity: {
    type: 'invoice' | 'payment' | 'contract' | 'reconciliation' | 'dispute' | 'logistics';
    id: string;
  };
  actionRequired?: boolean;
  actionDeadline?: string;
  actionUrl?: string;
}

export type NotificationType =
  | 'invoice_uploaded'
  | 'invoice_validated'
  | 'invoice_error'
  | 'payment_received'
  | 'payment_posted'
  | 'reconciliation_matched'
  | 'reconciliation_unmatched'
  | 'reconciliation_difference'
  | 'debit_note_posted'
  | 'credit_note_posted'
  | 'logistics_bill_uploaded'
  | 'controller_invoice_uploaded'
  | 'action_required'
  | 'timeline_reminder'
  | 'overdue_alert';

export interface TimelineEvent {
  id: string;
  entityType: 'invoice' | 'payment' | 'contract' | 'reconciliation';
  entityId: string;
  eventType: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  scheduledDate?: string;
  completedDate?: string;
  performedBy?: string;
  automated: boolean;
  metadata?: Record<string, any>;
}

/**
 * Notification Service Class
 */
export class NotificationService {
  /**
   * Send invoice uploaded notification to buyer
   */
  static async notifyInvoiceUploaded(invoice: any, buyer: any): Promise<void> {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      type: 'invoice_uploaded',
      recipient: buyer.email,
      recipientType: 'buyer',
      subject: `New Invoice ${invoice.invoiceNo} Uploaded`,
      message: `Seller has uploaded invoice ${invoice.invoiceNo} for contract ${invoice.salesContractId}. Amount: ₹${invoice.amount.toLocaleString()}`,
      priority: 'high',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedEntity: {
        type: 'invoice',
        id: invoice.id,
      },
      actionRequired: true,
      actionDeadline: this.calculateDeadline(7), // 7 days to review
      actionUrl: `/invoices/${invoice.id}`,
    };

    await this.sendNotification(notification);
  }

  /**
   * Send invoice validation error notification to seller
   */
  static async notifyInvoiceError(invoice: any, seller: any, errors: string[]): Promise<void> {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      type: 'invoice_error',
      recipient: seller.email,
      recipientType: 'seller',
      subject: `Invoice ${invoice.invoiceNo} Validation Failed`,
      message: `Invoice validation failed. Please correct the following errors:\n\n${errors.join('\n')}`,
      priority: 'urgent',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedEntity: {
        type: 'invoice',
        id: invoice.id,
      },
      actionRequired: true,
      actionUrl: `/invoices/${invoice.id}`,
    };

    await this.sendNotification(notification);
  }

  /**
   * Send payment received notification
   */
  static async notifyPaymentReceived(payment: any, seller: any): Promise<void> {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      type: 'payment_received',
      recipient: seller.email,
      recipientType: 'seller',
      subject: `Payment Received: ${payment.paymentId}`,
      message: `Payment of ₹${payment.amount.toLocaleString()} received via ${payment.method} for invoice ${payment.invoiceId}`,
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedEntity: {
        type: 'payment',
        id: payment.id,
      },
    };

    await this.sendNotification(notification);
  }

  /**
   * Send reconciliation status notification
   */
  static async notifyReconciliationStatus(
    reconciliation: any,
    party: any,
    status: 'matched' | 'unmatched' | 'difference'
  ): Promise<void> {
    let subject = '';
    let message = '';
    let priority: 'low' | 'medium' | 'high' = 'medium';

    if (status === 'matched') {
      subject = `Reconciliation Matched: ${reconciliation.id}`;
      message = `Account reconciliation completed successfully. All entries matched.`;
      priority = 'low';
    } else if (status === 'unmatched') {
      subject = `Reconciliation Unmatched: ${reconciliation.id}`;
      message = `Account reconciliation found unmatched entries. Please review.`;
      priority = 'high';
    } else {
      subject = `Reconciliation Difference: ${reconciliation.id}`;
      message = `Account reconciliation shows difference of ₹${Math.abs(reconciliation.difference).toLocaleString()}. Action required.`;
      priority = 'high';
    }

    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      type: `reconciliation_${status}` as NotificationType,
      recipient: party.email,
      recipientType: party.type,
      subject,
      message,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedEntity: {
        type: 'reconciliation',
        id: reconciliation.id,
      },
      actionRequired: status !== 'matched',
      actionUrl: `/reconciliation/${reconciliation.id}`,
    };

    await this.sendNotification(notification);
  }

  /**
   * Send debit/credit note posted notification
   */
  static async notifyNotePosted(
    noteType: 'debit' | 'credit',
    note: any,
    recipient: any
  ): Promise<void> {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      type: `${noteType}_note_posted` as NotificationType,
      recipient: recipient.email,
      recipientType: recipient.type,
      subject: `${noteType === 'debit' ? 'Debit' : 'Credit'} Note Posted: ${note.noteNumber}`,
      message: `${noteType === 'debit' ? 'Debit' : 'Credit'} note of ₹${note.amount.toLocaleString()} has been posted to your account. Reason: ${note.reason}`,
      priority: 'high',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedEntity: {
        type: 'dispute',
        id: note.id,
      },
      actionRequired: true,
      actionUrl: `/ledger?noteId=${note.id}`,
    };

    await this.sendNotification(notification);
  }

  /**
   * Send logistics bill uploaded notification
   */
  static async notifyLogisticsBillUploaded(bill: any, recipient: any): Promise<void> {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      type: 'logistics_bill_uploaded',
      recipient: recipient.email,
      recipientType: recipient.type,
      subject: `Logistics Bill ${bill.billNumber} Uploaded`,
      message: `Transporter has uploaded logistics bill ${bill.billNumber} for LR ${bill.lrNumber}. Amount: ₹${bill.totalAmount.toLocaleString()}`,
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedEntity: {
        type: 'logistics',
        id: bill.id,
      },
      actionRequired: true,
      actionDeadline: this.calculateDeadline(5),
      actionUrl: `/logistics/${bill.id}`,
    };

    await this.sendNotification(notification);
  }

  /**
   * Send controller invoice uploaded notification
   */
  static async notifyControllerInvoiceUploaded(invoice: any, buyer: any): Promise<void> {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      type: 'controller_invoice_uploaded',
      recipient: buyer.email,
      recipientType: 'buyer',
      subject: `Controller Invoice ${invoice.invoiceNo} Uploaded`,
      message: `Controller has uploaded invoice ${invoice.invoiceNo}. Amount: ₹${invoice.amount.toLocaleString()}`,
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedEntity: {
        type: 'invoice',
        id: invoice.id,
      },
      actionRequired: true,
      actionUrl: `/invoices/${invoice.id}`,
    };

    await this.sendNotification(notification);
  }

  /**
   * Send timeline reminder
   */
  static async sendTimelineReminder(event: TimelineEvent, recipient: any): Promise<void> {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      type: 'timeline_reminder',
      recipient: recipient.email,
      recipientType: recipient.type,
      subject: `Reminder: ${event.description}`,
      message: `This is a reminder for pending action: ${event.description}. Scheduled: ${event.scheduledDate}`,
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedEntity: {
        type: event.entityType,
        id: event.entityId,
      },
      actionRequired: true,
    };

    await this.sendNotification(notification);
  }

  /**
   * Send overdue alert
   */
  static async sendOverdueAlert(entity: any, recipient: any): Promise<void> {
    const notification: Notification = {
      id: `NOTIF-${Date.now()}`,
      type: 'overdue_alert',
      recipient: recipient.email,
      recipientType: recipient.type,
      subject: `Overdue Alert: ${entity.type} ${entity.id}`,
      message: `Action overdue for ${entity.type} ${entity.id}. Please take immediate action.`,
      priority: 'urgent',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedEntity: {
        type: entity.type,
        id: entity.id,
      },
      actionRequired: true,
    };

    await this.sendNotification(notification);
  }

  /**
   * Send notification (actual implementation would call email/SMS service)
   */
  private static async sendNotification(notification: Notification): Promise<void> {
    try {
      // In production, this would call email service API
      console.log('Sending notification:', notification);

      // Simulate API call
      // await fetch('/api/notifications', {
      //   method: 'POST',
      //   body: JSON.stringify(notification),
      // });

      // Store in local storage for demo
      const notifications = this.getStoredNotifications();
      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      notification.status = 'sent';
      notification.sentAt = new Date().toISOString();
    } catch (error) {
      console.error('Failed to send notification:', error);
      notification.status = 'failed';
    }
  }

  /**
   * Get stored notifications (for demo)
   */
  static getStoredNotifications(): Notification[] {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Calculate deadline date
   */
  private static calculateDeadline(days: number): string {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline.toISOString();
  }
}

/**
 * Timeline Tracking Service Class
 */
export class TimelineService {
  /**
   * Create timeline for invoice processing
   */
  static createInvoiceTimeline(invoiceId: string): TimelineEvent[] {
    return [
      {
        id: `TL-${Date.now()}-1`,
        entityType: 'invoice',
        entityId: invoiceId,
        eventType: 'upload',
        description: 'Invoice uploaded by seller',
        status: 'completed',
        completedDate: new Date().toISOString(),
        automated: false,
      },
      {
        id: `TL-${Date.now()}-2`,
        entityType: 'invoice',
        entityId: invoiceId,
        eventType: 'ocr_extract',
        description: 'OCR data extraction',
        status: 'completed',
        completedDate: new Date().toISOString(),
        automated: true,
      },
      {
        id: `TL-${Date.now()}-3`,
        entityType: 'invoice',
        entityId: invoiceId,
        eventType: 'validation',
        description: 'Invoice validation against contract',
        status: 'pending',
        scheduledDate: new Date().toISOString(),
        automated: true,
      },
      {
        id: `TL-${Date.now()}-4`,
        entityType: 'invoice',
        entityId: invoiceId,
        eventType: 'buyer_notification',
        description: 'Notify buyer',
        status: 'pending',
        automated: true,
      },
      {
        id: `TL-${Date.now()}-5`,
        entityType: 'invoice',
        entityId: invoiceId,
        eventType: 'ledger_posting',
        description: 'Post to ledger',
        status: 'pending',
        automated: true,
      },
    ];
  }

  /**
   * Create timeline for payment processing
   */
  static createPaymentTimeline(paymentId: string): TimelineEvent[] {
    return [
      {
        id: `TL-${Date.now()}-1`,
        entityType: 'payment',
        entityId: paymentId,
        eventType: 'upload',
        description: 'Payment details uploaded',
        status: 'completed',
        completedDate: new Date().toISOString(),
        automated: false,
      },
      {
        id: `TL-${Date.now()}-2`,
        entityType: 'payment',
        entityId: paymentId,
        eventType: 'validation',
        description: 'Payment validation',
        status: 'pending',
        automated: true,
      },
      {
        id: `TL-${Date.now()}-3`,
        entityType: 'payment',
        entityId: paymentId,
        eventType: 'ledger_posting',
        description: 'Post to buyer ledger',
        status: 'pending',
        automated: true,
      },
      {
        id: `TL-${Date.now()}-4`,
        entityType: 'payment',
        entityId: paymentId,
        eventType: 'seller_notification',
        description: 'Notify seller',
        status: 'pending',
        automated: true,
      },
      {
        id: `TL-${Date.now()}-5`,
        entityType: 'payment',
        entityId: paymentId,
        eventType: 'reconciliation',
        description: 'Auto-reconciliation',
        status: 'pending',
        automated: true,
      },
    ];
  }

  /**
   * Update timeline event status
   */
  static updateEventStatus(
    eventId: string,
    status: TimelineEvent['status'],
    performedBy?: string
  ): void {
    console.log(`Timeline event ${eventId} updated to ${status} by ${performedBy || 'system'}`);
  }

  /**
   * Check for overdue events
   */
  static checkOverdueEvents(): TimelineEvent[] {
    // Implementation would check database for overdue events
    return [];
  }
}

export default NotificationService;
