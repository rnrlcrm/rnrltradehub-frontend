
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { mockSalesContracts } from '../data/mockData';
import { useGemini } from '../hooks/useGemini';
import { AIIcon, LoadingSpinner } from '../components/ui/icons';
import { Button } from '../components/ui/Form';
import { User } from '../types';
import Modal from '../components/ui/Modal';

interface DashboardProps {
    currentUser: User;
    onCarryForward: () => void;
}

const StatCard: React.FC<{ title: string; value: string; change?: string; changeType?: 'increase' | 'decrease' }> = ({ title, value, change, changeType }) => (
  <Card className="!shadow-sm">
    <h4 className="text-sm font-semibold text-slate-500 truncate uppercase tracking-wider">{title}</h4>
    <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
    {change && (
      <p className={`mt-1 text-sm flex items-center ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
        {changeType === 'increase' ? 
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg> :
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        }
        {change}
      </p>
    )}
  </Card>
);

const Dashboard: React.FC<DashboardProps> = ({ currentUser, onCarryForward }) => {
  const totalSalesValue = mockSalesContracts.reduce((acc, c) => acc + c.rate * c.quantityBales, 0);
  const activeContracts = mockSalesContracts.filter(c => c.status === 'Active').length;
  const disputedContracts = mockSalesContracts.filter(c => c.status === 'Disputed').length;

  const { status, response, error, generateContent } = useGemini();
  const [query, setQuery] = useState('');
  const [isCarryForwardModalOpen, setIsCarryForwardModalOpen] = useState(false);

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      generateContent(query);
    }
  };

  const handleConfirmCarryForward = () => {
    onCarryForward();
    setIsCarryForwardModalOpen(false);
  };

  return (
    <>
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Sales Value" value={`₹${(totalSalesValue / 10000000).toFixed(2)} Cr`} change="+5.4%" changeType="increase" />
        <StatCard title="Active Contracts" value={String(activeContracts)} change="-2" changeType="decrease" />
        <StatCard title="Disputed Contracts" value={String(disputedContracts)} />
      </div>

      {currentUser.role === 'Admin' && (
        <Card title="Year-End Operations">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-slate-800">Carry Forward Balances</h4>
                    <p className="text-sm text-slate-600 mt-1">Simulate the year-end process by carrying forward all active and disputed contracts from the previous FY to the current FY.</p>
                </div>
                <Button onClick={() => setIsCarryForwardModalOpen(true)}>Initiate Carry Forward</Button>
            </div>
        </Card>
      )}

      <Card title="AI Data Analyst" actions={<AIIcon className="w-6 h-6 text-blue-600" />}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Ask a question about your ERP data. The AI will analyze sales, vendors, invoices, and more to provide an answer.
          </p>
          <form onSubmit={handleQuerySubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'Summarize all disputed contracts' or 'Who is our top client by sales value?'"
              className="w-full px-3 py-2 border border-slate-300 rounded-none shadow-sm focus:outline-none focus:ring-0 focus:border-blue-500"
              disabled={status === 'loading'}
            />
            <Button type="submit" disabled={status === 'loading' || !query.trim()}>
              {status === 'loading' ? <LoadingSpinner className="w-5 h-5" /> : 'Ask'}
            </Button>
          </form>

          {status !== 'idle' && (
            <div className="mt-4 p-4 bg-slate-50 rounded-none border border-slate-200">
              {status === 'loading' && (
                <div className="flex items-center text-slate-600">
                  <LoadingSpinner className="w-5 h-5 mr-3" />
                  <span>Analyzing data and generating response...</span>
                </div>
              )}
              {status === 'error' && <p className="text-red-600 font-medium">{error}</p>}
              {status === 'success' && (
                <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') }} />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
    <Modal isOpen={isCarryForwardModalOpen} onClose={() => setIsCarryForwardModalOpen(false)} title="Confirm Carry Forward Operation">
        <div>
            <p className="text-slate-700">Are you sure you want to proceed? This action will:</p>
            <ul className="list-disc list-inside my-4 text-slate-600 space-y-1">
                <li>Identify all 'Active' and 'Disputed' contracts from the previous financial year.</li>
                <li>Create new corresponding contracts in the current financial year.</li>
                <li>Mark the old contracts as 'Carried Forward'.</li>
            </ul>
            <p className="font-semibold text-red-600">This is a simulation and the action cannot be undone within this session.</p>
        </div>
        <div className="bg-slate-50 px-6 py-3 mt-6 -mx-6 -mb-6 border-t border-slate-200 flex flex-row-reverse items-center">
            <Button onClick={handleConfirmCarryForward}>Confirm & Proceed</Button>
            <Button variant="secondary" onClick={() => setIsCarryForwardModalOpen(false)}>Cancel</Button>
        </div>
    </Modal>
    </>
  );
};

export default Dashboard;
