/**
 * CCI Calculation Display Component
 * 
 * Displays calculated values from CCI Setting Master for a contract or invoice
 * 
 * Important: All amounts passed should be EXCLUDING GST as per CCI rules:
 * - EMD: Calculated on invoice excl GST, NO GST charged on EMD
 * - Carrying/Late Lifting: Reconciliation on final invoice excl GST
 * - EMD Interest/Cash Discount: On amount paid excl GST
 */

import React from 'react';
import { CciTerm } from '../../types';
import {
  calculateEmdAmount,
  calculateCarryingCharge,
  calculateLateLiftingCharge,
  calculateMoistureAdjustment,
  calculateGst,
  getCciSettingVersionInfo
} from '../../utils/cciCalculations';

interface CciCalculationDisplayProps {
  cciSetting: CciTerm;
  invoiceAmountExclGst: number; // Invoice amount EXCLUDING GST
  buyerType: 'kvic' | 'privateMill' | 'trader';
  daysHeld?: number;
  daysLate?: number;
  averageMoisture?: number;
  netDeliveryWeight?: number;
  saleRatePerQuintal?: number;
}

const CciCalculationDisplay: React.FC<CciCalculationDisplayProps> = ({
  cciSetting,
  invoiceAmountExclGst,
  buyerType,
  daysHeld = 0,
  daysLate = 0,
  averageMoisture,
  netDeliveryWeight,
  saleRatePerQuintal
}) => {
  // Calculate EMD (on amount excl GST, NO GST on EMD)
  const emdAmount = calculateEmdAmount(cciSetting, invoiceAmountExclGst, buyerType);
  
  // Calculate carrying charges if applicable (on amount excl GST)
  const carryingCharge = daysHeld > 0 
    ? calculateCarryingCharge(cciSetting, invoiceAmountExclGst, daysHeld)
    : 0;
  
  // Calculate late lifting charges if applicable (on amount excl GST)
  const lateLiftingCharge = daysLate > 0
    ? calculateLateLiftingCharge(cciSetting, invoiceAmountExclGst, daysLate)
    : 0;
  
  // Calculate moisture adjustment if data available
  const moistureAdjustment = averageMoisture && netDeliveryWeight && saleRatePerQuintal
    ? calculateMoistureAdjustment(cciSetting, averageMoisture, netDeliveryWeight, saleRatePerQuintal)
    : null;
  
  // Calculate final amounts
  let adjustedInvoice = invoiceAmountExclGst;
  if (moistureAdjustment) {
    if (moistureAdjustment.type === 'discount') {
      adjustedInvoice -= moistureAdjustment.amount;
    } else if (moistureAdjustment.type === 'premium') {
      adjustedInvoice += moistureAdjustment.amount;
    }
  }
  
  const gstAmount = calculateGst(cciSetting, adjustedInvoice);
  const totalAmount = adjustedInvoice + gstAmount;
  
  const currencyFormat = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-4">
      {/* CCI Setting Info */}
      <div className="border-b pb-2">
        <h4 className="text-sm font-semibold text-slate-700">CCI Setting Used</h4>
        <p className="text-xs text-slate-600">{getCciSettingVersionInfo(cciSetting)}</p>
      </div>

      {/* Calculations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Base Invoice */}
        <div className="bg-white rounded p-3 shadow-sm">
          <div className="text-xs text-slate-500">Base Invoice Amount (excl GST)</div>
          <div className="text-lg font-semibold text-slate-800">{currencyFormat(invoiceAmountExclGst)}</div>
        </div>

        {/* EMD */}
        <div className="bg-white rounded p-3 shadow-sm">
          <div className="text-xs text-slate-500">
            EMD ({cciSetting.emd_by_buyer_type[buyerType]}% - {buyerType})
          </div>
          <div className="text-lg font-semibold text-blue-600">{currencyFormat(emdAmount)}</div>
          <div className="text-xs text-slate-500 mt-1">
            Due within {cciSetting.emd_payment_days} days (NO GST on EMD)
          </div>
        </div>

        {/* Carrying Charges */}
        {daysHeld > 0 && (
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-xs text-slate-500">Carrying Charges</div>
            <div className="text-lg font-semibold text-orange-600">{currencyFormat(carryingCharge)}</div>
            <div className="text-xs text-slate-500 mt-1">{daysHeld} days held (on excl GST)</div>
          </div>
        )}

        {/* Late Lifting */}
        {daysLate > 0 && (
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-xs text-slate-500">Late Lifting Charges</div>
            <div className="text-lg font-semibold text-red-600">{currencyFormat(lateLiftingCharge)}</div>
            <div className="text-xs text-slate-500 mt-1">{daysLate} days late (on excl GST)</div>
          </div>
        )}

        {/* Moisture Adjustment */}
        {moistureAdjustment && moistureAdjustment.type !== 'none' && (
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-xs text-slate-500">
              Moisture {moistureAdjustment.type === 'discount' ? 'Discount' : 'Premium'}
            </div>
            <div className={`text-lg font-semibold ${
              moistureAdjustment.type === 'discount' ? 'text-green-600' : 'text-amber-600'
            }`}>
              {moistureAdjustment.type === 'discount' ? '- ' : '+ '}
              {currencyFormat(moistureAdjustment.amount)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Average: {averageMoisture}% (Range: {cciSetting.moisture_lower_limit}%-{cciSetting.moisture_upper_limit}%)
            </div>
          </div>
        )}

        {/* GST */}
        <div className="bg-white rounded p-3 shadow-sm">
          <div className="text-xs text-slate-500">GST ({cciSetting.gst_rate}%)</div>
          <div className="text-lg font-semibold text-slate-700">{currencyFormat(gstAmount)}</div>
        </div>

        {/* Total */}
        <div className="bg-blue-50 rounded p-3 shadow-sm border border-blue-200">
          <div className="text-xs text-blue-600 font-medium">Total Invoice Amount</div>
          <div className="text-xl font-bold text-blue-800">{currencyFormat(totalAmount)}</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="border-t pt-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Candy Factor:</span>
            <span className="ml-1 font-medium">{cciSetting.candy_factor}</span>
          </div>
          <div>
            <span className="text-slate-500">Contract Period:</span>
            <span className="ml-1 font-medium">{cciSetting.contract_period_days} days</span>
          </div>
          <div>
            <span className="text-slate-500">Free Lifting:</span>
            <span className="ml-1 font-medium">{cciSetting.free_lifting_period_days} days</span>
          </div>
          <div>
            <span className="text-slate-500">Cash Discount:</span>
            <span className="ml-1 font-medium">{cciSetting.cash_discount_percentage}% p.a.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CciCalculationDisplay;
