/**
 * Seller View - View Matched Trades & Submit Offers
 */

import React, { useState } from 'react';
import { User } from '../../types';
import { useMyTrades, useMyOffers } from '../../hooks/useTradeDesk';
import { Trade, Offer } from '../../types/tradedesk.types';
import TradeList from '../../components/tradedesk/trade/TradeList';
import OfferList from '../../components/tradedesk/offer/OfferList';
import TradeDetailModal from '../../components/tradedesk/trade/TradeDetailModal';
import { Bell, Package } from 'lucide-react';

interface SellerViewProps {
  currentUser: User;
}

const SellerView: React.FC<SellerViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'matched' | 'myoffers'>('matched');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  
  const { trades, loading: tradesLoading, reload: reloadTrades } = useMyTrades(currentUser.id);
  const { offers, loading: offersLoading, reload: reloadOffers } = useMyOffers(currentUser.id);

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200 px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('matched')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'matched' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Matched Trades</span>
              {trades.length > 0 && (
                <span className="px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                  {trades.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('myoffers')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'myoffers' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>My Offers</span>
              {offers.length > 0 && (
                <span className="px-1.5 py-0.5 bg-neutral-200 text-neutral-700 text-xs rounded-full">
                  {offers.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'matched' && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Trades Matched to Your Location & Certificates
            </h2>
            {tradesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : trades.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                <p className="text-lg font-medium text-neutral-900">No matched trades</p>
                <p className="text-sm text-neutral-600 mt-1">
                  You'll be notified when trades matching your location and certificates are posted
                </p>
              </div>
            ) : (
              <TradeList 
                trades={trades}
                onTradeClick={(trade) => setSelectedTrade(trade)}
                showSubmitOfferButton
              />
            )}
          </div>
        )}

        {activeTab === 'myoffers' && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              My Submitted Offers
            </h2>
            {offersLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : offers.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                <p className="text-lg font-medium text-neutral-900">No offers submitted yet</p>
                <p className="text-sm text-neutral-600 mt-1">
                  Submit your first offer on a matched trade
                </p>
              </div>
            ) : (
              <OfferList 
                offers={offers}
                viewMode="seller"
              />
            )}
          </div>
        )}
      </div>

      {/* Trade Detail Modal with Offer Form */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          currentUser={currentUser}
          onClose={() => setSelectedTrade(null)}
          onUpdate={() => {
            reloadTrades();
            reloadOffers();
          }}
          showOfferForm
        />
      )}
    </div>
  );
};

export default SellerView;
