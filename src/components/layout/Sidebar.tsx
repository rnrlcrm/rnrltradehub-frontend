
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { DashboardIcon, ContractIcon, UsersIcon, SettingsIcon, InvoiceIcon, PaymentIcon, DisputeIcon, CommissionIcon, ReportIcon, AuditIcon, ChatIcon, TradeDeskIcon, QualityIcon, InventoryIcon, LogisticsIcon, LedgerIcon } from '../ui/icons';
import { User } from '../../types';
import { cn } from '../../lib/utils';

interface SidebarProps {
  onNavigate: (page: string) => void;
  activePage: string;
  currentUser: User;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
}> = ({ icon: Icon, label, isActive, onClick, collapsed }) => (
  <li
    onClick={onClick}
    className={cn(
      'flex items-center p-3 my-1 rounded-md cursor-pointer transition-all group relative',
      isActive
        ? 'bg-primary-500/20 text-white'
        : 'text-neutral-400 hover:bg-neutral-700/50 hover:text-white'
    )}
    aria-current={isActive ? 'page' : undefined}
    title={collapsed ? label : undefined}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    {!collapsed && <span className="ml-4 font-medium text-sm">{label}</span>}
    {collapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, activePage, currentUser }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navItems = [
    { name: 'Dashboard', icon: DashboardIcon, roles: ['Admin', 'Sales', 'Accounts', 'Dispute Manager', 'Business Partner'] },
    { name: 'Trade Desk', icon: TradeDeskIcon, roles: ['Admin', 'Sales', 'Business Partner'] },
    { name: 'AI Assistant', icon: ChatIcon, roles: ['Admin', 'Sales', 'Accounts', 'Dispute Manager', 'Business Partner'] },
    { name: 'Sales Contracts', icon: ContractIcon, roles: ['Admin', 'Sales', 'Accounts', 'Dispute Manager', 'Business Partner'] },
    { name: 'Quality Inspection', icon: QualityIcon, roles: ['Admin', 'Sales', 'Accounts'] },
    { name: 'Inventory', icon: InventoryIcon, roles: ['Admin', 'Sales', 'Accounts'] },
    { name: 'Logistics', icon: LogisticsIcon, roles: ['Admin', 'Sales', 'Accounts'] },
    { name: 'Invoices', icon: InvoiceIcon, roles: ['Admin', 'Accounts', 'Business Partner'] },
    { name: 'Payments', icon: PaymentIcon, roles: ['Admin', 'Accounts', 'Business Partner'] },
    { name: 'Ledger', icon: LedgerIcon, roles: ['Admin', 'Accounts'] },
    { name: 'Reconciliation', icon: LedgerIcon, roles: ['Admin', 'Accounts'] },
    { name: 'Commissions', icon: CommissionIcon, roles: ['Admin', 'Accounts'] },
    { name: 'Commission Accounting', icon: CommissionIcon, roles: ['Admin', 'Accounts'] },
    { name: 'Disputes', icon: DisputeIcon, roles: ['Admin', 'Dispute Manager', 'Sales'] },
    { name: 'Business Partners', icon: UsersIcon, roles: ['Admin', 'Sales', 'Accounts'] },
    { name: 'My Partner Profile', icon: UsersIcon, roles: ['Business Partner'] },
    { name: 'Reports', icon: ReportIcon, roles: ['Admin', 'Sales', 'Accounts'] },
    { name: 'Audit Trail', icon: AuditIcon, roles: ['Admin'] },
    { name: 'Settings', icon: SettingsIcon, roles: ['Admin'] },
    { name: 'Grievance Officer', icon: UsersIcon, roles: ['Admin', 'Sales', 'Accounts', 'Dispute Manager', 'Business Partner'] },
  ];

  const accessibleItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className={cn(
      'bg-neutral-900 flex flex-col text-white transition-all duration-300 relative',
      collapsed ? 'w-20' : 'w-64'
    )}>
      <div className={cn(
        'flex items-center h-16 border-b border-neutral-700/50 px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && <h1 className="text-xl font-bold tracking-wider">RNRL ERP</h1>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-neutral-700/50 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul>
          {accessibleItems.map((item) => (
            <NavItem
              key={item.name}
              icon={item.icon}
              label={item.name}
              isActive={activePage === item.name}
              onClick={() => onNavigate(item.name)}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>
      {!collapsed && (
        <div className="p-4 border-t border-neutral-700/50 text-center text-xs text-neutral-400">
          <div className="space-x-4">
            <a href="#privacy-policy" onClick={(e) => { e.preventDefault(); onNavigate('Privacy Policy'); }} className="hover:underline">Privacy Policy</a>
            <a href="#terms-of-service" onClick={(e) => { e.preventDefault(); onNavigate('Terms of Service'); }} className="hover:underline">Terms of Service</a>
          </div>
          <p className="mt-2">&copy; {new Date().getFullYear()} RNRL Trade Hub Pvt. Ltd.</p>
          <p>ERP v3.2</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
