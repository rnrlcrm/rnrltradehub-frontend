
import React, { useState, useEffect } from 'react';
import { SalesContract, BusinessPartner, MasterDataItem, CciTerm, Location, StructuredTerm, CommissionStructure, GstRate } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { useGemini } from '../../hooks/useGemini';
import { AIIcon, LoadingSpinner } from '../ui/icons';
import Modal from '../ui/Modal';
import SmartContractRuleDisplay from '../ui/SmartContractRuleDisplay';
import OverrideRequestModal from '../ui/OverrideRequestModal';
import { evaluateBusinessRules, canProceed, requiresManualApproval, canAutoApprove } from '../../lib/smartContract';

interface SalesContractFormProps {
  contract?: SalesContract | null;
  mode: 'add' | 'amend' | 'view';
  vendorsClients: BusinessPartner[];
  organizations: MasterDataItem[];
  masterData: {
      cciTerms: CciTerm[];
      bargainTypes: MasterDataItem[];
      weightmentTerms: MasterDataItem[];
      passingTerms: MasterDataItem[];
      deliveryTerms: StructuredTerm[];
      paymentTerms: StructuredTerm[];
      locations: Location[];
      commissions: CommissionStructure[];
      varieties: MasterDataItem[];
      gstRates: GstRate[];
      [key: string]: any;
  };
  readOnly: boolean;
  onSave: (contract: SalesContract, amendmentReason?: string) => void;
  onCancel: () => void;
  currentFinancialYear: string;
}

const getInitialState = (fy: string, masterData: any): Omit<SalesContract, 'id'> => {
    const cottonGst = masterData.gstRates.find(g => g.description === 'GST on Cotton');
    return {
        scNo: '',
        version: 1,
        date: new Date().toISOString().split('T')[0],
        organization: '',
        financialYear: fy,
        clientId: '',
        clientName: '',
        vendorId: '',
        vendorName: '',
        agentId: '',
        variety: '',
        quantityBales: 0,
        rate: 0,
        gstRateId: cottonGst?.id || null,
        buyerCommissionId: null,
        sellerCommissionId: null,
        buyerCommissionGstId: null,
        sellerCommissionGstId: null,
        tradeType: 'Normal Trade',
        bargainType: 'Pucca Sauda',
        weightmentTerms: '',
        passingTerms: '',
        deliveryTerms: '',
        paymentTerms: '',
        location: '',
        qualitySpecs: { length: '', mic: '', rd: '', trash: '', moisture: '', strength: '' },
        manualTerms: '',
        status: 'Active',
        cciContractNo: '',
        cciTermId: null,
    };
};

