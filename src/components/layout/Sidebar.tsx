
import React from 'react';
import { DashboardIcon, ContractIcon, UsersIcon, SettingsIcon, InvoiceIcon, PaymentIcon, DisputeIcon, CommissionIcon, ReportIcon, AuditIcon } from '../ui/icons';
import { User } from '../../types';

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
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-md cursor-pointer transition-all group ${
      isActive
        ? 'bg-blue-800/30 text-white'
        : 'text-slate-400 hover:bg-gray-700/50 hover:text-white'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    <Icon className="w-5 h-5" />
    <span className="ml-4 font-medium text-sm">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, activePage, currentUser }) => {
  const navItems = [
    { name: 'Dashboard', icon: DashboardIcon, roles: ['Admin', 'Sales', 'Accounts', 'Dispute Manager', 'Vendor/Client'] },
    { name: 'Sales Contracts', icon: ContractIcon, roles: ['Admin', 'Sales', 'Accounts', 'Dispute Manager', 'Vendor/Client'] },
    { name: 'Invoices', icon: InvoiceIcon, roles: ['Admin', 'Accounts', 'Vendor/Client'] },
    { name: 'Payments', icon: PaymentIcon, roles: ['Admin', 'Accounts', 'Vendor/Client'] },
    { name: 'Commissions', icon: CommissionIcon, roles: ['Admin', 'Accounts'] },
    { name: 'Disputes', icon: DisputeIcon, roles: ['Admin', 'Dispute Manager', 'Sales'] },
    { name: 'Vendors & Clients', icon: UsersIcon, roles: ['Admin', 'Sales', 'Accounts'] },
    { name: 'Reports', icon: ReportIcon, roles: ['Admin', 'Sales', 'Accounts'] },
    { name: 'Audit Trail', icon: AuditIcon, roles: ['Admin'] },
    { name: 'User Management', icon: UsersIcon, roles: ['Admin'] },
    { name: 'Roles & Rights', icon: SettingsIcon, roles: ['Admin'] },
    { name: 'Settings', icon: SettingsIcon, roles: ['Admin'] },
    { name: 'Grievance Officer', icon: UsersIcon, roles: ['Admin', 'Sales', 'Accounts', 'Dispute Manager', 'Vendor/Client'] },
  ];

  const accessibleItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className="w-64 bg-gray-900 flex flex-col text-white">
      <div className="flex items-center justify-center h-16 border-b border-gray-700/50">
        <h1 className="text-xl font-bold tracking-wider">RNRL ERP</h1>
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
            />
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700/50 text-center text-xs text-slate-400">
        <div className="space-x-4">
          <a href="#privacy-policy" onClick={(e) => { e.preventDefault(); onNavigate('Privacy Policy'); }} className="hover:underline">Privacy Policy</a>
          <a href="#terms-of-service" onClick={(e) => { e.preventDefault(); onNavigate('Terms of Service'); }} className="hover:underline">Terms of Service</a>
        </div>
        <p className="mt-2">&copy; {new Date().getFullYear()} RNRL Trade Hub Pvt. Ltd.</p>
        <p>ERP v3.2</p>
      </div>
    </aside>
  );
};

export default Sidebar;
