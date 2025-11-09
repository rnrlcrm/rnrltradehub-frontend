import React, { useState, useEffect } from 'react';
import { Commission } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { mockSalesContracts } from '../../data/mockData';

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
      
      // Auto-calculate commission based on contract
      // Assuming commission is calculated from contract value
      const commissionRate = 0.02; // 2% default commission rate
      const calculatedCommission = contract.quantity * contract.rate * commissionRate;
      
      setFormData(prev => ({
        ...prev,
        salesContractId: scNo,
        amount: calculatedCommission,
        agent: contract.agent || '',
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
            isReadOnly={readOnly}
            required
            min="0"
            step="0.01"
          />
        </FormRow>

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
