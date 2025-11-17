
import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import CommandCenter from './pages/CommandCenter';
import AdvancedReporting from './pages/AdvancedReporting';
import TradeDesk from './pages/TradeDesk/TradeDesk';
import SalesContracts from './pages/SalesContracts';
import PartnerRegistration from './pages/PartnerRegistration';
import MyPartnerProfile from './pages/MyPartnerProfile';
import BusinessPartnerManagement from './pages/BusinessPartnerManagement';
import ProfileUpdateApprovals from './pages/ProfileUpdateApprovals';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Disputes from './pages/Disputes';
import Commissions from './pages/Commissions';
import CommissionAccounting from './pages/CommissionAccounting';
import Reports from './pages/Reports';
import AuditTrail from './pages/AuditTrail';
import GrievanceOfficer from './pages/GrievanceOfficer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RolesAndRights from './pages/RolesAndRights';
import Chatbot from './pages/Chatbot';
import TradeDesk from './pages/TradeDesk/TradeDesk';
import QualityInspection from './pages/QualityInspection';
import Inventory from './pages/Inventory';
import Logistics from './pages/Logistics';
import Ledger from './pages/Ledger';
import Reconciliation from './pages/Reconciliation';
import Login from './pages/Login';
import FinanceModule from './pages/FinanceModule';
import { mockUsers, mockAuditLogs, mockOrganizations, mockSalesContracts, mockMasterData } from './data/mockData';
import { User, AuditLog, MasterDataItem, SalesContract } from './types';
import { DialogProvider } from './components/dialogs/CustomDialogs';
import { WebSocketProvider } from './contexts/WebSocketContext';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<string>('Dashboard');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [organizations] = useState<MasterDataItem[]>(mockOrganizations);
  const [financialYears] = useState<MasterDataItem[]>(mockMasterData.financialYears);
  const [currentOrganization, setCurrentOrganization] = useState<string>(organizations[0].name);
  const [currentFinancialYear, setCurrentFinancialYear] = useState<string>(financialYears[financialYears.length - 1].name);
  const [contracts, setContracts] = useState<SalesContract[]>(mockSalesContracts);

  const handleNavigation = (page: string) => {
    const hash = page.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
    window.location.hash = hash;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const pageTitle = hash
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setActivePage(pageTitle.replace(/And/g, '&') || 'Dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Set initial page based on hash

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: auditLogs.length + 1,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' }),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleCarryForward = () => {
    const currentFYIndex = financialYears.findIndex(fy => fy.name === currentFinancialYear);
    if (currentFYIndex < 1) {
        alert("Cannot carry forward. No previous financial year found.");
        return;
    }
    const previousFY = financialYears[currentFYIndex - 1].name;

    const contractsToCarryForward = contracts.filter(c => 
        c.financialYear === previousFY && (c.status === 'Active' || c.status === 'Disputed')
    );

    if (contractsToCarryForward.length === 0) {
        alert(`No active or disputed contracts found in the previous financial year (${previousFY}) to carry forward.`);
        return;
    }

    const newContracts: SalesContract[] = contractsToCarryForward.map((c, index) => ({
        ...c,
        id: `sc_cf_${Date.now() + index}`,
        scNo: `CF-${c.scNo}`,
        financialYear: currentFinancialYear,
        manualTerms: `Carried forward from ${c.scNo} (FY ${previousFY}). ${c.manualTerms || ''}`,
        status: 'Active',
    }));

    const updatedOldContracts = contracts.map(c => {
        if (contractsToCarryForward.some(cf => cf.id === c.id)) {
            return { ...c, status: 'Carried Forward' };
        }
        return c;
    });
    
    setContracts([...updatedOldContracts, ...newContracts]);
    addAuditLog({
        user: currentUser!.name,
        role: currentUser!.role,
        action: 'Carry Forward',
        module: 'Year-End',
        details: `Carried forward ${newContracts.length} contracts from FY ${previousFY} to FY ${currentFinancialYear}.`,
        reason: 'Year-end process initiated by user.'
    });
    alert(`Successfully carried forward ${newContracts.length} contracts to the current financial year.`);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActivePage('Dashboard');
    window.location.hash = '';
  };

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Show login page if not logged in
  if (!currentUser) {
    return <Login onLogin={handleLogin} availableUsers={mockUsers} />;
  }

  const renderPage = () => {
    const pageKey = activePage.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
    switch (pageKey) {
      case 'dashboard': return <Dashboard currentUser={currentUser} onCarryForward={handleCarryForward} />;
      case 'command-center': return <CommandCenter currentUser={currentUser} />;
      case 'trade-desk': return <TradeDesk currentUser={currentUser} />;
      case 'ai-assistant': return <Chatbot currentUser={currentUser} />;
      case 'sales-contracts': return <SalesContracts currentUser={currentUser} currentOrganization={currentOrganization} currentFinancialYear={currentFinancialYear} contracts={contracts} setContracts={setContracts} addAuditLog={addAuditLog} />;
      case 'finance': return <FinanceModule currentUser={currentUser} />;
      case 'invoices': return <Invoices currentUser={currentUser} />;
      case 'payments': return <Payments currentUser={currentUser} />;
      case 'commissions': return <Commissions currentUser={currentUser} />;
      case 'commission-accounting': return <CommissionAccounting currentUser={currentUser} />;
      case 'disputes': return <Disputes currentUser={currentUser} />;
      case 'quality-inspection': return <QualityInspection currentUser={currentUser} />;
      case 'inventory': return <Inventory currentUser={currentUser} />;
      case 'logistics': return <Logistics currentUser={currentUser} />;
      case 'ledger': return <Ledger currentUser={currentUser} />;
      case 'reconciliation': return <Reconciliation currentUser={currentUser} />;
      case 'business-partners': return <BusinessPartnerManagement currentUser={currentUser} />;
      case 'my-partner-profile': return <MyPartnerProfile userId={currentUser.id} partnerId={currentUser.partnerId || currentUser.id} />;
      case 'partner-registration': return <PartnerRegistration />;
      case 'reports': return <AdvancedReporting currentUser={currentUser} />;
      case 'audit-trail': return <AuditTrail currentUser={currentUser} auditLogs={auditLogs} />;
      case 'user-management': return <UserManagement currentUser={currentUser} />;
      case 'profile-update-approvals': return <ProfileUpdateApprovals />;
      case 'roles-rights': return <RolesAndRights currentUser={currentUser} />;
      case 'settings': return <Settings currentUser={currentUser} addAuditLog={addAuditLog} />;
      case 'grievance-officer': return <GrievanceOfficer currentUser={currentUser} addAuditLog={addAuditLog} />;
      case 'privacy-policy': return <PrivacyPolicy />;
      case 'terms-of-service': return <TermsOfService />;
      default: return <NotFound />;
    }
  };

  return (
    <ErrorBoundary>
      <WebSocketProvider enabled={!!currentUser}>
        <DialogProvider>
          <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 font-sans">
            <Sidebar onNavigate={handleNavigation} activePage={activePage} currentUser={currentUser} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header 
                currentUser={currentUser} 
                onUserChange={setCurrentUser}
                onLogout={handleLogout}
                organizations={organizations}
                currentOrganization={currentOrganization}
                onOrganizationChange={setCurrentOrganization}
                financialYears={financialYears}
                currentFinancialYear={currentFinancialYear}
                onFinancialYearChange={setCurrentFinancialYear}
              />
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 dark:bg-neutral-900 p-8">
                {renderPage()}
              </main>
            </div>
        </div>
      </DialogProvider>
      </WebSocketProvider>
    </ErrorBoundary>
  );
};

export default App;
