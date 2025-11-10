import React, { useState, useEffect } from 'react';
import { Commission, BusinessPartner } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { mockSalesContracts, mockBusinessPartners } from '../../data/mockData';
import { calculateGST, GST_RATES } from '../../utils/gstCalculations';

interface CommissionFormProps {
  commission?: Commission | null;
  readOnly: boolean;
  onSave: (data: Omit<Commission, 'id'>) => void;
  onCancel: () => void;
}

const getInitialState = (): Omit<Commission, 'id'> => ({
  commissionId: '',
  salesContractId: '',
  agent: '',
  amount: 0,
  status: 'Due',
  dueDate: '',
  paidDate: '',
  taxableAmount: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  gstRate: GST_RATES.STANDARD_SERVICES,
  totalAmount: 0,
  agentState: '',
  companyState: 'Maharashtra', // Our company's default state
  isInterState: false,
});

const CommissionForm: React.FC<CommissionFormProps> = ({ commission, readOnly, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Commission, 'id'>>(getInitialState());
  const [selectedContract, setSelectedContract] = useState<any>(null);

  // Available contracts for selection
  const availableContracts = mockSalesContracts.filter(sc => 
    sc.status === 'Active' || sc.status === 'Completed'
  );

  useEffect(() => {
    if (commission) {
      setFormData({ ...commission });
      const contract = availableContracts.find(sc => sc.scNo === commission.salesContractId);
      setSelectedContract(contract);
    } else {
      const newId = `COMM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      setFormData({ ...getInitialState(), commissionId: newId });
    }
  }, [commission]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scNo = e.target.value;
    const contract = availableContracts.find(sc => sc.scNo === scNo);
    
    if (contract) {
      setSelectedContract(contract);
      
      // Get agent's business partner to determine state
      const agent = mockBusinessPartners.find(bp => 
        bp.name === contract.agent || 
        (contract.agentId && bp.id === contract.agentId)
      );
      
      // Auto-calculate commission based on contract
      const commissionRate = 0.02; // 2% default commission rate
      const baseCommission = contract.quantityBales * contract.rate * commissionRate;
      
      // Commission GST rate is 18% (service)
      const gstRate = GST_RATES.STANDARD_SERVICES;
      
      // Our company state (receiver of commission)
      const companyState = 'Maharashtra';
      const agentState = agent?.state || 'Gujarat'; // Default if not found
      
      // Calculate GST on commission
      const gstCalc = calculateGST(baseCommission, agentState, companyState, gstRate);
      
      setFormData(prev => ({
        ...prev,
        salesContractId: scNo,
        amount: baseCommission,
        agent: contract.agent || '',
        taxableAmount: gstCalc.taxableAmount,
        cgst: gstCalc.cgst,
        sgst: gstCalc.sgst,
        igst: gstCalc.igst,
        gstRate: gstCalc.gstRate,
        totalAmount: gstCalc.totalAmount,
        agentState: agentState,
        companyState: companyState,
        isInterState: gstCalc.isInterState,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <FormRow>
          <FormLabel htmlFor="commissionId">Commission ID *</FormLabel>
          <FormInput 
            id="commissionId" 
            name="commissionId" 
            type="text" 
            value={formData.commissionId} 
            onChange={handleChange} 
            isReadOnly={true}
            required
          />
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="salesContractId">Sales Contract *</FormLabel>
          <FormInput 
            component="select"
            id="salesContractId" 
            name="salesContractId" 
            value={formData.salesContractId} 
            onChange={handleContractChange}
            isReadOnly={readOnly}
            required
          >
            <option value="">-- Select Sales Contract --</option>
            {availableContracts.map(sc => (
              <option key={sc.id} value={sc.scNo}>
                {sc.scNo} - {sc.clientName} ({sc.commodityType}) - ₹{(sc.quantity * sc.rate).toLocaleString('en-IN')}
              </option>
            ))}
          </FormInput>
        </FormRow>

        {selectedContract && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
            <p className="font-semibold text-blue-900 mb-1">Contract Details:</p>
            <p className="text-blue-800">Seller: {selectedContract.seller}</p>
            <p className="text-blue-800">Buyer: {selectedContract.buyer}</p>
            <p className="text-blue-800">Quantity: {selectedContract.quantity} bales</p>
            <p className="text-blue-800">Rate: ₹{selectedContract.rate.toLocaleString('en-IN')}/bale</p>
            <p className="text-blue-800">Total Value: ₹{(selectedContract.quantity * selectedContract.rate).toLocaleString('en-IN')}</p>
            <p className="text-blue-800">Agent: {selectedContract.agent || 'Not assigned'}</p>
          </div>
        )}
        
        <FormRow>
          <FormLabel htmlFor="agent">Agent/Broker *</FormLabel>
          <FormInput 
            id="agent" 
            name="agent" 
            type="text" 
            value={formData.agent} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            required
          />
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="amount">Commission Amount (₹) *</FormLabel>
          <FormInput 
            id="amount" 
            name="amount" 
            type="number" 
            value={formData.amount} 
            onChange={handleChange} 
            isReadOnly={true}
            required
            min="0"
            step="0.01"
          />
        </FormRow>
        
        {selectedContract && formData.amount > 0 && (
          <FormRow>
            <FormLabel>GST on Commission</FormLabel>
            <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span><strong>Agent State:</strong></span>
                <span>{formData.agentState || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span><strong>Company State:</strong></span>
                <span>{formData.companyState || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span><strong>Transaction Type:</strong></span>
                <span className="font-semibold text-blue-600">
                  {formData.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                </span>
              </div>
              <hr className="border-yellow-300" />
              <div className="flex justify-between">
                <span><strong>Commission Amount:</strong></span>
                <span>₹{formData.taxableAmount?.toLocaleString('en-IN') || '0'}</span>
              </div>
              {formData.isInterState ? (
                <div className="flex justify-between text-green-700">
                  <span><strong>IGST @ {formData.gstRate}%:</strong></span>
                  <span>₹{formData.igst?.toLocaleString('en-IN') || '0'}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-green-700">
                    <span><strong>CGST @ {(formData.gstRate || 0) / 2}%:</strong></span>
                    <span>₹{formData.cgst?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span><strong>SGST @ {(formData.gstRate || 0) / 2}%:</strong></span>
                    <span>₹{formData.sgst?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                </>
              )}
              <hr className="border-yellow-300" />
              <div className="flex justify-between font-bold text-lg text-blue-800">
                <span>Total Commission (including GST):</span>
                <span>₹{formData.totalAmount?.toLocaleString('en-IN') || '0'}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                * GST @ {formData.gstRate}% is applicable on commission services
              </p>
            </div>
          </FormRow>
        )}
        
        <FormRow>
          <FormLabel htmlFor="status">Status *</FormLabel>
          <FormInput 
            component="select"
            id="status" 
            name="status" 
            value={formData.status} 
            onChange={handleChange}
            isReadOnly={readOnly}
            required
          >
            <option value="Due">Due</option>
            <option value="Paid">Paid</option>
          </FormInput>
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="dueDate">Due Date</FormLabel>
          <FormInput 
            id="dueDate" 
            name="dueDate" 
            type="date" 
            value={formData.dueDate} 
            onChange={handleChange} 
            isReadOnly={readOnly}
          />
        </FormRow>

        {formData.status === 'Paid' && (
          <FormRow>
            <FormLabel htmlFor="paidDate">Paid Date</FormLabel>
            <FormInput 
              id="paidDate" 
              name="paidDate" 
              type="date" 
              value={formData.paidDate} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            />
          </FormRow>
        )}
      </div>
      
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && <Button type="submit">Save Commission</Button>}
      </FormActions>
    </form>
  );
};

export default CommissionForm;