const TradeTypeToggle: React.FC<{ value: string, onChange: (value: string) => void, isReadOnly: boolean }> = ({ value, onChange, isReadOnly }) => (
    <div className="flex rounded-none border border-slate-300 p-0.5 bg-slate-100">
        <button type="button" disabled={isReadOnly} onClick={() => onChange('Normal Trade')} className={`px-4 py-1.5 text-sm font-semibold w-1/2 rounded-none transition-colors ${value === 'Normal Trade' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>Normal Trade</button>
        <button type="button" disabled={isReadOnly} onClick={() => onChange('CCI Trade')} className={`px-4 py-1.5 text-sm font-semibold w-1/2 rounded-none transition-colors ${value === 'CCI Trade' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>CCI Trade</button>
    </div>
);

const formatCommissionText = (commission: CommissionStructure): string => {
    if (commission.type === 'PERCENTAGE') {
        return `${commission.name} (${commission.value}%)`;
    }
    return `${commission.name} (₹${commission.value}/Bale)`;
};

const SalesContractForm: React.FC<SalesContractFormProps> = ({ contract, mode, vendorsClients, organizations, masterData, readOnly, onSave, onCancel, currentFinancialYear }) => {
  const [formData, setFormData] = useState<Omit<SalesContract, 'id'>>(getInitialState(currentFinancialYear, masterData));
  const [amendmentReason, setAmendmentReason] = useState('');
  const { status: aiStatus, response: aiResponse, error: aiError, generateContent: generateAiReview } = useGemini();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [showRuleValidation, setShowRuleValidation] = useState(false);
  const [ruleResults, setRuleResults] = useState<any[]>([]);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedRuleForOverride, setSelectedRuleForOverride] = useState<{ id: string; name: string } | null>(null);

  const clients = vendorsClients.filter(vc => vc.business_type === 'BUYER' || vc.business_type === 'BOTH');
  const vendors = vendorsClients.filter(vc => vc.business_type === 'SELLER' || vc.business_type === 'BOTH');
  const agents = vendorsClients.filter(vc => vc.business_type === 'AGENT');

  useEffect(() => {
    setFormData(contract ? { ...contract } : getInitialState(currentFinancialYear, masterData));
  }, [contract, currentFinancialYear, masterData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedData: Partial<Omit<SalesContract, 'id'>> = { [name]: value };

    if (name === 'clientId') updatedData.clientName = clients.find(c => c.id === value)?.legal_name || '';
    if (name === 'vendorId') updatedData.vendorName = vendors.find(v => v.id === value)?.legal_name || '';
    if (['cciTermId', 'gstRateId', 'buyerCommissionId', 'sellerCommissionId', 'buyerCommissionGstId', 'sellerCommissionGstId'].includes(name)) {
        const intValue = value ? parseInt(value, 10) : null;
        updatedData[name as keyof typeof updatedData] = intValue;

        const serviceGst = masterData.gstRates.find(g => g.description === 'GST on Services');
        if (name === 'buyerCommissionId' && intValue && intValue !== 3) { // 3 is 'None'
            updatedData.buyerCommissionGstId = serviceGst?.id || null;
        } else if (name === 'buyerCommissionId' && (!intValue || intValue === 3)) {
            updatedData.buyerCommissionGstId = null;
        }
        if (name === 'sellerCommissionId' && intValue && intValue !== 3) {
            updatedData.sellerCommissionGstId = serviceGst?.id || null;
        } else if (name === 'sellerCommissionId' && (!intValue || intValue === 3)) {
            updatedData.sellerCommissionGstId = null;
        }
    }

    setFormData(prev => ({ ...prev, ...updatedData }));
  };

  const handleTradeTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, tradeType: value }));
  };

  const handleQualitySpecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, qualitySpecs: { ...prev.qualitySpecs, [name]: value } }));
  };

  const handleAiReview = () => {
    const prompt = `
      As a cotton trade compliance officer, please review the following sales contract data for any inconsistencies, risks, or missing information.
      Provide actionable suggestions for improvement. For example, check if the rate is reasonable for the quality specs, if terms are clear, or if any mandatory fields are missing.
      Contract Data: ${JSON.stringify(formData)}
    `;
    generateAiReview(prompt);
    setIsAiModalOpen(true);
  };

  const handleValidateRules = () => {
    const results = evaluateBusinessRules(formData as SalesContract);
    setRuleResults(results);
    setShowRuleValidation(true);
  };

  const handleRequestOverride = (ruleId: string) => {
    const rule = ruleResults.find(r => r.ruleId === ruleId);
    if (rule) {
      setSelectedRuleForOverride({ id: rule.ruleId, name: rule.ruleName });
      setOverrideModalOpen(true);
    }
  };

  const handleSubmitOverride = (reason: string) => {
    // In a real implementation, this would submit the override request to the backend
    alert(`Override request submitted:\n\nRule: ${selectedRuleForOverride?.name}\nReason: ${reason}\n\nThis request will be sent to supervisors for approval.`);
    setOverrideModalOpen(false);
    setSelectedRuleForOverride(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'amend' && !amendmentReason) {
        alert('Please provide a reason for the amendment.');
        return;
    }
    if (formData.rate <= 0) {
        alert('Rate must be greater than zero.');
        return;
    }

    // Validate business rules before saving
    const results = evaluateBusinessRules(formData as SalesContract);
    const canProceedWithSave = canProceed(results);
    const needsApproval = requiresManualApproval(results);
    const canBeAutoApproved = canAutoApprove(results);

    if (!canProceedWithSave) {
      setRuleResults(results);
      setShowRuleValidation(true);
      alert('Contract cannot be saved due to blocking business rule violations. Please review the validation results.');
      return;
    }

    if (canBeAutoApproved) {
      alert('✅ Contract passed all validation rules and can be auto-approved!');
    } else if (needsApproval) {
      alert('⚠️ Contract requires manual approval. It will be sent for supervisor review.');
    }

    onSave(formData as SalesContract, amendmentReason);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-6">
        <FormRow><FormLabel htmlFor="tradeType">Trade Type</FormLabel><div className="md:col-span-2"><TradeTypeToggle value={formData.tradeType} onChange={handleTradeTypeChange} isReadOnly={readOnly} /></div></FormRow>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-4">
            <FormRow><FormLabel htmlFor="organization">Organization</FormLabel><FormInput component="select" id="organization" name="organization" value={formData.organization} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Organization</option>{organizations.map(org => <option key={org.id} value={org.name}>{org.name}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="financialYear">Financial Year</FormLabel><FormInput id="financialYear" name="financialYear" type="text" value={formData.financialYear} isReadOnly={true} /></FormRow>
            {mode !== 'add' && <FormRow><FormLabel htmlFor="scNo">SC No.</FormLabel><FormInput id="scNo" name="scNo" type="text" value={formData.scNo} isReadOnly={true} /></FormRow>}
            <FormRow><FormLabel htmlFor="date">Date</FormLabel><FormInput id="date" name="date" type="date" value={formData.date} isReadOnly={true} /></FormRow>
            <FormRow><FormLabel htmlFor="clientId">Client</FormLabel><FormInput component="select" id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.legal_name}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="vendorId">Vendor</FormLabel><FormInput component="select" id="vendorId" name="vendorId" value={formData.vendorId} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.legal_name}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="agentId">Agent / Sub-broker</FormLabel><FormInput component="select" id="agentId" name="agentId" value={formData.agentId} onChange={handleChange} isReadOnly={readOnly}><option value="">None</option>{agents.map(a => <option key={a.id} value={a.id}>{a.legal_name}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="bargainType">Bargain Type</FormLabel><FormInput component="select" id="bargainType" name="bargainType" value={formData.bargainType} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Bargain Type</option>{masterData.bargainTypes.map(bt => <option key={bt.id} value={bt.name}>{bt.name}</option>)}</FormInput></FormRow>
          </div>
          <div className="space-y-4">
            <FormRow><FormLabel htmlFor="variety">Variety</FormLabel><FormInput component="select" id="variety" name="variety" value={formData.variety} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Variety</option>{masterData.varieties.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="quantityBales">Quantity (Bales)</FormLabel><FormInput id="quantityBales" name="quantityBales" type="number" value={formData.quantityBales} onChange={handleChange} isReadOnly={readOnly} required /></FormRow>
            <FormRow><FormLabel htmlFor="rate">Rate</FormLabel><FormInput id="rate" name="rate" type="number" value={formData.rate} onChange={handleChange} isReadOnly={readOnly} required /></FormRow>
            <FormRow><FormLabel htmlFor="gstRateId">GST on Rate</FormLabel><FormInput component="select" id="gstRateId" name="gstRateId" value={formData.gstRateId ?? ''} onChange={handleChange} isReadOnly={readOnly} required><option value="">No GST</option>{masterData.gstRates.map(gst => <option key={gst.id} value={gst.id}>{gst.description} ({gst.rate}%)</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="location">Station</FormLabel><FormInput component="select" id="location" name="location" value={formData.location} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Station</option>{masterData.locations.map(loc => <option key={loc.id} value={`${loc.state} - ${loc.city}`}>{loc.state} - {loc.city}</option>)}</FormInput></FormRow>
          </div>
        </div>

        <div className="pt-4">
          <h4 className="text-base font-semibold text-slate-800 border-b pb-2 mb-4">Commissions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <FormRow><FormLabel htmlFor="buyerCommissionId">Buyer Commission</FormLabel><FormInput component="select" id="buyerCommissionId" name="buyerCommissionId" value={formData.buyerCommissionId ?? ''} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Commission</option>{masterData.commissions.map(c => <option key={c.id} value={c.id}>{formatCommissionText(c)}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="buyerCommissionGstId">GST on Buyer Comm.</FormLabel><FormInput component="select" id="buyerCommissionGstId" name="buyerCommissionGstId" value={formData.buyerCommissionGstId ?? ''} onChange={handleChange} isReadOnly={readOnly || !formData.buyerCommissionId || formData.buyerCommissionId === 3}><option value="">No GST</option>{masterData.gstRates.map(gst => <option key={gst.id} value={gst.id}>{gst.description} ({gst.rate}%)</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="sellerCommissionId">Seller Commission</FormLabel><FormInput component="select" id="sellerCommissionId" name="sellerCommissionId" value={formData.sellerCommissionId ?? ''} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Commission</option>{masterData.commissions.map(c => <option key={c.id} value={c.id}>{formatCommissionText(c)}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="sellerCommissionGstId">GST on Seller Comm.</FormLabel><FormInput component="select" id="sellerCommissionGstId" name="sellerCommissionGstId" value={formData.sellerCommissionGstId ?? ''} onChange={handleChange} isReadOnly={readOnly || !formData.sellerCommissionId || formData.sellerCommissionId === 3}><option value="">No GST</option>{masterData.gstRates.map(gst => <option key={gst.id} value={gst.id}>{gst.description} ({gst.rate}%)</option>)}</FormInput></FormRow>
          </div>
        </div>

        <div className="pt-4">
          <h4 className="text-base font-semibold text-slate-800 border-b pb-2 mb-4">Commercial Terms</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <FormRow><FormLabel htmlFor="paymentTerms">Payment Terms</FormLabel><FormInput component="select" id="paymentTerms" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Payment Terms</option>{masterData.paymentTerms.map(pt => <option key={pt.id} value={pt.name}>{pt.name}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="deliveryTerms">Delivery Terms</FormLabel><FormInput component="select" id="deliveryTerms" name="deliveryTerms" value={formData.deliveryTerms} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Delivery Terms</option>{masterData.deliveryTerms.map(dt => <option key={dt.id} value={dt.name}>{dt.name}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="weightmentTerms">Weightment Terms</FormLabel><FormInput component="select" id="weightmentTerms" name="weightmentTerms" value={formData.weightmentTerms} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Weightment Terms</option>{masterData.weightmentTerms.map(wt => <option key={wt.id} value={wt.name}>{wt.name}</option>)}</FormInput></FormRow>
            <FormRow><FormLabel htmlFor="passingTerms">Passing Terms</FormLabel><FormInput component="select" id="passingTerms" name="passingTerms" value={formData.passingTerms} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select Passing Terms</option>{masterData.passingTerms.map(pt => <option key={pt.id} value={pt.name}>{pt.name}</option>)}</FormInput></FormRow>
            {formData.tradeType === 'CCI Trade' ? (
                <>
                    <FormRow><FormLabel htmlFor="cciContractNo">CCI Contract No.</FormLabel><FormInput id="cciContractNo" name="cciContractNo" type="text" value={formData.cciContractNo || ''} onChange={handleChange} isReadOnly={readOnly} /></FormRow>
                    <FormRow><FormLabel htmlFor="cciTermId">CCI Terms</FormLabel><FormInput component="select" id="cciTermId" name="cciTermId" value={formData.cciTermId ?? ''} onChange={handleChange} isReadOnly={readOnly} required><option value="">Select CCI Terms</option>{masterData.cciTerms.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}</FormInput></FormRow>
                </>
            ) : (
                <FormRow className="items-start"><FormLabel htmlFor="manualTerms" className="pt-2">Manual Terms</FormLabel><FormInput component="textarea" id="manualTerms" name="manualTerms" value={formData.manualTerms || ''} onChange={handleChange} isReadOnly={readOnly} /></FormRow>
            )}
          </div>
        </div>

        <div className="pt-4">
          <h4 className="text-base font-semibold text-slate-800 border-b pb-2 mb-4">Quality Specifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            <FormRow><FormLabel htmlFor="length">Length</FormLabel><FormInput id="length" name="length" type="text" value={formData.qualitySpecs.length} onChange={handleQualitySpecChange} isReadOnly={readOnly} required /></FormRow>
            <FormRow><FormLabel htmlFor="mic">Mic</FormLabel><FormInput id="mic" name="mic" type="text" value={formData.qualitySpecs.mic} onChange={handleQualitySpecChange} isReadOnly={readOnly} required /></FormRow>
            <FormRow><FormLabel htmlFor="rd">RD</FormLabel><FormInput id="rd" name="rd" type="text" value={formData.qualitySpecs.rd} onChange={handleQualitySpecChange} isReadOnly={readOnly} required /></FormRow>
            <FormRow><FormLabel htmlFor="trash">Trash %</FormLabel><FormInput id="trash" name="trash" type="text" value={formData.qualitySpecs.trash} onChange={handleQualitySpecChange} isReadOnly={readOnly} required /></FormRow>
            <FormRow><FormLabel htmlFor="moisture">Moisture %</FormLabel><FormInput id="moisture" name="moisture" type="text" value={formData.qualitySpecs.moisture} onChange={handleQualitySpecChange} isReadOnly={readOnly} required /></FormRow>
            <FormRow><FormLabel htmlFor="strength">Strength</FormLabel><FormInput id="strength" name="strength" type="text" value={formData.qualitySpecs.strength} onChange={handleQualitySpecChange} isReadOnly={readOnly} required /></FormRow>
          </div>
        </div>

        {mode === 'amend' && !readOnly && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-none">
                <h4 className="font-semibold text-orange-800">Amending Contract</h4>
                <p className="text-sm text-orange-700 mt-1">You are amending this contract. Please provide a reason for this change. A new version of the contract will be created.</p>
                <FormRow className="!items-start mt-3">
                    <FormLabel htmlFor="amendmentReason" className="!pt-2">Reason for Amendment</FormLabel>
                    <FormInput component="textarea" id="amendmentReason" name="amendmentReason" value={amendmentReason} onChange={(e) => setAmendmentReason(e.target.value)} placeholder="e.g., 'Quantity updated as per client request.'" required />
                </FormRow>
            </div>
        )}

        {/* Smart Contract Rule Validation */}
        {showRuleValidation && ruleResults.length > 0 && (
          <div className="mt-4">
            <SmartContractRuleDisplay 
              results={ruleResults}
              onRequestOverride={handleRequestOverride}
            />
          </div>
        )}
      </div>
      <FormActions>
        {!readOnly && <Button type="button" variant="secondary" onClick={handleValidateRules} className="mr-2">🔍 Validate Rules</Button>}
        {!readOnly && <Button type="button" variant="secondary" onClick={handleAiReview} className="mr-auto" disabled={aiStatus === 'loading'}>{aiStatus === 'loading' ? <LoadingSpinner className="w-5 h-5" /> : <AIIcon className="w-5 h-5" />}<span className="ml-2">AI Review</span></Button>}
        <Button type="button" variant="secondary" onClick={onCancel}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && <Button type="submit">{mode === 'amend' ? 'Save Amendment' : 'Save'}</Button>}
      </FormActions>
    </form>
    
    {/* Override Request Modal */}
    {selectedRuleForOverride && (
      <OverrideRequestModal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        ruleId={selectedRuleForOverride.id}
        ruleName={selectedRuleForOverride.name}
        contractId={formData.id || 'NEW'}
        contractNo={formData.scNo || 'NEW CONTRACT'}
        currentUser="Current User"
        onSubmit={handleSubmitOverride}
      />
    )}
    
    {/* AI Review Modal */}
    <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Compliance Assistant">
        {aiStatus === 'loading' && <div className="flex items-center"><LoadingSpinner className="w-5 h-5 mr-3" /><span>Analyzing contract...</span></div>}
        {aiStatus === 'error' && <p className="text-red-600">{aiError}</p>}
        {aiStatus === 'success' && <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br />') }} />}
    </Modal>
    </>
  );
};

export default SalesContractForm;
