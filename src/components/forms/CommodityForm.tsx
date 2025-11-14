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
import CommodityParametersTab from '../commodity/CommodityParametersTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/shadcn/tabs';

interface CommodityFormProps {
  commodity: Commodity | null;
  commodities: Commodity[];
  onSave: (data: Omit<Commodity, 'id'>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  onFormChange?: () => void;
}

const CommodityForm: React.FC<CommodityFormProps> = ({
  commodity,
  commodities,
  onSave,
  onCancel,
  isSaving,
  onFormChange,
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

  // Auto-generate symbol when name changes (debounced to prevent interruption)
  useEffect(() => {
    if (autoSymbol && formData.name && !commodity) {
      const timer = setTimeout(() => {
        const generatedSymbol = generateSymbol(formData.name);
        if (generatedSymbol && generatedSymbol !== formData.symbol) {
          setFormData(prev => ({ ...prev, symbol: generatedSymbol }));
        }
      }, 300); // 300ms debounce
      return () => clearTimeout(timer);
    }
  }, [formData.name, autoSymbol, commodity]);

  // Auto-determine GST based on name and processing status (debounced)
  useEffect(() => {
    if (formData.name && !commodity) {
      const timer = setTimeout(() => {
        const gstInfo = autoDetectGSTInfo(formData.name, formData.isProcessed);
        setFormData(prev => {
          // Only update if values have actually changed
          if (prev.hsnCode !== gstInfo.hsnCode || 
              prev.gstRate !== gstInfo.gstRate || 
              prev.gstExemptionAvailable !== gstInfo.exemptionAvailable ||
              prev.gstCategory !== gstInfo.category) {
            return {
              ...prev,
              hsnCode: gstInfo.hsnCode,
              gstRate: gstInfo.gstRate,
              gstExemptionAvailable: gstInfo.exemptionAvailable,
              gstCategory: gstInfo.category as any,
            };
          }
          return prev;
        });
      }, 500); // 500ms debounce for GST detection
      return () => clearTimeout(timer);
    }
  }, [formData.name, formData.isProcessed, commodity]);

  // Auto-set CCI Terms support for cotton (debounced)
  useEffect(() => {
    if (formData.name && !commodity) {
      const timer = setTimeout(() => {
        const shouldSupport = shouldSupportCciTerms(formData.name);
        if (shouldSupport !== formData.supportsCciTerms) {
          setFormData(prev => ({ ...prev, supportsCciTerms: shouldSupport }));
        }
      }, 500); // 500ms debounce
      return () => clearTimeout(timer);
    }
  }, [formData.name, commodity, formData.supportsCciTerms]);

  // Validate business rules in real-time (debounced to prevent excessive re-renders)
  useEffect(() => {
    if (formData.name) {
      const timer = setTimeout(() => {
        const result = validateCommodityRules(formData as any, {
          existingCommodities: commodities,
        });
        setRuleViolations({
          errors: result.errors,
          warnings: result.warnings,
          info: result.info,
        });
      }, 600); // 600ms debounce for validation
      return () => clearTimeout(timer);
    }
  }, [formData.name, formData.symbol, formData.hsnCode, formData.unit, commodities]);

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

    // Notify parent of form changes
    if (onFormChange) {
      onFormChange();
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

  // For new commodity creation, show form directly without tabs
  if (!commodity) {
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

        {/* Status and Classification Checkboxes */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 space-y-4">
          <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">!</span>
            Important: Commodity Status & Classification
          </h4>

          {/* Active Checkbox */}
          <div className="bg-white rounded-md p-4 border-l-4 border-green-500">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => handleChange('isActive', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">Active</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                    {formData.isActive ? '✓ Available' : '✕ Hidden'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>Controls contract creation availability.</strong><br/>
                  ✓ <strong>Checked (Active):</strong> This commodity WILL appear in dropdown when creating new sales contracts.<br/>
                  ✕ <strong>Unchecked (Inactive):</strong> This commodity will NOT appear in new contract creation (existing contracts unaffected).
                </p>
              </div>
            </label>
          </div>

          {/* Is Processed Checkbox */}
          <div className="bg-white rounded-md p-4 border-l-4 border-orange-500">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isProcessed}
                onChange={e => handleChange('isProcessed', e.target.checked)}
                className="w-5 h-5 text-orange-600 rounded mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">Is Processed?</span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold">
                    Affects GST Rate
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>Determines GST rate based on processing level.</strong><br/>
                  ✓ <strong>Checked (Processed):</strong> Product is processed/manufactured → Higher GST (12-18%)<br/>
                  &nbsp;&nbsp;&nbsp;<em>Example: Cotton Yarn, Polished Rice, Refined Oil</em><br/>
                  ✕ <strong>Unchecked (Raw):</strong> Product is unprocessed/natural → Lower GST (0-5%)<br/>
                  &nbsp;&nbsp;&nbsp;<em>Example: Raw Cotton, Raw Paddy, Crude Oil</em>
                </p>
              </div>
            </label>
          </div>

          {/* Supports CCI Terms Checkbox */}
          <div className="bg-white rounded-md p-4 border-l-4 border-purple-500">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.supportsCciTerms}
                onChange={e => handleChange('supportsCciTerms', e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">Supports CCI Terms</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-semibold">
                    Cotton ONLY
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>⚠️ ONLY for Cotton commodities trading in Bales.</strong><br/>
                  ✓ <strong>Checked:</strong> Applies CCI (Cotton Corporation of India) government terms including:<br/>
                  &nbsp;&nbsp;&nbsp;• EMD (Earnest Money Deposit) requirements<br/>
                  &nbsp;&nbsp;&nbsp;• Carrying charges for storage<br/>
                  &nbsp;&nbsp;&nbsp;• Late lifting penalties<br/>
                  &nbsp;&nbsp;&nbsp;• Standardized quality specifications<br/>
                  ✕ <strong>Unchecked:</strong> Regular trading terms (for wheat, rice, or other commodities)
                </p>
              </div>
            </label>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 text-xs text-gray-700">
          <p className="font-semibold mb-2 text-yellow-900">💡 Quick Guide:</p>
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
          {isSaving ? 'Saving...' : 'Create Commodity'}
        </Button>
      </div>
    </form>
    );
  }

  // For editing existing commodity, show tabs with Parameters tab
  return (
    <div className="space-y-6">
      {/* Business Rule Violations */}
      <BusinessRuleViolations
        errors={ruleViolations.errors}
        warnings={ruleViolations.warnings}
        info={ruleViolations.info}
      />

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Commodity Details</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GST Information Panel */}
            {formData.name && (
              <GSTInfoPanel
                commodityName={formData.name}
                isProcessed={formData.isProcessed}
              />
            )}

            {/* Basic Information - Same as non-tabbed version */}
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
                  className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 w-full ${
                    errors.symbol ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., CTN, WHT, RIC"
                  maxLength={10}
                />
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
                  <option value="Bales">Bales</option>
                  <option value="Kgs">Kgs</option>
                  <option value="Qty">Qty</option>
                  <option value="Candy">Candy</option>
                  <option value="Quintal">Quintal</option>
                  <option value="Tonnes">Tonnes</option>
                </select>
                {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Unit (Pricing Basis)
                </label>
                <select
                  value={formData.rateUnit}
                  onChange={e => handleChange('rateUnit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bales">Bales</option>
                  <option value="Kgs">Kgs</option>
                  <option value="Qty">Qty</option>
                  <option value="Candy">Candy</option>
                  <option value="Quintal">Quintal</option>
                  <option value="Tonnes">Tonnes</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Rate basis for pricing (defaults to primary unit)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HSN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hsnCode}
                  onChange={e => handleChange('hsnCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.hsnCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 5201"
                />
                {errors.hsnCode && <p className="text-red-500 text-xs mt-1">{errors.hsnCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.gstRate}
                  onChange={e => handleChange('gstRate', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.gstRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  step="0.01"
                />
                {errors.gstRate && <p className="text-red-500 text-xs mt-1">{errors.gstRate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Category
                </label>
                <select
                  value={formData.gstCategory}
                  onChange={e => handleChange('gstCategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Agricultural">Agricultural</option>
                  <option value="Processed">Processed</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Service">Service</option>
                </select>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isProcessed}
                    onChange={e => handleChange('isProcessed', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Is Processed Commodity</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.gstExemptionAvailable}
                    onChange={e => handleChange('gstExemptionAvailable', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">GST Exemption Available</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.supportsCciTerms}
                    onChange={e => handleChange('supportsCciTerms', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Supports CCI Terms (Cotton Only)</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => handleChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
            </div>

            {/* Trading Parameters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Trading Parameters</h3>
              
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

              {/* Delivery Terms */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Terms <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDeliveryTerm.name}
                    onChange={(e) => setNewDeliveryTerm({ ...newDeliveryTerm, name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Term name"
                  />
                  <input
                    type="number"
                    value={newDeliveryTerm.days}
                    onChange={(e) => setNewDeliveryTerm({ ...newDeliveryTerm, days: parseInt(e.target.value) })}
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
                    onChange={(e) => setNewPaymentTerm({ ...newPaymentTerm, name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Term name"
                  />
                  <input
                    type="number"
                    value={newPaymentTerm.days}
                    onChange={(e) => setNewPaymentTerm({ ...newPaymentTerm, days: parseInt(e.target.value) })}
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

              {/* Commissions */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Commission Structures <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={newCommission.name}
                    onChange={(e) => setNewCommission({ ...newCommission, name: e.target.value })}
                    className="col-span-4 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Commission name"
                  />
                  <select
                    value={newCommission.type}
                    onChange={(e) => setNewCommission({ ...newCommission, type: e.target.value as any })}
                    className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="PER_BALE">Per {formData.unit}</option>
                  </select>
                  <input
                    type="number"
                    value={newCommission.value}
                    onChange={(e) => setNewCommission({ ...newCommission, value: parseFloat(e.target.value) })}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Value"
                    step="0.01"
                    min="0"
                  />
                  <input
                    type="number"
                    value={newCommission.gstRate}
                    onChange={(e) => setNewCommission({ ...newCommission, gstRate: parseFloat(e.target.value) })}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="GST%"
                    step="0.01"
                    min="0"
                  />
                  <Button type="button" onClick={(e) => { e.preventDefault(); addCommission(); }} variant="secondary" className="col-span-1 text-sm px-3">
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
                {isSaving ? 'Saving...' : 'Update Commodity'}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="parameters" className="mt-4">
          <CommodityParametersTab 
            commodityId={commodity.id} 
            commodityUnit={formData.unit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommodityForm;
