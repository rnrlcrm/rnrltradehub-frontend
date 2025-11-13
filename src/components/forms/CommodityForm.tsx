import React, { useState, useEffect } from 'react';
import { Commodity, MasterDataItem, StructuredTerm, CommissionStructure } from '../../types';
import { Button } from '../ui/Form';
import { commoditySchema, CommodityFormData } from '../../schemas/settingsSchemas';
import {
  generateSymbol,
  shouldSupportCciTerms,
  getCommodityTemplates,
  sanitizeCommodityName,
  sanitizeSymbol,
  autoDetectGSTInfo,
} from '../../utils/commodityHelpers';
import { validateCommodityRules } from '../../services/commodityBusinessRuleEngine';
import { DraftManager } from '../../services/draftManager';
import GSTInfoPanel from '../commodity/GSTInfoPanel';
import BusinessRuleViolations from '../commodity/BusinessRuleViolations';
import DraftRecoveryPrompt from '../commodity/DraftRecoveryPrompt';

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
    // GST fields - auto-determined
    hsnCode: commodity?.hsnCode || '',
    gstRate: commodity?.gstRate ?? 0,
    gstExemptionAvailable: commodity?.gstExemptionAvailable ?? false,
    gstCategory: commodity?.gstCategory || 'Agricultural',
    isProcessed: commodity?.isProcessed ?? false,
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
  const [ruleViolations, setRuleViolations] = useState<{
    errors: Array<{rule: string; message: string; field?: string}>;
    warnings: Array<{rule: string; message: string; field?: string}>;
    info: Array<{rule: string; message: string; field?: string}>;
  }>({ errors: [], warnings: [], info: [] });
  const [showTemplateSelector, setShowTemplateSelector] = useState(!commodity);
  const [autoSymbol, setAutoSymbol] = useState(!commodity?.symbol);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [draftAge, setDraftAge] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Check for draft on mount
  useEffect(() => {
    if (!commodity) {
      const draft = DraftManager.loadDraft();
      if (draft) {
        const age = DraftManager.getDraftAge();
        if (age !== null) {
          setDraftAge(age);
          setShowDraftRecovery(true);
        }
      }
    }
  }, [commodity]);

  // Auto-save draft
  useEffect(() => {
    if (!isSaving && formData.name) {
      const timer = setTimeout(() => {
        DraftManager.saveDraft(formData, commodity?.id);
        setLastSaved(new Date());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, commodity?.id, isSaving]);

  // Auto-generate symbol when name changes
  useEffect(() => {
    if (autoSymbol && formData.name && !commodity) {
      const generatedSymbol = generateSymbol(formData.name);
      if (generatedSymbol) {
        setFormData(prev => ({ ...prev, symbol: generatedSymbol }));
      }
    }
  }, [formData.name, autoSymbol, commodity]);

  // Auto-determine GST based on name and processing status
  useEffect(() => {
    if (formData.name && !commodity) {
      const gstInfo = autoDetectGSTInfo(formData.name, formData.isProcessed);
      setFormData(prev => ({
        ...prev,
        hsnCode: gstInfo.hsnCode,
        gstRate: gstInfo.gstRate,
        gstExemptionAvailable: gstInfo.exemptionAvailable,
        gstCategory: gstInfo.category as any,
      }));
    }
  }, [formData.name, formData.isProcessed, commodity]);

  // Auto-set CCI Terms support for cotton
  useEffect(() => {
    if (formData.name && !commodity) {
      const shouldSupport = shouldSupportCciTerms(formData.name);
      if (shouldSupport !== formData.supportsCciTerms) {
        setFormData(prev => ({ ...prev, supportsCciTerms: shouldSupport }));
      }
    }
  }, [formData.name, commodity]);

  // Validate business rules in real-time
  useEffect(() => {
    if (formData.name) {
      const result = validateCommodityRules(formData as any, {
        existingCommodities: commodities,
        masterData,
      });
      setRuleViolations({
        errors: result.errors,
        warnings: result.warnings,
        info: result.info,
      });
    }
  }, [formData, commodities, masterData]);

  const handleChange = (field: keyof CommodityFormData, value: any) => {
    // Apply sanitization based on field
    let sanitizedValue = value;
    
    if (field === 'name' && typeof value === 'string') {
      sanitizedValue = sanitizeCommodityName(value);
    } else if (field === 'symbol' && typeof value === 'string') {
      sanitizedValue = sanitizeSymbol(value);
      setAutoSymbol(false); // Disable auto-generation if user manually edits symbol
    }
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDraftRecover = () => {
    const draft = DraftManager.loadDraft(commodity?.id);
    if (draft) {
      setFormData(draft.formData);
      setShowDraftRecovery(false);
    }
  };

  const handleDraftDiscard = () => {
    DraftManager.deleteDraft(commodity?.id);
    setShowDraftRecovery(false);
  };

  const applyTemplate = (templateName: string) => {
    const templates = getCommodityTemplates();
    const template = templates.find(t => t.name === templateName);
    
    if (template) {
      // Auto-detect GST for the template
      const gstInfo = autoDetectGSTInfo(template.name, template.isProcessed);
      
      setFormData({
        name: template.name,
        symbol: template.symbol,
        unit: template.unit,
        hsnCode: gstInfo.hsnCode,
        gstRate: gstInfo.gstRate,
        gstExemptionAvailable: gstInfo.exemptionAvailable,
        gstCategory: gstInfo.category as any,
        isProcessed: template.isProcessed,
        isActive: true,
        tradeTypeIds: template.defaultTradeTypeIds,
        bargainTypeIds: template.defaultBargainTypeIds,
        varietyIds: [],
        weightmentTermIds: template.defaultWeightmentTermIds,
        passingTermIds: template.defaultPassingTermIds,
        deliveryTermIds: template.defaultDeliveryTermIds,
        paymentTermIds: template.defaultPaymentTermIds,
        commissionIds: template.defaultCommissionIds,
        supportsCciTerms: template.supportsCciTerms,
        description: template.description,
      });
      setShowTemplateSelector(false);
      setAutoSymbol(false);
    }
  };

  const selectAllInCategory = (field: keyof CommodityFormData, allIds: number[]) => {
    setFormData(prev => ({ ...prev, [field]: allIds }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const deselectAllInCategory = (field: keyof CommodityFormData) => {
    setFormData(prev => ({ ...prev, [field]: [] }));
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

  // Helper component for multi-select sections with select all/deselect all
  const MultiSelectSection: React.FC<{
    label: string;
    field: keyof CommodityFormData;
    items: Array<{ id: number; name: string; days?: number }>;
    required?: boolean;
  }> = ({ label, field, items, required = false }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => selectAllInCategory(field, items.map(i => i.id))}
            className="text-xs text-blue-600 hover:underline"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => deselectAllInCategory(field)}
            className="text-xs text-gray-600 hover:underline"
          >
            Deselect All
          </button>
        </div>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
        {items.map(item => (
          <label key={item.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={(formData[field] as number[]).includes(item.id)}
              onChange={e => handleMultiSelectChange(field, item.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">
              {item.name}{item.days !== undefined ? ` (${item.days} days)` : ''}
            </span>
          </label>
        ))}
      </div>
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
    </div>
  );

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

      // Validate business rules
      const businessRuleErrors = validateCommodityRules(validatedData as any, {
        existingCommodities: commodities,
      });

      if (businessRuleErrors.errors.length > 0) {
        const newErrors: Record<string, string> = {};
        businessRuleErrors.errors.forEach(err => {
          if (err.field) {
            newErrors[err.field] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      await onSave(validatedData);
      
      // Delete draft on successful save
      DraftManager.deleteDraft(commodity?.id);
      
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
      {/* Draft Recovery Prompt */}
      {showDraftRecovery && (
        <DraftRecoveryPrompt
          onRecover={handleDraftRecover}
          onDiscard={handleDraftDiscard}
          draftAge={draftAge}
        />
      )}

      {/* Business Rule Violations */}
      <BusinessRuleViolations
        errors={ruleViolations.errors}
        warnings={ruleViolations.warnings}
        info={ruleViolations.info}
      />

      {/* Commodity Template Selector (only for new commodities) */}
      {!commodity && showTemplateSelector && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            Quick Start: Use a Template (Optional)
          </h3>
          <p className="text-xs text-blue-700 mb-3">
            Select a pre-configured template to automatically fill in common settings, or close this to enter manually.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {getCommodityTemplates().map(template => (
              <button
                key={template.name}
                type="button"
                onClick={() => applyTemplate(template.name)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Use {template.name} Template
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowTemplateSelector(false)}
            className="text-xs text-blue-600 hover:underline"
          >
            Close and enter manually
          </button>
        </div>
      )}

      {/* GST Information Panel - Auto-Determined */}
      {formData.name && (
        <GSTInfoPanel
          commodityName={formData.name}
          isProcessed={formData.isProcessed}
        />
      )}

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
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={formData.symbol}
              onChange={e => handleChange('symbol', e.target.value.toUpperCase())}
              className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                errors.symbol ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., CTN, WHT, RIC"
              maxLength={10}
            />
            {!commodity && (
              <label className="flex items-center space-x-1 text-xs whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={autoSymbol}
                  onChange={e => setAutoSymbol(e.target.checked)}
                  className="w-3 h-3"
                />
                <span>Auto</span>
              </label>
            )}
          </div>
          {autoSymbol && !commodity && (
            <p className="text-xs text-gray-500 mt-1">Symbol will be auto-generated from name</p>
          )}
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

        <div className="flex items-center space-x-6">
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
              checked={formData.isProcessed}
              onChange={e => handleChange('isProcessed', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Is Processed?</span>
            <span className="text-xs text-gray-500">(affects GST rate)</span>
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

        {/* Last Saved Indicator */}
        {lastSaved && (
          <div className="text-xs text-gray-500 italic">
            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Draft auto-saved {new Date(lastSaved).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Trading Parameters */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Trading Parameters</h3>

        {/* Trade Types */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Trade Types <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => selectAllInCategory('tradeTypeIds', masterData.tradeTypes.map(t => t.id))}
                className="text-xs text-blue-600 hover:underline"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => deselectAllInCategory('tradeTypeIds')}
                className="text-xs text-gray-600 hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>
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
