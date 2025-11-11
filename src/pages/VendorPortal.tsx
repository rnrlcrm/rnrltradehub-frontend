import React from 'react';
import { useUser } from '../contexts/UserContext';
import { MyTeamManagement } from '../components/portal/MyTeamManagement';

export const VendorPortal: React.FC = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Vendor Portal</h1>
            <div className="text-sm text-gray-600">
              Welcome, {user?.name}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Supply Contracts</h3>
            <p className="text-3xl font-bold text-blue-600">8</p>
            <p className="text-sm text-gray-500 mt-2">Active supplies</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Deliveries</h3>
            <p className="text-3xl font-bold text-orange-600">5</p>
            <p className="text-sm text-gray-500 mt-2">Due this week</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoices</h3>
            <p className="text-3xl font-bold text-green-600">₹5.2L</p>
            <p className="text-sm text-gray-500 mt-2">Submitted this month</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Deliveries</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Delivery #DL-2024-015</p>
                  <p className="text-sm text-gray-600">50 bales to Client ABC</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  In Transit
                </span>
              </div>
            </div>
          </div>
        </div>

        <MyTeamManagement />
      </main>
    </div>
  );
};
