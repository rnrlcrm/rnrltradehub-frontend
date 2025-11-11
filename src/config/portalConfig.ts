/**
 * Portal Configuration
 * Defines modules and permissions for each portal type
 */

import { PortalType, PortalModule } from '../types/multiTenant';

export const PORTAL_MODULES: Record<PortalType, PortalModule[]> = {
  back_office: [
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    { id: 'ai-assistant', name: 'AI Assistant', path: '/ai-assistant' },
    { id: 'sales-contracts', name: 'Sales Contracts', path: '/sales-contracts' },
    { id: 'invoices', name: 'Invoices', path: '/invoices' },
    { id: 'payments', name: 'Payments', path: '/payments' },
    { id: 'commissions', name: 'Commissions', path: '/commissions' },
    { id: 'commission-accounting', name: 'Commission Accounting', path: '/commission-accounting' },
    { id: 'disputes', name: 'Disputes', path: '/disputes' },
    { id: 'vendors-clients', name: 'Vendors & Clients', path: '/vendors-clients' },
    { id: 'reports', name: 'Reports', path: '/reports' },
    { id: 'audit-trail', name: 'Audit Trail', path: '/audit-trail' },
    { id: 'settings', name: 'Settings', path: '/settings' },
    { id: 'grievance-officer', name: 'Grievance Officer', path: '/grievance-officer' },
  ],
  client: [
    { id: 'my-dashboard', name: 'My Dashboard', path: '/my-dashboard' },
    { id: 'my-contracts', name: 'My Contracts', path: '/my-contracts' },
    { id: 'quality-reports', name: 'Quality Reports', path: '/quality-reports' },
    { id: 'payments', name: 'Payments', path: '/payments' },
    { id: 'support', name: 'Support', path: '/support' },
    { id: 'my-team', name: 'My Team', path: '/my-team' },
  ],
  vendor: [
    { id: 'my-dashboard', name: 'My Dashboard', path: '/my-dashboard' },
    { id: 'supply-contracts', name: 'Supply Contracts', path: '/supply-contracts' },
    { id: 'deliveries', name: 'Deliveries', path: '/deliveries' },
    { id: 'invoices', name: 'Invoices', path: '/invoices' },
    { id: 'quality-certificates', name: 'Quality Certificates', path: '/quality-certificates' },
    { id: 'my-team', name: 'My Team', path: '/my-team' },
  ],
};

export const DEFAULT_PORTAL_NAMES: Record<PortalType, string> = {
  back_office: 'Back Office Portal',
  client: 'Client Portal',
  vendor: 'Vendor Portal',
};

/**
 * Check if a user has access to a specific module
 */
export function hasModuleAccess(userPortal: PortalType, moduleId: string): boolean {
  const modules = PORTAL_MODULES[userPortal];
  return modules.some(module => module.id === moduleId);
}

/**
 * Get modules for a specific portal
 */
export function getPortalModules(portalType: PortalType): PortalModule[] {
  return PORTAL_MODULES[portalType] || [];
}
