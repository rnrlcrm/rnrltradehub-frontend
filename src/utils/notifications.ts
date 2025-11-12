import { formatCurrency } from './formatters';

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
    message: `Invoice for ${partyName} is overdue by ${daysOverdue} days (${formatCurrency(amount)})`,
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
    message: `Payment to ${agentName} is due (${formatCurrency(amount)})${daysOverdue > 0 ? ` - ${daysOverdue} days overdue` : ''}`,
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
    message: `Commission record created for contract ${scNo} (${formatCurrency(amount)}). Please review and approve.`,
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
  notificationStore = notificationStore.map(notification =>
    notification.id === id ? { ...notification, isRead: true } : notification
  );
};

export const markAllAsRead = (): void => {
  notificationStore = notificationStore.map(notification => ({ ...notification, isRead: true }));
};

export const clearNotifications = (): void => {
  notificationStore = [];
};
