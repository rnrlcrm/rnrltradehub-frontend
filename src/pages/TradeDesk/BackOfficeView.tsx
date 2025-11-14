/**
 * Back Office Dashboard View
 */

import React from 'react';
import { User } from '../../types';
import { useDashboard } from '../../hooks/useTradeDesk';
import { TrendingUp, ShoppingCart, MessageCircle, CheckCircle, XCircle } from 'lucide-react';

interface BackOfficeViewProps {
  currentUser: User;
}

const BackOfficeView: React.FC<BackOfficeViewProps> = ({ currentUser }) => {
  const { summary, trades, loading } = useDashboard(1); // orgId = 1 for now

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Back Office Dashboard</h1>

        {/* Stats Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Posted</span>
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{summary.postedCount}</div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Offers Received</span>
                <MessageCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{summary.offersReceivedCount}</div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Negotiating</span>
                <TrendingUp className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{summary.negotiatingCount}</div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Agreed</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{summary.agreedCount}</div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Completed</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{summary.completedCount}</div>
            </div>
          </div>
        )}

        {/* Trades Table */}
        <div className="bg-white rounded-lg border border-neutral-200">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">All Trades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Trade ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Buyer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Commodity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Offers</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Match Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {trades.map((trade) => (
                  <tr key={trade.tradeId} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900">#{trade.tradeId}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{trade.buyer.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{trade.commodity.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{trade.quantity}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {trade.location.state}
                      {trade.location.region && `, ${trade.location.region}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        trade.status === 'POSTED' ? 'bg-blue-100 text-blue-700' :
                        trade.status === 'OFFERS_RECEIVED' ? 'bg-purple-100 text-purple-700' :
                        trade.status === 'NEGOTIATION' ? 'bg-yellow-100 text-yellow-700' :
                        trade.status === 'AGREED' ? 'bg-green-100 text-green-700' :
                        'bg-neutral-100 text-neutral-700'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{trade.offersCount}</td>
                    <td className="px-4 py-3">
                      {trade.bestMatchScore && (
                        <span className={`text-sm font-medium ${
                          trade.bestMatchScore >= 90 ? 'text-green-600' :
                          trade.bestMatchScore >= 75 ? 'text-blue-600' :
                          trade.bestMatchScore >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {trade.bestMatchScore}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackOfficeView;
