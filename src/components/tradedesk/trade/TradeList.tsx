/**
 * Trade List Component
 */

import React from 'react';
import { Trade } from '../../../types/tradedesk.types';
import { Package, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { getMatchScoreBadgeColor, formatCurrency } from '../../../types/tradedesk.types';

interface TradeListProps {
  trades: Trade[];
  onTradeClick: (trade: Trade) => void;
  showSubmitOfferButton?: boolean;
}

const TradeList: React.FC<TradeListProps> = ({ trades, onTradeClick, showSubmitOfferButton }) => {
  return (
    <div className="space-y-3">
      {trades.map((trade) => (
        <div
          key={trade.tradeId}
          onClick={() => onTradeClick(trade)}
          className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-primary-300 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-neutral-900">
                  {trade.commodity.name}
                </h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  trade.status === 'POSTED' ? 'bg-blue-100 text-blue-700' :
                  trade.status === 'OFFERS_RECEIVED' ? 'bg-purple-100 text-purple-700' :
                  trade.status === 'NEGOTIATION' ? 'bg-yellow-100 text-yellow-700' :
                  trade.status === 'AGREED' ? 'bg-green-100 text-green-700' :
                  'bg-neutral-100 text-neutral-700'
                }`}>
                  {trade.status.replace('_', ' ')}
                </span>
                {trade.urgency === 'urgent' && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    URGENT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>{trade.quantity} {trade.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {trade.location.station?.name || trade.location.region?.name || trade.location.state.name}
                  </span>
                </div>
                {trade.targetPrice && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{formatCurrency(trade.targetPrice)}</span>
                  </div>
                )}
              </div>
            </div>
            {trade.bestMatchScore && (
              <div className={`px-2 py-1 rounded-lg text-sm font-semibold ${getMatchScoreBadgeColor(trade.bestMatchScore)}`}>
                {trade.bestMatchScore}%
              </div>
            )}
          </div>

          {trade.offersCount > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-sm text-neutral-600">
                {trade.offersCount} {trade.offersCount === 1 ? 'offer' : 'offers'} received
              </span>
              {!showSubmitOfferButton && (
                <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  View Offers →
                </button>
              )}
            </div>
          )}

          {showSubmitOfferButton && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm">
                Submit Offer
              </button>
            </div>
          )}

          <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
            <Calendar className="w-3 h-3" />
            <span>Posted {new Date(trade.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TradeList;
