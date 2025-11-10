
import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { ChevronDownIcon, BellIcon, LogoutIcon } from '../ui/icons';
import { User, mockUsers, MasterDataItem } from '../../data/mockData';
import { cn } from '../../lib/utils';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onLogout: () => void;
  organizations: MasterDataItem[];
  currentOrganization: string;
  onOrganizationChange: (organization: string) => void;
  financialYears: MasterDataItem[];
  currentFinancialYear: string;
  onFinancialYearChange: (fy: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    currentUser, onUserChange, onLogout,
    organizations, currentOrganization, onOrganizationChange,
    financialYears, currentFinancialYear, onFinancialYearChange
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [fyDropdownOpen, setFyDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const fyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) setUserDropdownOpen(false);
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) setOrgDropdownOpen(false);
      if (fyDropdownRef.current && !fyDropdownRef.current.contains(event.target as Node)) setFyDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Global search handler (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search');
        searchInput?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="bg-white h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
      <div className="flex items-center space-x-4 flex-1">
        {/* Organization Selector */}
        <div className="relative" ref={orgDropdownRef}>
          <button onClick={() => setOrgDropdownOpen(!orgDropdownOpen)} className="flex items-center space-x-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 p-2 rounded-lg transition-colors" aria-haspopup="true" aria-expanded={orgDropdownOpen}>
            <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">{currentOrganization}</span>
            <ChevronDownIcon className="w-5 h-5 text-neutral-500" />
          </button>
          {orgDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 z-dropdown">
              <div className="p-2">
                <p className="px-2 pb-1 text-xs font-bold text-neutral-400 uppercase">Switch Organization</p>
                {organizations.map(org => (
                  <a key={org.id} href="#" onClick={(e) => { e.preventDefault(); onOrganizationChange(org.name); setOrgDropdownOpen(false); }} className={cn(
                    'block px-2 py-1.5 text-sm rounded-md transition-colors',
                    currentOrganization === org.name 
                      ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-900 dark:text-primary-200' 
                      : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  )}>
                    {org.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Financial Year Selector */}
        <div className="relative" ref={fyDropdownRef}>
          <button onClick={() => setFyDropdownOpen(!fyDropdownOpen)} className="flex items-center space-x-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 p-2 rounded-lg transition-colors" aria-haspopup="true" aria-expanded={fyDropdownOpen}>
            <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">FY: {currentFinancialYear}</span>
            <ChevronDownIcon className="w-5 h-5 text-neutral-500" />
          </button>
          {fyDropdownOpen && (
            <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 z-dropdown">
              <div className="p-2">
                <p className="px-2 pb-1 text-xs font-bold text-neutral-400 uppercase">Switch FY</p>
                {financialYears.map(fy => (
                  <a key={fy.id} href="#" onClick={(e) => { e.preventDefault(); onFinancialYearChange(fy.name); setFyDropdownOpen(false); }} className={cn(
                    'block px-2 py-1.5 text-sm rounded-md transition-colors',
                    currentFinancialYear === fy.name 
                      ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-900 dark:text-primary-200' 
                      : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  )}>
                    {fy.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              id="global-search"
              type="text"
              placeholder="Search... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
            />
          </div>
        </div>
      </div>

      {/* User Profile and Notifications */}
      <div className="flex items-center space-x-6">
        <button className="relative text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200" aria-label="Notifications">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-error ring-2 ring-white dark:ring-neutral-800" />
        </button>

        <div className="relative" ref={userDropdownRef}>
          <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center space-x-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 p-1 rounded-lg transition-colors" aria-haspopup="true" aria-expanded={userDropdownOpen}>
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-200 flex items-center justify-center font-bold text-sm">
              {getInitials(currentUser.name)}
            </div>
            <div className="text-left hidden md:block">
              <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">{currentUser.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{currentUser.role}</p>
            </div>
            <ChevronDownIcon className="w-5 h-5 text-neutral-500" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 z-dropdown">
              <div className="py-1">
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Signed in as</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{currentUser.email}</p>
                </div>
                <div className="py-1">
                  <p className="px-4 pt-2 pb-1 text-xs font-bold text-neutral-400 uppercase">Switch User</p>
                  {mockUsers.map(user => (
                    <a key={user.id} href="#" onClick={(e) => { e.preventDefault(); onUserChange(user); setUserDropdownOpen(false); }} className={cn(
                      'block px-4 py-2 text-sm rounded-md mx-2 transition-colors',
                      currentUser.id === user.id 
                        ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-900 dark:text-primary-200' 
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    )}>
                      {user.name} <span className="text-neutral-500 dark:text-neutral-400">({user.role})</span>
                    </a>
                  ))}
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-700 py-1">
                  <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="flex items-center px-4 py-2 text-sm text-error hover:bg-error-light dark:hover:bg-error/20 transition-colors">
                    <LogoutIcon className="w-5 h-5 mr-2.5" />
                    Logout
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
