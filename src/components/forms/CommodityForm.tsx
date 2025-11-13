import React, { useState, useEffect } from 'react';
import { Commodity, MasterDataItem, GstRate, StructuredTerm, CommissionStructure } from '../../types';
import { Button } from '../ui/Form';
import { commoditySchema, CommodityFormData } from '../../schemas/settingsSchemas';

interface CommodityFormProps {
  commodity: Commodity | null;
  commodities: Commodity[];
  masterData: {
    tradeTypes: MasterDataItem[];
    bargainTypes: MasterDataItem[];
    varieties: MasterDataItem[];
    weightmentTerms: MasterDataItem[];
    passingTerms: MasterDataItem[];
    deliveryTerms: StructuredTerm[];
    paymentTerms: StructuredTerm[];
    commissions: CommissionStructure[];
    gstRates: GstRate[];
  };
  onSave: (data: Omit<Commodity, 'id'>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const CommodityForm: React.FC<CommodityFormProps> = ({
  commodity,
  commodities,
  masterData,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [formData, setFormData] = useState<CommodityFormData>({
    name: commodity?.name || '',
    symbol: commodity?.symbol || '',
    unit: commodity?.unit || 'Bales',
    defaultGstRateId: commodity?.defaultGstRateId || null,
    isActive: commodity?.isActive ?? true,
    tradeTypeIds: commodity?.tradeTypeIds || [],
    bargainTypeIds: commodity?.bargainTypeIds || [],
    varietyIds: commodity?.varietyIds || [],
    weightmentTermIds: commodity?.weightmentTermIds || [],
    passingTermIds: commodity?.passingTermIds || [],
    deliveryTermIds: commodity?.deliveryTermIds || [],
    paymentTermIds: commodity?.paymentTermIds || [],
    commissionIds: commodity?.commissionIds || [],
    supportsCciTerms: commodity?.supportsCciTerms ?? false,
    description: commodity?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CommodityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMultiSelectChange = (field: keyof CommodityFormData, id: number, checked: boolean) => {
    setFormData(prev => {
      const currentIds = (prev[field] as number[]) || [];
      const newIds = checked
        ? [...currentIds, id]
        : currentIds.filter(existingId => existingId !== id);
      return { ...prev, [field]: newIds };
    });
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    try {
      const validatedData = commoditySchema.parse(formData);

      // Check for duplicate name (case-insensitive)
      const isDuplicate = commodities.some(
        c =>
          c.id !== commodity?.id &&
          c.name.toLowerCase().trim() === validatedData.name.toLowerCase().trim()
      );

      if (isDuplicate) {
        setErrors({ name: 'A commodity with this name already exists' });
        return;
      }

      // Check for duplicate symbol (case-insensitive)
      const isDuplicateSymbol = commodities.some(
        c =>
          c.id !== commodity?.id &&
          c.symbol.toLowerCase().trim() === validatedData.symbol.toLowerCase().trim()
      );

      if (isDuplicateSymbol) {
        setErrors({ symbol: 'A commodity with this symbol already exists' });
        return;
      }

      await onSave(validatedData);
    } catch (error: any) {
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commodity Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Cotton, Wheat, Rice"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symbol <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.symbol}
            onChange={e => handleChange('symbol', e.target.value.toUpperCase())}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              errors.symbol ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., CTN, WHT, RIC"
            maxLength={10}
          />
          {errors.symbol && <p className="text-red-500 text-xs mt-1">{errors.symbol}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Unit <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.unit}
            onChange={e => handleChange('unit', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              errors.unit ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="Kgs">Kgs</option>
            <option value="Qty">Qty</option>
            <option value="Candy">Candy</option>
            <option value="Bales">Bales</option>
            <option value="Quintal">Quintal</option>
            <option value="Tonnes">Tonnes</option>
          </select>
          {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default GST Rate
          </label>
          <select
            value={formData.defaultGstRateId || ''}
            onChange={e => handleChange('defaultGstRateId', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select GST Rate --</option>
            {masterData.gstRates.map(rate => (
              <option key={rate.id} value={rate.id}>
                {rate.rate}% - {rate.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Brief description of the commodity"
            maxLength={500}
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={e => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.supportsCciTerms}
              onChange={e => handleChange('supportsCciTerms', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Supports CCI Terms</span>
          </label>
        </div>
      </div>

      {/* Trading Parameters */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Trading Parameters</h3>

        {/* Trade Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trade Types <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            {masterData.tradeTypes.map(type => (
              <label key={type.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.tradeTypeIds.includes(type.id)}
                  onChange={e => handleMultiSelectChange('tradeTypeIds', type.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{type.name}</span>
              </label>
            ))}
          </div>
          {errors.tradeTypeIds && <p className="text-red-500 text-xs mt-1">{errors.tradeTypeIds}</p>}
        </div>

        {/* Bargain Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bargain Types <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            {masterData.bargainTypes.map(type => (
              <label key={type.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.bargainTypeIds.includes(type.id)}
                  onChange={e => handleMultiSelectChange('bargainTypeIds', type.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{type.name}</span>
              </label>
            ))}
          </div>
          {errors.bargainTypeIds && <p className="text-red-500 text-xs mt-1">{errors.bargainTypeIds}</p>}
        </div>

        {/* Varieties */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Varieties</label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            {masterData.varieties.map(variety => (
              <label key={variety.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.varietyIds.includes(variety.id)}
                  onChange={e => handleMultiSelectChange('varietyIds', variety.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{variety.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Weightment Terms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weightment Terms <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            {masterData.weightmentTerms.map(term => (
              <label key={term.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.weightmentTermIds.includes(term.id)}
                  onChange={e => handleMultiSelectChange('weightmentTermIds', term.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{term.name}</span>
              </label>
            ))}
          </div>
          {errors.weightmentTermIds && <p className="text-red-500 text-xs mt-1">{errors.weightmentTermIds}</p>}
        </div>

        {/* Passing Terms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Passing Terms <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            {masterData.passingTerms.map(term => (
              <label key={term.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.passingTermIds.includes(term.id)}
                  onChange={e => handleMultiSelectChange('passingTermIds', term.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{term.name}</span>
              </label>
            ))}
          </div>
          {errors.passingTermIds && <p className="text-red-500 text-xs mt-1">{errors.passingTermIds}</p>}
        </div>

        {/* Delivery Terms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Terms <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            {masterData.deliveryTerms.map(term => (
              <label key={term.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.deliveryTermIds.includes(term.id)}
                  onChange={e => handleMultiSelectChange('deliveryTermIds', term.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{term.name} ({term.days} days)</span>
              </label>
            ))}
          </div>
          {errors.deliveryTermIds && <p className="text-red-500 text-xs mt-1">{errors.deliveryTermIds}</p>}
        </div>

        {/* Payment Terms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Terms <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            {masterData.paymentTerms.map(term => (
              <label key={term.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.paymentTermIds.includes(term.id)}
                  onChange={e => handleMultiSelectChange('paymentTermIds', term.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{term.name} ({term.days} days)</span>
              </label>
            ))}
          </div>
          {errors.paymentTermIds && <p className="text-red-500 text-xs mt-1">{errors.paymentTermIds}</p>}
        </div>

        {/* Commission Structures */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commission Structures <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            {masterData.commissions.map(commission => (
              <label key={commission.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.commissionIds.includes(commission.id)}
                  onChange={e => handleMultiSelectChange('commissionIds', commission.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">
                  {commission.name} ({commission.type === 'PERCENTAGE' ? `${commission.value}%` : `₹${commission.value}/bale`})
                </span>
              </label>
            ))}
          </div>
          {errors.commissionIds && <p className="text-red-500 text-xs mt-1">{errors.commissionIds}</p>}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" onClick={onCancel} variant="secondary" disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : commodity ? 'Update Commodity' : 'Create Commodity'}
        </Button>
      </div>
    </form>
  );
};

export default CommodityForm;
