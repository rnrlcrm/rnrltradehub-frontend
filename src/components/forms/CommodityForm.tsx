import React, { useState, useEffect } from 'react';
import { Commodity, MasterDataItem, StructuredTerm, CommissionStructure } from '../../types';
import { Button } from '../ui/Form';
import { commoditySchema, CommodityFormData } from '../../schemas/settingsSchemas';
import {
  generateSymbol,
  shouldSupportCciTerms,
  sanitizeCommodityName,
  sanitizeSymbol,
  autoDetectGSTInfo,
} from '../../utils/commodityHelpers';
import { validateCommodityRules } from '../../services/commodityBusinessRuleEngine';
import GSTInfoPanel from '../commodity/GSTInfoPanel';
import BusinessRuleViolations from '../commodity/BusinessRuleViolations';

interface CommodityFormProps {
  commodity: Commodity | null;
  commodities: Commodity[];
  onSave: (data: Omit<Commodity, 'id'>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const CommodityForm: React.FC<CommodityFormProps> = ({
  commodity,
  commodities,
  onSave,
  onCancel,
  isSaving,
}) => {
  // State for basic commodity info
  const [formData, setFormData] = useState<CommodityFormData>({
    name: commodity?.name || '',
    symbol: commodity?.symbol || '',
    unit: commodity?.unit || 'Bales',
    rateUnit: commodity?.rateUnit || commodity?.unit || 'Bales',
    hsnCode: commodity?.hsnCode || '',
    gstRate: commodity?.gstRate ?? 0,
    gstExemptionAvailable: commodity?.gstExemptionAvailable ?? false,
    gstCategory: commodity?.gstCategory || 'Agricultural',
    isProcessed: commodity?.isProcessed ?? false,
    isActive: commodity?.isActive ?? true,
    tradeTypes: commodity?.tradeTypes || [],
    bargainTypes: commodity?.bargainTypes || [],
    varieties: commodity?.varieties || [],
    weightmentTerms: commodity?.weightmentTerms || [],
    passingTerms: commodity?.passingTerms || [],
    deliveryTerms: commodity?.deliveryTerms || [],
    paymentTerms: commodity?.paymentTerms || [],
    commissions: commodity?.commissions || [],
    supportsCciTerms: commodity?.supportsCciTerms ?? false,
    description: commodity?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ruleViolations, setRuleViolations] = useState<{
    errors: Array<{rule: string; message: string; field?: string}>;
    warnings: Array<{rule: string; message: string; field?: string}>;
    info: Array<{rule: string; message: string; field?: string}>;
  }>({ errors: [], warnings: [], info: [] });
  const [autoSymbol, setAutoSymbol] = useState(!commodity?.symbol);

  // State for inline item management
  const [newTradeType, setNewTradeType] = useState('');
  const [newBargainType, setNewBargainType] = useState('');
  const [newVariety, setNewVariety] = useState('');
  const [newWeightmentTerm, setNewWeightmentTerm] = useState('');
  const [newPassingTerm, setNewPassingTerm] = useState('');
  const [newDeliveryTerm, setNewDeliveryTerm] = useState({ name: '', days: 0 });
  const [newPaymentTerm, setNewPaymentTerm] = useState({ name: '', days: 0 });
  const [newCommission, setNewCommission] = useState({ 
    name: '', 
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'PER_BALE', 
    value: 0,
    gstApplicable: true, // Commission always has GST
    gstRate: 18, // 18% as per SAC 9983
    sacCode: '9983'
  });

  // Prevent backspace key from navigating back in browser
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if backspace is pressed outside of an input/textarea/select element
      const target = e.target as HTMLElement;
      const isInputElement = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable;
      
      if (e.key === 'Backspace' && !isInputElement) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      });
      setRuleViolations({
        errors: result.errors,
        warnings: result.warnings,
        info: result.info,
      });
    }
  }, [formData, commodities]);

  const handleChange = (field: keyof CommodityFormData, value: any) => {
    let sanitizedValue = value;
    
    if (field === 'name' && typeof value === 'string') {
      sanitizedValue = sanitizeCommodityName(value);
    } else if (field === 'symbol' && typeof value === 'string') {
      sanitizedValue = sanitizeSymbol(value);
      setAutoSymbol(false);
    }
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Inline item management functions
  const addTradeType = () => {
    if (newTradeType.trim()) {
      const newItem: MasterDataItem = {
        id: Date.now(),
        name: newTradeType.trim(),
      };
      setFormData(prev => ({ ...prev, tradeTypes: [...prev.tradeTypes, newItem] }));
      setNewTradeType('');
    }
  };

  const removeTradeType = (id: number) => {
    setFormData(prev => ({ ...prev, tradeTypes: prev.tradeTypes.filter(item => item.id !== id) }));
  };

  const addBargainType = () => {
    if (newBargainType.trim()) {
      const newItem: MasterDataItem = {
        id: Date.now(),
        name: newBargainType.trim(),
      };
      setFormData(prev => ({ ...prev, bargainTypes: [...prev.bargainTypes, newItem] }));
      setNewBargainType('');
    }
  };

  const removeBargainType = (id: number) => {
    setFormData(prev => ({ ...prev, bargainTypes: prev.bargainTypes.filter(item => item.id !== id) }));
  };

  const addVariety = () => {
    if (newVariety.trim()) {
      const newItem: MasterDataItem = {
        id: Date.now(),
        name: newVariety.trim(),
      };
      setFormData(prev => ({ ...prev, varieties: [...prev.varieties, newItem] }));
      setNewVariety('');
    }
  };

  const removeVariety = (id: number) => {
    setFormData(prev => ({ ...prev, varieties: prev.varieties.filter(item => item.id !== id) }));
  };

  const addWeightmentTerm = () => {
    if (newWeightmentTerm.trim()) {
      const newItem: MasterDataItem = {
        id: Date.now(),
        name: newWeightmentTerm.trim(),
      };
      setFormData(prev => ({ ...prev, weightmentTerms: [...prev.weightmentTerms, newItem] }));
      setNewWeightmentTerm('');
    }
  };

  const removeWeightmentTerm = (id: number) => {
    setFormData(prev => ({ ...prev, weightmentTerms: prev.weightmentTerms.filter(item => item.id !== id) }));
  };

  const addPassingTerm = () => {
    if (newPassingTerm.trim()) {
      const newItem: MasterDataItem = {
        id: Date.now(),
        name: newPassingTerm.trim(),
      };
      setFormData(prev => ({ ...prev, passingTerms: [...prev.passingTerms, newItem] }));
      setNewPassingTerm('');
    }
  };

  const removePassingTerm = (id: number) => {
    setFormData(prev => ({ ...prev, passingTerms: prev.passingTerms.filter(item => item.id !== id) }));
  };

  const addDeliveryTerm = () => {
    if (newDeliveryTerm.name.trim() && newDeliveryTerm.days >= 0) {
      const newItem: StructuredTerm = {
        id: Date.now(),
        name: newDeliveryTerm.name.trim(),
        days: newDeliveryTerm.days,
      };
      setFormData(prev => ({ ...prev, deliveryTerms: [...prev.deliveryTerms, newItem] }));
      setNewDeliveryTerm({ name: '', days: 0 });
    }
  };

  const removeDeliveryTerm = (id: number) => {
    setFormData(prev => ({ ...prev, deliveryTerms: prev.deliveryTerms.filter(item => item.id !== id) }));
  };

  const addPaymentTerm = () => {
    if (newPaymentTerm.name.trim() && newPaymentTerm.days >= 0) {
      const newItem: StructuredTerm = {
        id: Date.now(),
        name: newPaymentTerm.name.trim(),
        days: newPaymentTerm.days,
      };
      setFormData(prev => ({ ...prev, paymentTerms: [...prev.paymentTerms, newItem] }));
      setNewPaymentTerm({ name: '', days: 0 });
    }
  };

  const removePaymentTerm = (id: number) => {
    setFormData(prev => ({ ...prev, paymentTerms: prev.paymentTerms.filter(item => item.id !== id) }));
  };

  const addCommission = () => {
    if (newCommission.name.trim() && newCommission.value >= 0) {
      const newItem: CommissionStructure = {
        id: Date.now(),
        name: newCommission.name.trim(),
        type: newCommission.type,
        value: newCommission.value,
        gstApplicable: newCommission.value > 0, // Only apply GST if commission > 0
        gstRate: newCommission.value > 0 ? 18 : 0, // 18% GST as per SAC 9983
        sacCode: '9983', // Service Accounting Code for Brokerage/Commission
      };
      setFormData(prev => ({ ...prev, commissions: [...prev.commissions, newItem] }));
      setNewCommission({ name: '', type: 'PERCENTAGE', value: 0, gstApplicable: true, gstRate: 18, sacCode: '9983' });
    }
  };

  const removeCommission = (id: number) => {
    setFormData(prev => ({ ...prev, commissions: prev.commissions.filter(item => item.id !== id) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    try {
      const validatedData = commoditySchema.parse(formData);

      // Check for duplicate name
      const isDuplicate = commodities.some(
        c =>
          c.id !== commodity?.id &&
          c.name.toLowerCase().trim() === validatedData.name.toLowerCase().trim()
      );

      if (isDuplicate) {
        setErrors({ name: 'A commodity with this name already exists' });
        return;
      }

      // Check for duplicate symbol
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

  // Helper component for inline list management
  const InlineListManager: React.FC<{
    label: string;
    items: MasterDataItem[];
    newItemValue: string;
    onNewItemChange: (value: string) => void;
    onAdd: () => void;
    onRemove: (id: number) => void;
    required?: boolean;
    errorMessage?: string;
  }> = ({ label, items, newItemValue, onNewItemChange, onAdd, onRemove, required, errorMessage }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Add new item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemValue}
          onChange={(e) => onNewItemChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder={`Add ${label.toLowerCase()}`}
        />
        <Button type="button" onClick={(e) => { e.preventDefault(); onAdd(); }} variant="secondary" className="text-sm px-3">
          +
        </Button>
      </div>

      {/* List of items */}
      {items.length > 0 && (
        <div className="border border-gray-200 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
              <span className="text-sm text-gray-700">{item.name}</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onRemove(item.id); }}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Rule Violations */}
      <BusinessRuleViolations
        errors={ruleViolations.errors}
        warnings={ruleViolations.warnings}
        info={ruleViolations.info}
      />

      {/* GST Information Panel */}
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
          {errors.symbol && <p className="text-red-500 text-xs mt-1">{errors.symbol}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Unit (Trade Unit) <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.unit}
            onChange={e => handleChange('unit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="Kgs">Kgs</option>
            <option value="Qty">Qty</option>
            <option value="Candy">Candy</option>
            <option value="Bales">Bales</option>
            <option value="Quintal">Quintal</option>
            <option value="Tonnes">Tonnes</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">The unit used for trading (e.g., Cotton is traded in Bales)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate Basis Unit <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.rateUnit || formData.unit}
            onChange={e => handleChange('rateUnit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="Kgs">Kgs</option>
            <option value="Qty">Qty</option>
            <option value="Candy">Candy</option>
            <option value="Bales">Bales</option>
            <option value="Quintal">Quintal</option>
            <option value="Tonnes">Tonnes</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">The unit used for pricing (e.g., Cotton rate is quoted per Candy)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={2}
            placeholder="Brief description of the commodity"
            maxLength={500}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
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
            <span className="text-xs text-gray-500" title="When unchecked, commodity won't be available for new contracts">(Available for trading)</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isProcessed}
              onChange={e => handleChange('isProcessed', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Is Processed?</span>
            <span className="text-xs text-gray-500" title="Processed goods may attract higher GST rates than raw agricultural products">(affects GST rate)</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.supportsCciTerms}
              onChange={e => handleChange('supportsCciTerms', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Supports CCI Terms</span>
            <span className="text-xs text-gray-500" title="Cotton Corporation of India terms - only applicable to cotton commodity">(Cotton only)</span>
          </label>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-gray-700">
          <p className="font-semibold mb-1">Field Explanations:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li><strong>Active:</strong> Controls whether this commodity is available for creating new contracts. Inactive commodities are hidden from selection.</li>
            <li><strong>Is Processed:</strong> Indicates if the commodity is processed (e.g., refined oil, polished rice). Processed goods typically attract higher GST rates than raw agricultural products.</li>
            <li><strong>Supports CCI Terms:</strong> CCI (Cotton Corporation of India) terms apply specific rules for cotton trading including EMD, carrying charges, and lifting terms. Only enable this for cotton commodities.</li>
          </ul>
        </div>
      </div>

      {/* Trading Parameters - Inline Management */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
          Trading Parameters (Add Multiple)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trade Types */}
          <InlineListManager
            label="Trade Types"
            items={formData.tradeTypes}
            newItemValue={newTradeType}
            onNewItemChange={setNewTradeType}
            onAdd={addTradeType}
            onRemove={removeTradeType}
            required
            errorMessage={errors.tradeTypes}
          />

          {/* Bargain Types */}
          <InlineListManager
            label="Bargain Types"
            items={formData.bargainTypes}
            newItemValue={newBargainType}
            onNewItemChange={setNewBargainType}
            onAdd={addBargainType}
            onRemove={removeBargainType}
            required
            errorMessage={errors.bargainTypes}
          />

          {/* Varieties */}
          <InlineListManager
            label="Varieties"
            items={formData.varieties}
            newItemValue={newVariety}
            onNewItemChange={setNewVariety}
            onAdd={addVariety}
            onRemove={removeVariety}
            required
            errorMessage={errors.varieties}
          />

          {/* Weightment Terms */}
          <InlineListManager
            label="Weightment Terms"
            items={formData.weightmentTerms}
            newItemValue={newWeightmentTerm}
            onNewItemChange={setNewWeightmentTerm}
            onAdd={addWeightmentTerm}
            onRemove={removeWeightmentTerm}
            required
            errorMessage={errors.weightmentTerms}
          />

          {/* Passing Terms */}
          <InlineListManager
            label="Passing Terms"
            items={formData.passingTerms}
            newItemValue={newPassingTerm}
            onNewItemChange={setNewPassingTerm}
            onAdd={addPassingTerm}
            onRemove={removePassingTerm}
            required
            errorMessage={errors.passingTerms}
          />
        </div>

        {/* Delivery Terms */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Delivery Terms <span className="text-red-500">*</span>
          </label>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newDeliveryTerm.name}
              onChange={(e) => setNewDeliveryTerm(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addDeliveryTerm();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Term name (e.g., Ex-Gin)"
            />
            <input
              type="number"
              value={newDeliveryTerm.days}
              onChange={(e) => setNewDeliveryTerm(prev => ({ ...prev, days: parseInt(e.target.value) || 0 }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addDeliveryTerm();
                }
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Days"
              min="0"
            />
            <Button type="button" onClick={(e) => { e.preventDefault(); addDeliveryTerm(); }} variant="secondary" className="text-sm px-3">
              +
            </Button>
          </div>

          {formData.deliveryTerms.length > 0 && (
            <div className="border border-gray-200 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {formData.deliveryTerms.map(term => (
                <div key={term.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm text-gray-700">{term.name} ({term.days} days)</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); removeDeliveryTerm(term.id); }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {errors.deliveryTerms && <p className="text-red-500 text-xs mt-1">{errors.deliveryTerms}</p>}
        </div>

        {/* Payment Terms */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Payment Terms <span className="text-red-500">*</span>
          </label>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newPaymentTerm.name}
              onChange={(e) => setNewPaymentTerm(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addPaymentTerm();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Term name (e.g., Advance)"
            />
            <input
              type="number"
              value={newPaymentTerm.days}
              onChange={(e) => setNewPaymentTerm(prev => ({ ...prev, days: parseInt(e.target.value) || 0 }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addPaymentTerm();
                }
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Days"
              min="0"
            />
            <Button type="button" onClick={(e) => { e.preventDefault(); addPaymentTerm(); }} variant="secondary" className="text-sm px-3">
              +
            </Button>
          </div>

          {formData.paymentTerms.length > 0 && (
            <div className="border border-gray-200 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {formData.paymentTerms.map(term => (
                <div key={term.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm text-gray-700">{term.name} ({term.days} days)</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); removePaymentTerm(term.id); }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {errors.paymentTerms && <p className="text-red-500 text-xs mt-1">{errors.paymentTerms}</p>}
        </div>

        {/* Commission Structures */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Commission Structures <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500">Commission will be based on the Primary Unit ({formData.unit})</p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newCommission.name}
              onChange={(e) => setNewCommission(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addCommission();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Commission name"
            />
            <select
              value={newCommission.type}
              onChange={(e) => setNewCommission(prev => ({ ...prev, type: e.target.value as 'PERCENTAGE' | 'PER_BALE' }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="PER_BALE">Per {formData.unit}</option>
            </select>
            <input
              type="number"
              value={newCommission.value}
              onChange={(e) => setNewCommission(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addCommission();
                }
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Value"
              min="0"
              step="0.1"
            />
            <Button type="button" onClick={(e) => { e.preventDefault(); addCommission(); }} variant="secondary" className="text-sm px-3">
              +
            </Button>
          </div>

          {formData.commissions.length > 0 && (
            <div className="border border-gray-200 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {formData.commissions.map(commission => (
                <div key={commission.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 font-medium">
                      {commission.name} ({commission.type === 'PERCENTAGE' ? `${commission.value}%` : `₹${commission.value}/${formData.unit}`})
                    </span>
                    {commission.gstApplicable && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        + {commission.gstRate}% GST (SAC {commission.sacCode})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); removeCommission(commission.id); }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {errors.commissions && <p className="text-red-500 text-xs mt-1">{errors.commissions}</p>}
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
