/**
 * Trade Desk Main Page
 * 
 * Routes to appropriate view based on user role:
 * - Buyer Partner: BuyerView (create trades, view offers)
 * - Seller Partner: SellerView (view matched trades, submit offers)
 * - Sales/Admin: Dashboard view (back-office oversight)
 * - Trader: Both buyer and seller capabilities
 */

import React, { useState } from 'react';
import { User } from '../../types';
import BuyerView from './BuyerView';
import SellerView from './SellerView';
import BackOfficeView from './BackOfficeView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/shadcn/tabs';

interface TradeDeskProps {
  currentUser: User;
}

const TradeDesk: React.FC<TradeDeskProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<string>('buyer');

  // Determine user capabilities based on role
  const canBuy = ['Buyer Partner', 'Trader', 'Admin', 'Sales'].includes(currentUser.role);
  const canSell = ['Seller Partner', 'Trader', 'Admin'].includes(currentUser.role);
  const canViewDashboard = ['Admin', 'Sales'].includes(currentUser.role);

  // If only one capability, show that view directly
  if (canViewDashboard && !canBuy && !canSell) {
    return <BackOfficeView currentUser={currentUser} />;
  }

  if (canBuy && !canSell && !canViewDashboard) {
    return <BuyerView currentUser={currentUser} />;
  }

  if (canSell && !canBuy && !canViewDashboard) {
    return <SellerView currentUser={currentUser} />;
  }

  // Multiple capabilities - show tabs
  return (
    <div className="h-full flex flex-col bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Trade Desk</h1>
            <p className="text-sm text-neutral-600 mt-1">
              AI-powered commodity trading platform
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b border-neutral-200 px-6">
          <TabsList className="bg-transparent border-b-0">
            {canBuy && (
              <TabsTrigger 
                value="buyer" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary-500 rounded-none"
              >
                Buy / Create Demand
              </TabsTrigger>
            )}
            {canSell && (
              <TabsTrigger 
                value="seller"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary-500 rounded-none"
              >
                Sell / Submit Offers
              </TabsTrigger>
            )}
            {canViewDashboard && (
              <TabsTrigger 
                value="dashboard"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary-500 rounded-none"
              >
                Back Office Dashboard
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {canBuy && (
            <TabsContent value="buyer" className="h-full mt-0">
              <BuyerView currentUser={currentUser} />
            </TabsContent>
          )}
          {canSell && (
            <TabsContent value="seller" className="h-full mt-0">
              <SellerView currentUser={currentUser} />
            </TabsContent>
          )}
          {canViewDashboard && (
            <TabsContent value="dashboard" className="h-full mt-0">
              <BackOfficeView currentUser={currentUser} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default TradeDesk;
