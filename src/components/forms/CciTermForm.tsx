
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
    name: 'New Term',
    contract_period_days: 30,
    emd_payment_days: 5,
    cash_discount_percentage: 0,
    carrying_charge_tier1_days: 30,
    carrying_charge_tier1_percent: 1.25,
    carrying_charge_tier2_days: 60,
    carrying_charge_tier2_percent: 1.35,
    additional_deposit_percent: 10,
    deposit_interest_percent: 5,
    free_lifting_period_days: 21,
    late_lifting_tier1_days: 30,
    late_lifting_tier1_percent: 0.5,
    late_lifting_tier2_days: 60,
    late_lifting_tier2_percent: 0.75,
    late_lifting_tier3_percent: 1.0,
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">General</h4>
          <FormRow>
            <FormLabel htmlFor="name">Term Name</FormLabel>
            <FormInput id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="contract_period_days">Contract Period (Days)</FormLabel>
            <FormInput id="contract_period_days" name="contract_period_days" type="number" value={formData.contract_period_days} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="emd_payment_days">EMD Payment (Days)</FormLabel>
            <FormInput id="emd_payment_days" name="emd_payment_days" type="number" value={formData.emd_payment_days} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="cash_discount_percentage">Cash Discount (%)</FormLabel>
            <FormInput id="cash_discount_percentage" name="cash_discount_percentage" type="number" step="0.01" value={formData.cash_discount_percentage} onChange={handleChange} required />
          </FormRow>
        </div>

        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Carrying Charges</h4>
          <FormRow>
            <FormLabel htmlFor="carrying_charge_tier1_percent">Tier 1: Charge (%) for first</FormLabel>
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <FormInput id="carrying_charge_tier1_percent" name="carrying_charge_tier1_percent" type="number" step="0.01" value={formData.carrying_charge_tier1_percent} onChange={handleChange} required className="!md:col-span-1" />
              <FormInput id="carrying_charge_tier1_days" name="carrying_charge_tier1_days" type="number" value={formData.carrying_charge_tier1_days} onChange={handleChange} required placeholder="days" className="!md:col-span-1" />
            </div>
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="carrying_charge_tier2_percent">Tier 2: Charge (%) for next</FormLabel>
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <FormInput id="carrying_charge_tier2_percent" name="carrying_charge_tier2_percent" type="number" step="0.01" value={formData.carrying_charge_tier2_percent} onChange={handleChange} required className="!md:col-span-1" />
              <FormInput id="carrying_charge_tier2_days" name="carrying_charge_tier2_days" type="number" value={formData.carrying_charge_tier2_days} onChange={handleChange} required placeholder="days" className="!md:col-span-1" />
            </div>
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="additional_deposit_percent">Additional Deposit (%)</FormLabel>
            <FormInput id="additional_deposit_percent" name="additional_deposit_percent" type="number" step="0.01" value={formData.additional_deposit_percent} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="deposit_interest_percent">Deposit Interest (% p.a.)</FormLabel>
            <FormInput id="deposit_interest_percent" name="deposit_interest_percent" type="number" step="0.01" value={formData.deposit_interest_percent} onChange={handleChange} required />
          </FormRow>
        </div>

        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-2">Late Lifting Charges</h4>
          <FormRow>
            <FormLabel htmlFor="free_lifting_period_days">Free Lifting Period (Days)</FormLabel>
            <FormInput id="free_lifting_period_days" name="free_lifting_period_days" type="number" value={formData.free_lifting_period_days} onChange={handleChange} required />
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="late_lifting_tier1_percent">Tier 1: Charge (%) for first</FormLabel>
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <FormInput id="late_lifting_tier1_percent" name="late_lifting_tier1_percent" type="number" step="0.01" value={formData.late_lifting_tier1_percent} onChange={handleChange} required className="!md:col-span-1" />
              <FormInput id="late_lifting_tier1_days" name="late_lifting_tier1_days" type="number" value={formData.late_lifting_tier1_days} onChange={handleChange} required placeholder="days" className="!md:col-span-1" />
            </div>
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="late_lifting_tier2_percent">Tier 2: Charge (%) for next</FormLabel>
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <FormInput id="late_lifting_tier2_percent" name="late_lifting_tier2_percent" type="number" step="0.01" value={formData.late_lifting_tier2_percent} onChange={handleChange} required className="!md:col-span-1" />
              <FormInput id="late_lifting_tier2_days" name="late_lifting_tier2_days" type="number" value={formData.late_lifting_tier2_days} onChange={handleChange} required placeholder="days" className="!md:col-span-1" />
            </div>
          </FormRow>
          <FormRow>
            <FormLabel htmlFor="late_lifting_tier3_percent">Tier 3: Charge (%) thereafter</FormLabel>
            <FormInput id="late_lifting_tier3_percent" name="late_lifting_tier3_percent" type="number" step="0.01" value={formData.late_lifting_tier3_percent} onChange={handleChange} required />
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
