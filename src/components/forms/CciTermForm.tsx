
import React, { useState, useEffect } from 'react';
import { CciTerm } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface CciTermFormProps {
  item: CciTerm | null;
  onSave: (data: Omit<CciTerm, 'id'>) => void;
  onCancel: () => void;
}

const CciTermForm: React.FC<CciTermFormProps> = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<CciTerm, 'id'>>({
    name: 'New CCI Term',
    
    // Versioning
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: undefined,
    version: 1,
    isActive: true,
    
    // Core Financial Parameters
    candy_factor: 0.2812,
    gst_rate: 5,
    
    // EMD Configuration
    emd_by_buyer_type: {
      kvic: 10,
      privateMill: 12.5,
      trader: 17.5,
    },
    emd_payment_days: 5,
    emd_interest_percent: 5,
    emd_late_interest_percent: 10,
    
    // Carrying Charges
    carrying_charge_tier1_days: 30,
    carrying_charge_tier1_percent: 1.25,
    carrying_charge_tier2_days: 60,
    carrying_charge_tier2_percent: 1.35,
    
    // Late Lifting Charges
    free_lifting_period_days: 21,
    late_lifting_tier1_days: 30,
    late_lifting_tier1_percent: 0.5,
    late_lifting_tier2_days: 60,
    late_lifting_tier2_percent: 0.75,
    late_lifting_tier3_percent: 1.0,
    
    // Payment & Discount Terms
    cash_discount_percentage: 5,
    
    // Interest Rates
    interest_lc_bg_percent: 10,
    penal_interest_lc_bg_percent: 11,
    
    // Additional Deposits
    additional_deposit_percent: 10,
    deposit_interest_percent: 5,
    
    // Lifting & Contract Period
    lifting_period_days: 45,
    contract_period_days: 45,
    
    // Lock-in Period Charges
    lockin_charge_min: 350,
    lockin_charge_max: 700,
    
    // Moisture Adjustment Parameters
    moisture_lower_limit: 7,
    moisture_upper_limit: 9,
    moisture_sample_count: 10,
    
    // Email Configuration
    email_reminder_days: 5,
    email_template_emd_reminder: '<p>Dear Partner, This is a reminder that EMD payment is due within {days} days.</p>',
    email_template_payment_due: '<p>Dear Partner, Payment for invoice {invoice_no} is now due.</p>',
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle nested emd_by_buyer_type
    if (name.startsWith('emd_by_buyer_type.')) {
      const buyerType = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emd_by_buyer_type: {
          ...prev.emd_by_buyer_type,
          [buyerType]: parseFloat(value)
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
      <div className="space-y-6">
        {/* General Information */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">General Information</h4>
          <FormRow>
            <FormLabel htmlFor="name">Term Name</FormLabel>
            <FormInput id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="effectiveFrom">Effective From</FormLabel>
            <FormInput id="effectiveFrom" name="effectiveFrom" type="date" value={formData.effectiveFrom} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="effectiveTo">Effective To (Optional)</FormLabel>
            <FormInput id="effectiveTo" name="effectiveTo" type="date" value={formData.effectiveTo || ''} onChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="version">Version</FormLabel>
            <FormInput id="version" name="version" type="number" value={formData.version} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="isActive">Active Status</FormLabel>
            <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4" />
          </FormRow>
        </div>

        {/* Core Financial Parameters */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Core Financial Parameters</h4>
          <FormRow>
            <FormLabel htmlFor="candy_factor">Candy Factor (Quintal to Candy)</FormLabel>
            <FormInput id="candy_factor" name="candy_factor" type="number" step="0.0001" value={formData.candy_factor} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="gst_rate">GST Rate (%)</FormLabel>
            <FormInput id="gst_rate" name="gst_rate" type="number" step="0.01" value={formData.gst_rate} onChange={handleChange} required />
          </FormRow>
        </div>

        {/* EMD Configuration */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">EMD Configuration</h4>
          <FormRow>
            <FormLabel htmlFor="emd_by_buyer_type.kvic">EMD % - KVIC</FormLabel>
            <FormInput id="emd_by_buyer_type.kvic" name="emd_by_buyer_type.kvic" type="number" step="0.01" value={formData.emd_by_buyer_type.kvic} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="emd_by_buyer_type.privateMill">EMD % - Private Mill</FormLabel>
            <FormInput id="emd_by_buyer_type.privateMill" name="emd_by_buyer_type.privateMill" type="number" step="0.01" value={formData.emd_by_buyer_type.privateMill} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="emd_by_buyer_type.trader">EMD % - Trader</FormLabel>
            <FormInput id="emd_by_buyer_type.trader" name="emd_by_buyer_type.trader" type="number" step="0.01" value={formData.emd_by_buyer_type.trader} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="emd_payment_days">EMD Payment Due (Days)</FormLabel>
            <FormInput id="emd_payment_days" name="emd_payment_days" type="number" value={formData.emd_payment_days} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="emd_interest_percent">EMD Interest (% p.a.)</FormLabel>
            <FormInput id="emd_interest_percent" name="emd_interest_percent" type="number" step="0.01" value={formData.emd_interest_percent} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="emd_late_interest_percent">EMD Late Interest (% p.a.)</FormLabel>
            <FormInput id="emd_late_interest_percent" name="emd_late_interest_percent" type="number" step="0.01" value={formData.emd_late_interest_percent} onChange={handleChange} required />
          </FormRow>
        </div>

        {/* Carrying Charges */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Carrying Charges</h4>
          <FormRow>
            <FormLabel htmlFor="carrying_charge_tier1_percent">Tier 1: Charge (% per month) for first</FormLabel>
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <FormInput id="carrying_charge_tier1_percent" name="carrying_charge_tier1_percent" type="number" step="0.01" value={formData.carrying_charge_tier1_percent} onChange={handleChange} required className="!md:col-span-1" />
              <FormInput id="carrying_charge_tier1_days" name="carrying_charge_tier1_days" type="number" value={formData.carrying_charge_tier1_days} onChange={handleChange} required placeholder="days" className="!md:col-span-1" />
            </div>
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="carrying_charge_tier2_percent">Tier 2: Charge (% per month) for next</FormLabel>
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <FormInput id="carrying_charge_tier2_percent" name="carrying_charge_tier2_percent" type="number" step="0.01" value={formData.carrying_charge_tier2_percent} onChange={handleChange} required className="!md:col-span-1" />
              <FormInput id="carrying_charge_tier2_days" name="carrying_charge_tier2_days" type="number" value={formData.carrying_charge_tier2_days} onChange={handleChange} required placeholder="days" className="!md:col-span-1" />
            </div>
          </FormRow>
        </div>

        {/* Late Lifting Charges */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Late Lifting Charges</h4>
          <FormRow>
            <FormLabel htmlFor="free_lifting_period_days">Free Lifting Period (Days)</FormLabel>
            <FormInput id="free_lifting_period_days" name="free_lifting_period_days" type="number" value={formData.free_lifting_period_days} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="late_lifting_tier1_percent">Tier 1: Charge (% per month) for first</FormLabel>
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <FormInput id="late_lifting_tier1_percent" name="late_lifting_tier1_percent" type="number" step="0.01" value={formData.late_lifting_tier1_percent} onChange={handleChange} required className="!md:col-span-1" />
              <FormInput id="late_lifting_tier1_days" name="late_lifting_tier1_days" type="number" value={formData.late_lifting_tier1_days} onChange={handleChange} required placeholder="days" className="!md:col-span-1" />
            </div>
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="late_lifting_tier2_percent">Tier 2: Charge (% per month) for next</FormLabel>
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <FormInput id="late_lifting_tier2_percent" name="late_lifting_tier2_percent" type="number" step="0.01" value={formData.late_lifting_tier2_percent} onChange={handleChange} required className="!md:col-span-1" />
              <FormInput id="late_lifting_tier2_days" name="late_lifting_tier2_days" type="number" value={formData.late_lifting_tier2_days} onChange={handleChange} required placeholder="days" className="!md:col-span-1" />
            </div>
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="late_lifting_tier3_percent">Tier 3: Charge (% per month) thereafter</FormLabel>
            <FormInput id="late_lifting_tier3_percent" name="late_lifting_tier3_percent" type="number" step="0.01" value={formData.late_lifting_tier3_percent} onChange={handleChange} required />
          </FormRow>
        </div>

        {/* Payment Terms & Discounts */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Payment Terms & Discounts</h4>
          <FormRow>
            <FormLabel htmlFor="cash_discount_percentage">Cash Discount (% p.a.)</FormLabel>
            <FormInput id="cash_discount_percentage" name="cash_discount_percentage" type="number" step="0.01" value={formData.cash_discount_percentage} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="contract_period_days">Contract Period (Days)</FormLabel>
            <FormInput id="contract_period_days" name="contract_period_days" type="number" value={formData.contract_period_days} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="lifting_period_days">Lifting Period (Days)</FormLabel>
            <FormInput id="lifting_period_days" name="lifting_period_days" type="number" value={formData.lifting_period_days} onChange={handleChange} required />
          </FormRow>
        </div>

        {/* Interest Rates */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Interest Rates</h4>
          <FormRow>
            <FormLabel htmlFor="interest_lc_bg_percent">LC/BG Interest (% p.a.)</FormLabel>
            <FormInput id="interest_lc_bg_percent" name="interest_lc_bg_percent" type="number" step="0.01" value={formData.interest_lc_bg_percent} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="penal_interest_lc_bg_percent">LC/BG Penal Interest (% p.a.)</FormLabel>
            <FormInput id="penal_interest_lc_bg_percent" name="penal_interest_lc_bg_percent" type="number" step="0.01" value={formData.penal_interest_lc_bg_percent} onChange={handleChange} required />
          </FormRow>
        </div>

        {/* Additional Deposits */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Additional Deposits</h4>
          <FormRow>
            <FormLabel htmlFor="additional_deposit_percent">Additional Deposit (%)</FormLabel>
            <FormInput id="additional_deposit_percent" name="additional_deposit_percent" type="number" step="0.01" value={formData.additional_deposit_percent} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="deposit_interest_percent">Deposit Interest (% p.a.)</FormLabel>
            <FormInput id="deposit_interest_percent" name="deposit_interest_percent" type="number" step="0.01" value={formData.deposit_interest_percent} onChange={handleChange} required />
          </FormRow>
        </div>

        {/* Lock-in Period Charges */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Lock-in Period Charges</h4>
          <FormRow>
            <FormLabel htmlFor="lockin_charge_min">Minimum Charge (Rs/bale)</FormLabel>
            <FormInput id="lockin_charge_min" name="lockin_charge_min" type="number" value={formData.lockin_charge_min} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="lockin_charge_max">Maximum Charge (Rs/bale)</FormLabel>
            <FormInput id="lockin_charge_max" name="lockin_charge_max" type="number" value={formData.lockin_charge_max} onChange={handleChange} required />
          </FormRow>
        </div>

        {/* Moisture Adjustment Parameters */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Moisture Adjustment Parameters</h4>
          <FormRow>
            <FormLabel htmlFor="moisture_lower_limit">Moisture Lower Limit (% - Premium below)</FormLabel>
            <FormInput id="moisture_lower_limit" name="moisture_lower_limit" type="number" step="0.1" value={formData.moisture_lower_limit} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="moisture_upper_limit">Moisture Upper Limit (% - Discount above)</FormLabel>
            <FormInput id="moisture_upper_limit" name="moisture_upper_limit" type="number" step="0.1" value={formData.moisture_upper_limit} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="moisture_sample_count">Sample Count (No. of bales)</FormLabel>
            <FormInput id="moisture_sample_count" name="moisture_sample_count" type="number" value={formData.moisture_sample_count} onChange={handleChange} required />
          </FormRow>
        </div>

        {/* Email Configuration */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Email Configuration</h4>
          <FormRow>
            <FormLabel htmlFor="email_reminder_days">Email Reminder (Days)</FormLabel>
            <FormInput id="email_reminder_days" name="email_reminder_days" type="number" value={formData.email_reminder_days} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="email_template_emd_reminder">EMD Reminder Template (Optional)</FormLabel>
            <textarea 
              id="email_template_emd_reminder" 
              name="email_template_emd_reminder" 
              value={formData.email_template_emd_reminder || ''} 
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="email_template_payment_due">Payment Due Template (Optional)</FormLabel>
            <textarea 
              id="email_template_payment_due" 
              name="email_template_payment_due" 
              value={formData.email_template_payment_due || ''} 
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </FormRow>
        </div>
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </FormActions>
    </form>
  );
};

export default CciTermForm;
