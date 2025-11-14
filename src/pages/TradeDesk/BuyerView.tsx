/**
 * Buyer View - Create Trades via Chat & View Offers
 */

import React, { useState } from 'react';
import { User } from '../../types';
import ChatInterface from '../../components/tradedesk/chat/ChatInterface';
import TradeList from '../../components/tradedesk/trade/TradeList';
import TradeDetailModal from '../../components/tradedesk/trade/TradeDetailModal';
import { useMyTrades } from '../../hooks/useTradeDesk';
import { Trade } from '../../types/tradedesk.types';
import { MessageSquare, ListChecks } from 'lucide-react';

interface BuyerViewProps {
  currentUser: User;
}

const BuyerView: React.FC<BuyerViewProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<'chat' | 'trades'>('chat');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  
  const { trades, loading, reload } = useMyTrades(currentUser.id);

  const handleTradeCreated = () => {
    reload();
    setActiveView('trades');
  };

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
  };

  return (
    <div className="h-full flex">
      {/* Chat Panel - Left Side */}
      <div className={`${activeView === 'chat' ? 'flex' : 'hidden md:flex'} flex-col bg-white border-r border-neutral-200 w-full md:w-96 lg:w-[28rem]`}>
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-neutral-900">AI Assistant</h2>
          </div>
          <p className="text-xs text-neutral-600 mt-1">
            Tell me what you need, and I'll help create your trade requirement
          </p>
        </div>
        
        <ChatInterface 
          currentUser={currentUser}
          onTradeCreated={handleTradeCreated}
        />
      </div>

      {/* Trade List Panel - Right Side */}
      <div className={`${activeView === 'trades' ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-neutral-50`}>
        <div className="p-4 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-neutral-900">My Trades</h2>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                {trades.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
              <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No trades yet</p>
              <p className="text-sm mt-1">Start chatting to create your first trade</p>
            </div>
          ) : (
            <TradeList 
              trades={trades}
              onTradeClick={handleTradeClick}
            />
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex">
        <button
          onClick={() => setActiveView('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 ${
            activeView === 'chat' ? 'text-primary-600 border-t-2 border-primary-600' : 'text-neutral-600'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">Chat</span>
        </button>
        <button
          onClick={() => setActiveView('trades')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 ${
            activeView === 'trades' ? 'text-primary-600 border-t-2 border-primary-600' : 'text-neutral-600'
          }`}
        >
          <ListChecks className="w-5 h-5" />
          <span className="text-sm font-medium">Trades ({trades.length})</span>
        </button>
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          currentUser={currentUser}
          onClose={() => setSelectedTrade(null)}
          onUpdate={reload}
        />
      )}
    </div>
  );
};

export default BuyerView;
