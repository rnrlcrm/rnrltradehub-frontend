interface Notification {
  id: string;
  type: 'alert' | 'info' | 'reminder' | 'milestone';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Create a notification for an overdue invoice
 */
export const createInvoiceOverdueNotification = (
  invoiceNo: string,
  amount: number,
  daysOverdue: number,
  partyName: string
): Notification => {
  return {
    id: `invoice-overdue-${invoiceNo}-${Date.now()}`,
    type: 'alert',
    title: `Invoice ${invoiceNo} Overdue`,
    message: `Invoice for ${partyName} is overdue by ${daysOverdue} days (₹${amount.toLocaleString('en-IN')})`,
    timestamp: new Date(),
    isRead: false,
    actionUrl: '#/invoices',
    actionLabel: 'View Invoice',
    priority: daysOverdue > 30 ? 'high' : daysOverdue > 15 ? 'medium' : 'low',
  };
};

/**
 * Create a notification for a pending commission payment
 */
export const createCommissionDueNotification = (
  commissionId: string,
  agentName: string,
  amount: number,
  daysOverdue: number
): Notification => {
  return {
    id: `commission-due-${commissionId}-${Date.now()}`,
    type: 'reminder',
    title: `Commission Payment Due`,
    message: `Payment to ${agentName} is due (₹${amount.toLocaleString('en-IN')})${daysOverdue > 0 ? ` - ${daysOverdue} days overdue` : ''}`,
    timestamp: new Date(),
    isRead: false,
    actionUrl: '#/commissions',
    actionLabel: 'Record Payment',
    priority: daysOverdue > 15 ? 'high' : 'medium',
  };
};

/**
 * Create a notification for a contract milestone
 */
export const createContractMilestoneNotification = (
  scNo: string,
  milestone: string,
  description: string
): Notification => {
  return {
    id: `contract-milestone-${scNo}-${Date.now()}`,
    type: 'milestone',
    title: `Contract ${scNo} - ${milestone}`,
    message: description,
    timestamp: new Date(),
    isRead: false,
    actionUrl: '#/sales-contracts',
    actionLabel: 'View Contract',
    priority: milestone === 'Completed' ? 'high' : 'medium',
  };
};

/**
 * Create a notification for an auto-generated commission
 */
export const createAutoCommissionNotification = (
  scNo: string,
  amount: number
): Notification => {
  return {
    id: `auto-commission-${scNo}-${Date.now()}`,
    type: 'info',
    title: 'Commission Auto-Generated',
    message: `Commission record created for contract ${scNo} (₹${amount.toLocaleString('en-IN')}). Please review and approve.`,
    timestamp: new Date(),
    isRead: false,
    actionUrl: '#/dashboard',
    actionLabel: 'Review',
    priority: 'medium',
  };
};

/**
 * Create a daily summary notification
 */
export const createDailySummaryNotification = (
  pendingInvoices: number,
  pendingCommissions: number,
  overduePayments: number
): Notification => {
  return {
    id: `daily-summary-${new Date().toISOString().split('T')[0]}`,
    type: 'info',
    title: 'Daily Summary',
    message: `${pendingInvoices} contracts need invoices, ${pendingCommissions} commissions pending, ${overduePayments} overdue payments`,
    timestamp: new Date(),
    isRead: false,
    actionUrl: '#/dashboard',
    actionLabel: 'View Dashboard',
    priority: 'low',
  };
};

/**
 * Mock notification store (in real app, this would be in Redux/Context)
 */
let notificationStore: Notification[] = [];

export const getNotifications = (): Notification[] => {
  return notificationStore;
};

export const addNotification = (notification: Notification): void => {
  notificationStore = [notification, ...notificationStore];
};

export const markAsRead = (id: string): void => {
  notificationStore = notificationStore.map(n =>
    n.id === id ? { ...n, isRead: true } : n
  );
};

export const markAllAsRead = (): void => {
  notificationStore = notificationStore.map(n => ({ ...n, isRead: true }));
};

export const clearNotifications = (): void => {
  notificationStore = [];
};

/**
 * Create a notification for sales confirmation created
 */
export const createSalesConfirmationNotification = (
  confirmationNo: string,
  buyerName: string,
  sellerName: string,
  commodityCount: number
): Notification => {
  return {
    id: `sales-confirmation-${confirmationNo}-${Date.now()}`,
    type: 'milestone',
    title: `Sales Confirmation ${confirmationNo} Created`,
    message: `New sales confirmation created with ${commodityCount} commodity item(s) between ${buyerName} and ${sellerName}`,
    timestamp: new Date(),
    isRead: false,
    actionUrl: '#/sales-confirmation',
    actionLabel: 'View Confirmation',
    priority: 'high',
  };
};

/**
 * Create a notification for sales confirmation amendment
 */
export const createSalesConfirmationAmendmentNotification = (
  confirmationNo: string,
  amendmentReason: string
): Notification => {
  return {
    id: `sales-confirmation-amendment-${confirmationNo}-${Date.now()}`,
    type: 'alert',
    title: `Sales Confirmation ${confirmationNo} Amended`,
    message: `Confirmation has been amended. Reason: ${amendmentReason}`,
    timestamp: new Date(),
    isRead: false,
    actionUrl: '#/sales-confirmation',
    actionLabel: 'View Amendment',
    priority: 'high',
  };
};

/**
 * Create a notification for sales confirmation approval
 */
export const createSalesConfirmationApprovalNotification = (
  confirmationNo: string,
  approvedBy: string
): Notification => {
  return {
    id: `sales-confirmation-approval-${confirmationNo}-${Date.now()}`,
    type: 'milestone',
    title: `Sales Confirmation ${confirmationNo} Approved`,
    message: `Confirmation has been approved by ${approvedBy}`,
    timestamp: new Date(),
    isRead: false,
    actionUrl: '#/sales-confirmation',
    actionLabel: 'View Confirmation',
    priority: 'medium',
  };
};

/**
 * Create a notification for sales confirmation pending approval
 */
export const createSalesConfirmationPendingNotification = (
  confirmationNo: string,
  createdBy: string
): Notification => {
  return {
    id: `sales-confirmation-pending-${confirmationNo}-${Date.now()}`,
    type: 'reminder',
    title: `Sales Confirmation ${confirmationNo} Pending Approval`,
    message: `New confirmation created by ${createdBy} requires your approval`,
    timestamp: new Date(),
    isRead: false,
    actionUrl: '#/sales-confirmation',
    actionLabel: 'Review & Approve',
    priority: 'high',
  };
};
