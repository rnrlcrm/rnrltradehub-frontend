import React, { useState, useEffect } from 'react';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface CommissionPayment {
  id?: number;
  paymentId: string;
  commissionId: string;
  agent: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNo: string;
  remarks: string;
}

interface CommissionPaymentFormProps {
  commissions: any[]; // List of due commissions
  payment?: CommissionPayment | null;
  readOnly: boolean;
  onSave: (data: Omit<CommissionPayment, 'id'>) => void;
  onCancel: () => void;
}

const getInitialState = (): Omit<CommissionPayment, 'id'> => ({
  paymentId: '',
  commissionId: '',
  agent: '',
  amount: 0,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'Bank Transfer',
  referenceNo: '',
  remarks: '',
});

const CommissionPaymentForm: React.FC<CommissionPaymentFormProps> = ({ 
  commissions, 
  payment, 
  readOnly, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Omit<CommissionPayment, 'id'>>(getInitialState());
  const [selectedCommission, setSelectedCommission] = useState<any>(null);

  // Filter to show only due commissions
  const dueCommissions = commissions.filter(c => c.status === 'Due');

  useEffect(() => {
    if (payment) {
      setFormData({ ...payment });
      const commission = dueCommissions.find(c => c.commissionId === payment.commissionId);
      setSelectedCommission(commission);
    } else {
      const newId = `CP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      setFormData({ ...getInitialState(), paymentId: newId });
    }
  }, [payment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const commissionId = e.target.value;
    const commission = dueCommissions.find(c => c.commissionId === commissionId);
    
    if (commission) {
      setSelectedCommission(commission);
      setFormData(prev => ({
        ...prev,
        commissionId: commissionId,
        agent: commission.agent,
        amount: commission.amount,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Payment amount should not exceed commission amount
    if (selectedCommission && formData.amount > selectedCommission.amount) {
      alert('Payment amount cannot exceed commission amount');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <FormRow>
          <FormLabel htmlFor="paymentId">Payment ID *</FormLabel>
          <FormInput 
            id="paymentId" 
            name="paymentId" 
            type="text" 
            value={formData.paymentId} 
            onChange={handleChange} 
            isReadOnly={true}
            required
          />
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="commissionId">Commission *</FormLabel>
          <FormInput 
            component="select"
            id="commissionId" 
            name="commissionId" 
            value={formData.commissionId} 
            onChange={handleCommissionChange}
            isReadOnly={readOnly}
            required
          >
            <option value="">-- Select Commission --</option>
            {dueCommissions.map(comm => (
              <option key={comm.id} value={comm.commissionId}>
                {comm.commissionId} - {comm.agent} - SC: {comm.salesContractId} - ₹{comm.amount.toLocaleString('en-IN')}
              </option>
            ))}
          </FormInput>
        </FormRow>

        {selectedCommission && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
            <p className="font-semibold text-green-900 mb-1">Commission Details:</p>
            <p className="text-green-800">Commission ID: {selectedCommission.commissionId}</p>
            <p className="text-green-800">Sales Contract: {selectedCommission.salesContractId}</p>
            <p className="text-green-800">Agent: {selectedCommission.agent}</p>
            <p className="text-green-800">Due Amount: ₹{selectedCommission.amount.toLocaleString('en-IN')}</p>
            <p className="text-green-800">Status: {selectedCommission.status}</p>
          </div>
        )}
        
        <FormRow>
          <FormLabel htmlFor="agent">Agent/Broker</FormLabel>
          <FormInput 
            id="agent" 
            name="agent" 
            type="text" 
            value={formData.agent} 
            onChange={handleChange} 
            isReadOnly={true}
          />
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="amount">Payment Amount (₹) *</FormLabel>
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
            max={selectedCommission?.amount}
          />
          {selectedCommission && (
            <p className="text-xs text-slate-500 mt-1">
              Maximum: ₹{selectedCommission.amount.toLocaleString('en-IN')}
            </p>
          )}
        </FormRow>

        <FormRow>
          <FormLabel htmlFor="paymentDate">Payment Date *</FormLabel>
          <FormInput 
            id="paymentDate" 
            name="paymentDate" 
            type="date" 
            value={formData.paymentDate} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            required
          />
        </FormRow>

        <FormRow>
          <FormLabel htmlFor="paymentMethod">Payment Method *</FormLabel>
          <FormInput 
            component="select"
            id="paymentMethod" 
            name="paymentMethod" 
            value={formData.paymentMethod} 
            onChange={handleChange}
            isReadOnly={readOnly}
            required
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="RTGS">RTGS</option>
            <option value="NEFT">NEFT</option>
          </FormInput>
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="referenceNo">Reference/Transaction No.</FormLabel>
          <FormInput 
            id="referenceNo" 
            name="referenceNo" 
            type="text" 
            value={formData.referenceNo} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            placeholder="UTR/Cheque/Transaction number"
          />
        </FormRow>

        <FormRow>
          <FormLabel htmlFor="remarks">Remarks</FormLabel>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            readOnly={readOnly}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional notes or remarks"
          />
        </FormRow>
      </div>
      
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && <Button type="submit">Record Payment</Button>}
      </FormActions>
    </form>
  );
};

export default CommissionPaymentForm;
