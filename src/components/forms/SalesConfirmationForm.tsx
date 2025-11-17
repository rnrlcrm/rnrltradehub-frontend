import React, { useState, useEffect } from 'react';
import { SalesConfirmation, CommodityLineItem, BusinessPartner, Commodity, User } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { mockMasterData } from '../../data/mockData';

interface SalesConfirmationFormProps {
  confirmation?: SalesConfirmation | null;
  mode: 'create' | 'edit' | 'amend' | 'view';
  buyers: BusinessPartner[];
  sellers: BusinessPartner[];
  commodities: Commodity[];
  currentUser: User;
  currentOrganization: string;
  currentFinancialYear: string;
  onSave: (confirmation: Omit<SalesConfirmation, 'id'>, amendmentReason?: string) => void;
  onCancel: () => void;
}

const getInitialLineItem = (): CommodityLineItem => ({
  id: `item-${Date.now()}-${Math.random()}`,
  commodityId: 0,
  commodityName: '',
  commoditySymbol: '',
  variety: '',
  quantity: 0,
  rate: 0,
  amount: 0,
  dynamicFields: {},
  qualitySpecs: {},
});

const SalesConfirmationForm: React.FC<SalesConfirmationFormProps> = ({
  confirmation,
  mode,
  buyers,
  sellers,
  commodities,
  currentUser,
  currentOrganization,
  currentFinancialYear,
  onSave,
  onCancel,
}) => {
  const readOnly = mode === 'view';
  const isAmendment = mode === 'amend';

  const [formData, setFormData] = useState<Omit<SalesConfirmation, 'id'>>({
    confirmationNo: '',
    version: 1,
    date: new Date().toISOString().split('T')[0],
    organization: currentOrganization,
    financialYear: currentFinancialYear,
    buyerId: '',
    buyerName: '',
    sellerId: '',
    sellerName: '',
    agentId: '',
    agentName: '',
    lineItems: [getInitialLineItem()],
    deliveryLocation: '',
    deliveryTerms: '',
    paymentTerms: '',
    remarks: '',
    status: 'Draft',
    createdBy: currentUser.name,
    createdAt: new Date().toISOString(),
    emailSent: false,
    notificationSent: false,
    auditTrail: [],
  });

  const [amendmentReason, setAmendmentReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (confirmation) {
      setFormData(confirmation);
    }
  }, [confirmation]);

  const handleChange = (field: string, value: any) => {
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

  const handleBuyerChange = (buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    if (buyer) {
      handleChange('buyerId', buyerId);
      handleChange('buyerName', buyer.legal_name);
    }
  };

  const handleSellerChange = (sellerId: string) => {
    const seller = sellers.find(s => s.id === sellerId);
    if (seller) {
      handleChange('sellerId', sellerId);
      handleChange('sellerName', seller.legal_name);
    }
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const newLineItems = [...formData.lineItems];
    const item = { ...newLineItems[index], [field]: value };

    // If commodity changed, update related fields
    if (field === 'commodityId') {
      const commodity = commodities.find(c => c.id === parseInt(value));
      if (commodity) {
        item.commodityName = commodity.name;
        item.commoditySymbol = commodity.symbol;
        item.variety = '';
        item.quantity = 0;
        item.rate = 0;
        item.amount = 0;
        item.dynamicFields = {};
        item.qualitySpecs = {};
      }
    }

    // Recalculate amount when quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      item.amount = item.quantity * item.rate;
    }

    newLineItems[index] = item;
    handleChange('lineItems', newLineItems);
  };

  const handleDynamicFieldChange = (index: number, fieldName: string, value: any) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = {
      ...newLineItems[index],
      dynamicFields: {
        ...newLineItems[index].dynamicFields,
        [fieldName]: value,
      },
    };
    handleChange('lineItems', newLineItems);
  };

  const handleQualitySpecChange = (index: number, specName: string, value: string) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = {
      ...newLineItems[index],
      qualitySpecs: {
        ...newLineItems[index].qualitySpecs,
        [specName]: value,
      },
    };
    handleChange('lineItems', newLineItems);
  };

  const addLineItem = () => {
    handleChange('lineItems', [...formData.lineItems, getInitialLineItem()]);
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      const newLineItems = formData.lineItems.filter((_, i) => i !== index);
      handleChange('lineItems', newLineItems);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.buyerId) newErrors.buyerId = 'Buyer is required';
    if (!formData.sellerId) newErrors.sellerId = 'Seller is required';
    if (!formData.deliveryLocation) newErrors.deliveryLocation = 'Delivery location is required';
    if (!formData.deliveryTerms) newErrors.deliveryTerms = 'Delivery terms are required';
    if (!formData.paymentTerms) newErrors.paymentTerms = 'Payment terms are required';

    formData.lineItems.forEach((item, index) => {
      if (!item.commodityId) newErrors[`lineItem_${index}_commodity`] = `Commodity is required for item ${index + 1}`;
      if (!item.variety) newErrors[`lineItem_${index}_variety`] = `Variety is required for item ${index + 1}`;
      if (item.quantity <= 0) newErrors[`lineItem_${index}_quantity`] = `Valid quantity is required for item ${index + 1}`;
      if (item.rate <= 0) newErrors[`lineItem_${index}_rate`] = `Valid rate is required for item ${index + 1}`;
    });

    if (isAmendment && !amendmentReason) {
      newErrors.amendmentReason = 'Amendment reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData, isAmendment ? amendmentReason : undefined);
  };

  const getTotalAmount = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white border border-slate-200 rounded-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h3>
        
        <FormRow>
          <div className="flex-1">
            <FormLabel htmlFor="date">Date</FormLabel>
            <FormInput
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              readOnly={readOnly}
              required
            />
          </div>
          
          <div className="flex-1">
            <FormLabel htmlFor="status">Status</FormLabel>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={readOnly || mode === 'create'}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Amended">Amended</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </FormRow>
      </div>

      {/* Parties Information */}
      <div className="bg-white border border-slate-200 rounded-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Parties</h3>
        
        <FormRow>
          <div className="flex-1">
            <FormLabel htmlFor="buyerId">Buyer *</FormLabel>
            <select
              id="buyerId"
              name="buyerId"
              value={formData.buyerId}
              onChange={(e) => handleBuyerChange(e.target.value)}
              disabled={readOnly}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
                errors.buyerId ? 'border-red-500' : 'border-slate-300'
              }`}
              required
            >
              <option value="">Select Buyer</option>
              {buyers.map(buyer => (
                <option key={buyer.id} value={buyer.id}>
                  {buyer.legal_name} ({buyer.bp_code})
                </option>
              ))}
            </select>
            {errors.buyerId && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.buyerId}
              </p>
            )}
          </div>

          <div className="flex-1">
            <FormLabel htmlFor="sellerId">Seller *</FormLabel>
            <select
              id="sellerId"
              name="sellerId"
              value={formData.sellerId}
              onChange={(e) => handleSellerChange(e.target.value)}
              disabled={readOnly}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
                errors.sellerId ? 'border-red-500' : 'border-slate-300'
              }`}
              required
            >
              <option value="">Select Seller</option>
              {sellers.map(seller => (
                <option key={seller.id} value={seller.id}>
                  {seller.legal_name} ({seller.bp_code})
                </option>
              ))}
            </select>
            {errors.sellerId && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.sellerId}
              </p>
            )}
          </div>
        </FormRow>
      </div>

      {/* Commodity Line Items */}
      <div className="bg-white border border-slate-200 rounded-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Commodity Details</h3>
          {!readOnly && (
            <Button
              type="button"
              variant="secondary"
              onClick={addLineItem}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {formData.lineItems.map((item, index) => {
            const selectedCommodity = commodities.find(c => c.id === item.commodityId);
            
            return (
              <div key={item.id} className="border border-slate-200 rounded-md p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-slate-700">Item #{index + 1}</h4>
                  {!readOnly && formData.lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <FormRow>
                  <div className="flex-1">
                    <FormLabel htmlFor={`commodity_${index}`}>Commodity *</FormLabel>
                    <select
                      id={`commodity_${index}`}
                      value={item.commodityId || ''}
                      onChange={(e) => handleLineItemChange(index, 'commodityId', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
                        errors[`lineItem_${index}_commodity`] ? 'border-red-500' : 'border-slate-300'
                      }`}
                      required
                    >
                      <option value="">Select Commodity</option>
                      {commodities.filter(c => c.isActive).map(commodity => (
                        <option key={commodity.id} value={commodity.id}>
                          {commodity.name} ({commodity.symbol})
                        </option>
                      ))}
                    </select>
                    {errors[`lineItem_${index}_commodity`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`lineItem_${index}_commodity`]}</p>
                    )}
                  </div>

                  {selectedCommodity && (
                    <div className="flex-1">
                      <FormLabel htmlFor={`variety_${index}`}>Variety *</FormLabel>
                      <select
                        id={`variety_${index}`}
                        value={item.variety}
                        onChange={(e) => handleLineItemChange(index, 'variety', e.target.value)}
                        disabled={readOnly}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
                          errors[`lineItem_${index}_variety`] ? 'border-red-500' : 'border-slate-300'
                        }`}
                        required
                      >
                        <option value="">Select Variety</option>
                        {selectedCommodity.varieties.map(variety => (
                          <option key={variety.id} value={variety.name}>
                            {variety.name}
                          </option>
                        ))}
                      </select>
                      {errors[`lineItem_${index}_variety`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`lineItem_${index}_variety`]}</p>
                      )}
                    </div>
                  )}
                </FormRow>

                {selectedCommodity && (
                  <FormRow>
                    <div className="flex-1">
                      <FormLabel htmlFor={`quantity_${index}`}>
                        Quantity ({selectedCommodity.unit}) *
                      </FormLabel>
                      <FormInput
                        type="number"
                        id={`quantity_${index}`}
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        readOnly={readOnly}
                        min="0"
                        step="0.01"
                        required
                        className={errors[`lineItem_${index}_quantity`] ? 'border-red-500' : ''}
                      />
                      {errors[`lineItem_${index}_quantity`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`lineItem_${index}_quantity`]}</p>
                      )}
                    </div>

                    <div className="flex-1">
                      <FormLabel htmlFor={`rate_${index}`}>
                        Rate (per {selectedCommodity.rateUnit || selectedCommodity.unit}) *
                      </FormLabel>
                      <FormInput
                        type="number"
                        id={`rate_${index}`}
                        value={item.rate}
                        onChange={(e) => handleLineItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        readOnly={readOnly}
                        min="0"
                        step="0.01"
                        required
                        className={errors[`lineItem_${index}_rate`] ? 'border-red-500' : ''}
                      />
                      {errors[`lineItem_${index}_rate`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`lineItem_${index}_rate`]}</p>
                      )}
                    </div>

                    <div className="flex-1">
                      <FormLabel>Amount</FormLabel>
                      <FormInput
                        type="text"
                        value={`₹ ${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        readOnly
                        className="bg-slate-100 font-semibold"
                      />
                    </div>
                  </FormRow>
                )}

                {/* Dynamic Fields based on Commodity */}
                {selectedCommodity && selectedCommodity.tradeTypes.length > 0 && (
                  <FormRow>
                    <div className="flex-1">
                      <FormLabel htmlFor={`tradeType_${index}`}>Trade Type</FormLabel>
                      <select
                        id={`tradeType_${index}`}
                        value={item.dynamicFields.tradeType || ''}
                        onChange={(e) => handleDynamicFieldChange(index, 'tradeType', e.target.value)}
                        disabled={readOnly}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                      >
                        <option value="">Select Trade Type</option>
                        {selectedCommodity.tradeTypes.map(type => (
                          <option key={type.id} value={type.name}>{type.name}</option>
                        ))}
                      </select>
                    </div>

                    {selectedCommodity.bargainTypes.length > 0 && (
                      <div className="flex-1">
                        <FormLabel htmlFor={`bargainType_${index}`}>Bargain Type</FormLabel>
                        <select
                          id={`bargainType_${index}`}
                          value={item.dynamicFields.bargainType || ''}
                          onChange={(e) => handleDynamicFieldChange(index, 'bargainType', e.target.value)}
                          disabled={readOnly}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                        >
                          <option value="">Select Bargain Type</option>
                          {selectedCommodity.bargainTypes.map(type => (
                            <option key={type.id} value={type.name}>{type.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </FormRow>
                )}

                {/* Quality Specifications (if applicable for the commodity) */}
                {selectedCommodity && selectedCommodity.name.toLowerCase() === 'cotton' && (
                  <div className="mt-3">
                    <h5 className="font-semibold text-slate-700 mb-2">Quality Specifications</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {['length', 'mic', 'rd', 'trash', 'moisture', 'strength'].map(spec => (
                        <div key={spec}>
                          <FormLabel htmlFor={`${spec}_${index}`} className="capitalize">{spec}</FormLabel>
                          <FormInput
                            type="text"
                            id={`${spec}_${index}`}
                            value={item.qualitySpecs?.[spec] || ''}
                            onChange={(e) => handleQualitySpecChange(index, spec, e.target.value)}
                            readOnly={readOnly}
                            placeholder={`Enter ${spec}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total Amount */}
        <div className="mt-4 pt-4 border-t border-slate-300">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800">Total Amount:</span>
                <span className="text-xl font-bold text-blue-600">
                  ₹ {getTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-white border border-slate-200 rounded-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Terms & Conditions</h3>
        
        <FormRow>
          <div className="flex-1">
            <FormLabel htmlFor="deliveryLocation">Delivery Location *</FormLabel>
            <FormInput
              type="text"
              id="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={(e) => handleChange('deliveryLocation', e.target.value)}
              readOnly={readOnly}
              required
              className={errors.deliveryLocation ? 'border-red-500' : ''}
            />
            {errors.deliveryLocation && (
              <p className="text-red-500 text-sm mt-1">{errors.deliveryLocation}</p>
            )}
          </div>
        </FormRow>

        <FormRow>
          <div className="flex-1">
            <FormLabel htmlFor="deliveryTerms">Delivery Terms *</FormLabel>
            <FormInput
              type="text"
              id="deliveryTerms"
              value={formData.deliveryTerms}
              onChange={(e) => handleChange('deliveryTerms', e.target.value)}
              readOnly={readOnly}
              required
              className={errors.deliveryTerms ? 'border-red-500' : ''}
            />
            {errors.deliveryTerms && (
              <p className="text-red-500 text-sm mt-1">{errors.deliveryTerms}</p>
            )}
          </div>

          <div className="flex-1">
            <FormLabel htmlFor="paymentTerms">Payment Terms *</FormLabel>
            <FormInput
              type="text"
              id="paymentTerms"
              value={formData.paymentTerms}
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
              readOnly={readOnly}
              required
              className={errors.paymentTerms ? 'border-red-500' : ''}
            />
            {errors.paymentTerms && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentTerms}</p>
            )}
          </div>
        </FormRow>

        <FormRow>
          <div className="flex-1">
            <FormLabel htmlFor="remarks">Remarks</FormLabel>
            <textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              readOnly={readOnly}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>
        </FormRow>
      </div>

      {/* Amendment Reason (if amending) */}
      {isAmendment && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Amendment Information</h3>
          <FormRow>
            <div className="flex-1">
              <FormLabel htmlFor="amendmentReason">Amendment Reason *</FormLabel>
              <textarea
                id="amendmentReason"
                value={amendmentReason}
                onChange={(e) => setAmendmentReason(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amendmentReason ? 'border-red-500' : 'border-yellow-300'
                }`}
                required
                placeholder="Please provide a detailed reason for this amendment..."
              />
              {errors.amendmentReason && (
                <p className="text-red-500 text-sm mt-1">{errors.amendmentReason}</p>
              )}
            </div>
          </FormRow>
        </div>
      )}

      {/* Form Actions */}
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        {!readOnly && (
          <Button type="submit" variant="primary">
            {isAmendment ? 'Save Amendment' : mode === 'edit' ? 'Update Confirmation' : 'Create Confirmation'}
          </Button>
        )}
      </FormActions>
    </form>
  );
};

export default SalesConfirmationForm;
