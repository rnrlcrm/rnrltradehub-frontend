
import React, { useState, useEffect } from 'react';
import { Dispute, SalesContract } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { mockSalesContracts, mockMasterData } from '../../data/mockData';

interface DisputeFormProps {
  dispute?: Dispute | null;
  readOnly: boolean;
  onSave: (data: Dispute) => void;
  onCancel: () => void;
}

const DisputeForm: React.FC<DisputeFormProps> = ({ dispute, readOnly, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Dispute>(dispute || { 
    id: '', 
    disputeId: '', 
    salesContractId: '', 
    reason: '', 
    status: 'Open', 
    resolution: '', 
    dateRaised: new Date().toISOString().split('T')[0] 
  });
  
  const [selectedContract, setSelectedContract] = useState<SalesContract | null>(null);
  
  // Get only active and disputed sales contracts
  const availableContracts = mockSalesContracts.filter(
    sc => sc.status === 'Active' || sc.status === 'Disputed' || sc.status === 'Completed'
  );

  useEffect(() => {
    if (dispute) {
      setFormData(dispute);
      // Find the contract for this dispute
      const contract = mockSalesContracts.find(sc => sc.scNo === dispute.salesContractId);
      setSelectedContract(contract || null);
    }
  }, [dispute]);

  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contractNo = e.target.value;
    const contract = availableContracts.find(sc => sc.scNo === contractNo);
    
    if (contract) {
      setSelectedContract(contract);
      setFormData(prev => ({
        ...prev,
        salesContractId: contract.scNo,
      }));
    } else {
      setSelectedContract(null);
      setFormData(prev => ({
        ...prev,
        salesContractId: '',
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.salesContractId) {
      alert('Please select a Sales Contract');
      return;
    }
    
    if (!formData.disputeId) {
      alert('Please enter Dispute ID');
      return;
    }
    
    if (!formData.reason) {
      alert('Please enter dispute reason');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <FormRow>
          <FormLabel htmlFor="disputeId">Dispute ID</FormLabel>
          <FormInput 
            name="disputeId" 
            id="disputeId" 
            type="text" 
            value={formData.disputeId} 
            onChange={handleChange} 
            isReadOnly={readOnly || !!dispute}
            placeholder="DISP-001"
            required 
          />
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="salesContractId">Sales Contract *</FormLabel>
          <FormInput 
            component="select" 
            name="salesContractId" 
            id="salesContractId" 
            value={formData.salesContractId} 
            onChange={handleContractChange} 
            isReadOnly={readOnly}
            required
          >
            <option value="">-- Select Sales Contract --</option>
            {availableContracts.map(sc => (
              <option key={sc.id} value={sc.scNo}>
                {sc.scNo} - {sc.clientName} vs {sc.vendorName}
              </option>
            ))}
          </FormInput>
        </FormRow>
        
        {selectedContract && (
          <>
            <FormRow>
              <FormLabel htmlFor="contractDetails">Contract Details</FormLabel>
              <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                <p><strong>Seller:</strong> {selectedContract.vendorName}</p>
                <p><strong>Buyer:</strong> {selectedContract.clientName}</p>
                <p><strong>Variety:</strong> {selectedContract.variety}</p>
                <p><strong>Quantity:</strong> {selectedContract.quantityBales} bales</p>
                <p><strong>Contract Value:</strong> ₹{(selectedContract.quantityBales * selectedContract.rate).toLocaleString('en-IN')}</p>
                <p><strong>Current Status:</strong> <span className={selectedContract.status === 'Disputed' ? 'text-red-600' : ''}>{selectedContract.status}</span></p>
              </div>
            </FormRow>
          </>
        )}
        
        <FormRow>
          <FormLabel htmlFor="dateRaised">Date Raised *</FormLabel>
          <FormInput 
            name="dateRaised" 
            id="dateRaised" 
            type="date" 
            value={formData.dateRaised} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            required 
          />
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="reason">Dispute Reason *</FormLabel>
          <FormInput 
            component="select" 
            name="reason" 
            id="reason" 
            value={formData.reason} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            required
          >
            <option value="">-- Select Reason --</option>
            {mockMasterData.disputeReasons.map(reason => (
              <option key={reason.id} value={reason.name}>
                {reason.name}
              </option>
            ))}
          </FormInput>
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="status">Status</FormLabel>
          <FormInput 
            component="select" 
            name="status" 
            id="status" 
            value={formData.status} 
            onChange={handleChange} 
            isReadOnly={readOnly}
          >
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </FormInput>
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="resolution">Resolution / Notes</FormLabel>
          <FormInput 
            component="textarea" 
            name="resolution" 
            id="resolution" 
            value={formData.resolution} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            placeholder="Enter resolution details or notes about the dispute..."
          />
        </FormRow>
      </div>
      
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && <Button type="submit">Save Dispute</Button>}
      </FormActions>
    </form>
  );
};

export default DisputeForm;
