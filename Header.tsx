
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, BellIcon, LogoutIcon } from '../ui/icons';
import { User, mockUsers, MasterDataItem } from '../../data/mockData';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  organizations: MasterDataItem[];
  currentOrganization: string;
  onOrganizationChange: (organization: string) => void;
  financialYears: MasterDataItem[];
  currentFinancialYear: string;
  onFinancialYearChange: (fy: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    currentUser, onUserChange, 
    organizations, currentOrganization, onOrganizationChange,
    financialYears, currentFinancialYear, onFinancialYearChange
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [fyDropdownOpen, setFyDropdownOpen] = useState(false);
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

  return (
    <header className="bg-white h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-200">
      <div className="flex items-center space-x-4">
        {/* Organization Selector */}
        <div className="relative" ref={orgDropdownRef}>
          <button onClick={() => setOrgDropdownOpen(!orgDropdownOpen)} className="flex items-center space-x-2 hover:bg-slate-100 p-2 rounded-lg transition-colors" aria-haspopup="true" aria-expanded={orgDropdownOpen}>
            <span className="font-semibold text-sm text-slate-800">{currentOrganization}</span>
            <ChevronDownIcon className="w-5 h-5 text-slate-500" />
          </button>
          {orgDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-2xl border border-slate-200 z-10">
              <div className="p-2">
                <p className="px-2 pb-1 text-xs font-bold text-slate-400 uppercase">Switch Organization</p>
                {organizations.map(org => (
                  <a key={org.id} href="#" onClick={(e) => { e.preventDefault(); onOrganizationChange(org.name); setOrgDropdownOpen(false); }} className={`block px-2 py-1.5 text-sm rounded-md transition-colors ${currentOrganization === org.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
                    {org.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Financial Year Selector */}
        <div className="relative" ref={fyDropdownRef}>
          <button onClick={() => setFyDropdownOpen(!fyDropdownOpen)} className="flex items-center space-x-2 hover:bg-slate-100 p-2 rounded-lg transition-colors" aria-haspopup="true" aria-expanded={fyDropdownOpen}>
            <span className="font-semibold text-sm text-slate-800">FY: {currentFinancialYear}</span>
            <ChevronDownIcon className="w-5 h-5 text-slate-500" />
          </button>
          {fyDropdownOpen && (
            <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-2xl border border-slate-200 z-10">
              <div className="p-2">
                <p className="px-2 pb-1 text-xs font-bold text-slate-400 uppercase">Switch FY</p>
                {financialYears.map(fy => (
                  <a key={fy.id} href="#" onClick={(e) => { e.preventDefault(); onFinancialYearChange(fy.name); setFyDropdownOpen(false); }} className={`block px-2 py-1.5 text-sm rounded-md transition-colors ${currentFinancialYear === fy.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
                    {fy.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile and Notifications */}
      <div className="flex items-center space-x-6">
        <button className="relative text-slate-500 hover:text-slate-700" aria-label="Notifications">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="relative" ref={userDropdownRef}>
          <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center space-x-3 hover:bg-slate-100 p-1 rounded-lg transition-colors" aria-haspopup="true" aria-expanded={userDropdownOpen}>
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {getInitials(currentUser.name)}
            </div>
            <div className="text-left hidden md:block">
              <p className="font-semibold text-sm text-slate-800">{currentUser.name}</p>
              <p className="text-xs text-slate-500">{currentUser.role}</p>
            </div>
            <ChevronDownIcon className="w-5 h-5 text-slate-500" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-slate-200 z-10">
              <div className="py-1">
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">Signed in as</p>
                  <p className="text-sm text-slate-500 truncate">{currentUser.email}</p>
                </div>
                <div className="py-1">
                  <p className="px-4 pt-2 pb-1 text-xs font-bold text-slate-400 uppercase">Switch User</p>
                  {mockUsers.map(user => (
                    <a key={user.id} href="#" onClick={(e) => { e.preventDefault(); onUserChange(user); setUserDropdownOpen(false); }} className={`block px-4 py-2 text-sm rounded-md mx-2 transition-colors ${currentUser.id === user.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
                      {user.name} <span className="text-slate-500">({user.role})</span>
                    </a>
                  ))}
                </div>
                <div className="border-t border-slate-200 py-1">
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                    <LogoutIcon className="w-5 h-5 mr-2.5 text-slate-500" />
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
