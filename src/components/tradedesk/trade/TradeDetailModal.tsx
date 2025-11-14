/**
 * Trade Detail Modal Component
 */

import React from 'react';
import { Trade } from '../../../types/tradedesk.types';
import { User } from '../../../types';
import { useTradeOffers } from '../../../hooks/useTradeDesk';
import OfferList from '../offer/OfferList';
import { X, Package, MapPin, Calendar, FileText } from 'lucide-react';

interface TradeDetailModalProps {
  trade: Trade;
  currentUser: User;
  onClose: () => void;
  onUpdate: () => void;
  showOfferForm?: boolean;
}

const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  trade,
  currentUser,
  onClose,
  onUpdate,
  showOfferForm
}) => {
  const { offers, loading } = useTradeOffers(trade.tradeId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Trade #{trade.tradeId} - {trade.commodity.name}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              {trade.buyer.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Trade Details */}
          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-neutral-900 mb-3">Trade Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-neutral-600 mb-1">Quantity</div>
                <div className="font-medium flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {trade.quantity} {trade.unit}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-600 mb-1">Location</div>
                <div className="font-medium flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {trade.location.station?.name || trade.location.region?.name || trade.location.state.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-600 mb-1">Posted</div>
                <div className="font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(trade.createdAt).toLocaleDateString()}
                </div>
              </div>
              {trade.variety && (
                <div>
                  <div className="text-xs text-neutral-600 mb-1">Variety</div>
                  <div className="font-medium">{trade.variety.name}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-neutral-600 mb-1">Delivery</div>
                <div className="font-medium">{trade.deliveryTerm.name}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-600 mb-1">Payment</div>
                <div className="font-medium">{trade.paymentTerm.name}</div>
              </div>
            </div>

            {/* Parameters */}
            <div className="mt-4">
              <div className="text-xs text-neutral-600 mb-2">Quality Parameters:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(trade.parameters).map(([key, range]) => (
                  <span key={key} className="px-2 py-1 bg-white border border-neutral-200 text-sm rounded">
                    {key}: {range.min}-{range.max}
                  </span>
                ))}
              </div>
            </div>

            {/* Certificates */}
            {trade.certificates.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-neutral-600 mb-2">Required Certificates:</div>
                <div className="flex flex-wrap gap-2">
                  {trade.certificates.map((cert) => (
                    <span key={cert} className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {trade.notes && (
              <div className="mt-4">
                <div className="text-xs text-neutral-600 mb-1">Notes:</div>
                <p className="text-sm text-neutral-900">{trade.notes}</p>
              </div>
            )}
          </div>

          {/* Offers */}
          {!showOfferForm && (
            <div>
              <h3 className="font-semibold text-neutral-900 mb-3">
                Offers Received ({offers.length})
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No offers yet</p>
                </div>
              ) : (
                <OfferList
                  offers={offers}
                  viewMode="buyer"
                  onAccept={(offer) => {
                    console.log('Accept offer:', offer);
                    onUpdate();
                  }}
                  onCounter={(offer) => {
                    console.log('Counter offer:', offer);
                  }}
                  onReject={(offer) => {
                    console.log('Reject offer:', offer);
                    onUpdate();
                  }}
                />
              )}
            </div>
          )}

          {/* Offer Form for Seller */}
          {showOfferForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Submit Your Offer</h3>
              <p className="text-sm text-blue-700 mb-4">
                Offer form will appear here. Fill in your price, quantity, and quality parameters.
              </p>
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                Submit Offer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeDetailModal;
