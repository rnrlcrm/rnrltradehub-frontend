/**
 * Offer List Component
 */

import React from 'react';
import { Offer } from '../../../types/tradedesk.types';
import { getMatchScoreLabel, getMatchScoreBadgeColor, formatCurrency, formatTimeRemaining } from '../../../types/tradedesk.types';
import { Star, Clock, FileText, TrendingUp, MapPin } from 'lucide-react';

interface OfferListProps {
  offers: Offer[];
  viewMode: 'buyer' | 'seller';
  onOfferClick?: (offer: Offer) => void;
  onAccept?: (offer: Offer) => void;
  onCounter?: (offer: Offer) => void;
  onReject?: (offer: Offer) => void;
}

const OfferList: React.FC<OfferListProps> = ({ 
  offers, 
  viewMode,
  onOfferClick,
  onAccept,
  onCounter,
  onReject 
}) => {
  // Sort by match score (highest first)
  const sortedOffers = [...offers].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="space-y-4">
      {sortedOffers.map((offer, index) => (
        <div
          key={offer.offerId}
          className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {index === 0 && offer.matchScore >= 90 && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                    🏆 TOP MATCH
                  </span>
                )}
                <h3 className="font-semibold text-neutral-900">
                  {viewMode === 'buyer' ? offer.seller.name : `Offer #${offer.offerId}`}
                </h3>
                {viewMode === 'buyer' && (
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{offer.seller.rating}</span>
                  </div>
                )}
              </div>
              {viewMode === 'buyer' && (
                <p className="text-sm text-neutral-600">
                  {offer.seller.completedTrades} completed trades
                </p>
              )}
            </div>
            <div className={`px-3 py-1.5 rounded-lg font-bold ${getMatchScoreBadgeColor(offer.matchScore)}`}>
              {offer.matchScore}%
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-neutral-600 mb-1">Price</div>
              <div className="font-semibold text-neutral-900">
                {formatCurrency(offer.price)}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-600 mb-1">Quantity</div>
              <div className="font-semibold text-neutral-900">
                {offer.quantity} {offer.unit}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-600 mb-1">Location</div>
              <div className="font-semibold text-neutral-900 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {offer.station.name}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-600 mb-1">Valid Until</div>
              <div className="font-semibold text-red-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeRemaining(offer.validUntil)}
              </div>
            </div>
          </div>

          {/* Match Breakdown */}
          <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
            <div className="text-xs font-medium text-neutral-700 mb-2">Match Breakdown:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <div className="text-xs text-neutral-600">Parameters</div>
                <div className="font-semibold text-sm">{offer.matchBreakdown.parameterScore}%</div>
              </div>
              <div>
                <div className="text-xs text-neutral-600">Price</div>
                <div className="font-semibold text-sm">{offer.matchBreakdown.priceScore}%</div>
              </div>
              <div>
                <div className="text-xs text-neutral-600">Location</div>
                <div className="font-semibold text-sm">{offer.matchBreakdown.locationScore}%</div>
              </div>
              <div>
                <div className="text-xs text-neutral-600">Payment</div>
                <div className="font-semibold text-sm">{offer.matchBreakdown.paymentScore}%</div>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="mb-4">
            <div className="text-xs font-medium text-neutral-700 mb-2">Quality Parameters:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(offer.parameters).map(([key, value]) => (
                <span key={key} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>

          {/* Test Report */}
          {offer.testReportUrl && (
            <div className="mb-4">
              <a
                href={offer.testReportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <FileText className="w-4 h-4" />
                <span>View Test Report</span>
              </a>
            </div>
          )}

          {/* Notes */}
          {offer.notes && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-xs font-medium text-yellow-800 mb-1">Seller Notes:</div>
              <p className="text-sm text-yellow-900">{offer.notes}</p>
            </div>
          )}

          {/* Actions */}
          {viewMode === 'buyer' && offer.status === 'PENDING' && (
            <div className="flex gap-2 pt-4 border-t border-neutral-200">
              <button
                onClick={() => onAccept?.(offer)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Accept
              </button>
              <button
                onClick={() => onCounter?.(offer)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Counter
              </button>
              <button
                onClick={() => onReject?.(offer)}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 font-medium"
              >
                Reject
              </button>
            </div>
          )}

          {viewMode === 'seller' && (
            <div className="pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  offer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                  offer.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  offer.status === 'COUNTERED' ? 'bg-blue-100 text-blue-700' :
                  'bg-neutral-100 text-neutral-700'
                }`}>
                  {offer.status}
                </span>
                {offer.negotiationVersions > 1 && (
                  <span className="text-sm text-neutral-600">
                    {offer.negotiationVersions} negotiation rounds
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OfferList;
