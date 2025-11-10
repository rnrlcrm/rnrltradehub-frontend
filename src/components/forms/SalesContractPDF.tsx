
import React from 'react';
import { SalesContract, BusinessPartner, CciTerm, StructuredTerm, GstRate, CommissionStructure } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '../ui/Form';

interface SalesContractPDFProps {
  contract: SalesContract;
  buyer: BusinessPartner;
  seller: BusinessPartner;
  cciTerm: CciTerm | null;
  deliveryTerm: StructuredTerm | undefined;
  masterData: {
    gstRates: GstRate[];
    commissions: CommissionStructure[];
  }
}

const sealImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAMAAAC34X50AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQAAAD9CUP/+/v///0BCUP////7+/v39/f7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v-h827969114.scf.usercontent.goog/1d862234-0450-4859-ba8e-e940e25ac226:179:25";

const PDFSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`mt-6 ${className}`}>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b-2 border-slate-300 pb-1 mb-2">{title}</h3>
        {children}
    </div>
);

const PDFField: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={`flex justify-between py-1.5 border-b border-dotted ${className}`}>
        <span className="font-semibold text-slate-600">{label}:</span>
        <span className="text-right text-slate-800">{value || '-'}</span>
    </div>
);

const PartyDetails: React.FC<{ title: string; partner: BusinessPartner }> = ({ title, partner }) => (
    <div>
        <h2 className="text-base font-bold text-slate-600 uppercase">{title}</h2>
        <p className="font-semibold text-lg text-slate-800 mt-2">{partner.legal_name}</p>
        <p className="text-sm text-slate-600 mt-1">
            {partner.address_line1}<br />
            {partner.city}, {partner.state} - {partner.pincode}<br />
            {partner.country}
        </p>
        <p className="text-sm text-slate-600 mt-2">
            <strong>GSTIN:</strong> {partner.gstin}<br />
            <strong>PAN:</strong> {partner.pan}
        </p>
    </div>
);

const CciTermDetails: React.FC<{ term: CciTerm }> = ({ term }) => (
    <div className="text-sm text-slate-700 mt-2 grid grid-cols-2 gap-x-8 gap-y-1">
        <p><strong>Contract Period:</strong> {term.contract_period_days} days</p>
        <p><strong>EMD Payment:</strong> Within {term.emd_payment_days} days</p>
        <p><strong>Cash Discount:</strong> {term.cash_discount_percentage}%</p>
        <p><strong>Additional Deposit:</strong> {term.additional_deposit_percent}%</p>
        <p><strong>Deposit Interest:</strong> {term.deposit_interest_percent}% p.a.</p>
        <p><strong>Free Lifting Period:</strong> {term.free_lifting_period_days} days</p>
        <p><strong>Carrying Charge (Tier 1):</strong> {term.carrying_charge_tier1_percent}% for first {term.carrying_charge_tier1_days} days</p>
        <p><strong>Carrying Charge (Tier 2):</strong> {term.carrying_charge_tier2_percent}% for next {term.carrying_charge_tier2_days} days</p>
        <p><strong>Late Lifting (Tier 1):</strong> {term.late_lifting_tier1_percent}% for first {term.late_lifting_tier1_days} days</p>
        <p><strong>Late Lifting (Tier 2):</strong> {term.late_lifting_tier2_percent}% for next {term.late_lifting_tier2_days} days</p>
        <p><strong>Late Lifting (Tier 3):</strong> {term.late_lifting_tier3_percent}% thereafter</p>
    </div>
);

const formatCommissionForPDF = (commission?: CommissionStructure, gst?: GstRate): string => {
    if (!commission || commission.name === 'None') {
        return 'None';
    }

    let valueStr = '';
    if (commission.type === 'PERCENTAGE') {
        valueStr = `${commission.value}%`;
    } else {
        valueStr = `₹${commission.value}/Bale`;
    }

    if (gst) {
        return `${valueStr} + ${gst.rate}% GST`;
    }

    return valueStr;
};


const SalesContractPDF: React.FC<SalesContractPDFProps> = ({ contract, buyer, seller, cciTerm, deliveryTerm, masterData }) => {
  const shippingAddress = buyer.shipping_addresses.find(a => a.is_default) || buyer.shipping_addresses[0];
  const gstRate = masterData.gstRates.find(g => g.id === contract.gstRateId);
  const buyerCommission = masterData.commissions.find(c => c.id === contract.buyerCommissionId);
  const sellerCommission = masterData.commissions.find(c => c.id === contract.sellerCommissionId);
  const buyerCommissionGst = masterData.gstRates.find(g => g.id === contract.buyerCommissionGstId);
  const sellerCommissionGst = masterData.gstRates.find(g => g.id === contract.sellerCommissionGstId);

  const baseAmount = contract.rate * contract.quantityBales * 0.48;
  const gstAmount = gstRate ? baseAmount * (gstRate.rate / 100) : 0;
  const totalAmount = baseAmount + gstAmount;

  const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  const handleDownloadPdf = () => {
    const input = document.getElementById('pdf-content');
    if (input) {
        html2canvas(input, { scale: 2 })
            .then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const imgX = (pdfWidth - imgWidth * ratio) / 2;
                const imgY = 10;
                pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
                pdf.save(`SalesContract-${contract.scNo}.pdf`);
            });
    }
  };

  return (
    <div>
        <div className="p-4 bg-slate-100 rounded-none mb-4 flex justify-end">
            <Button onClick={handleDownloadPdf}>Download PDF</Button>
        </div>
        <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg" id="pdf-content">
            <div className="flex justify-between items-start pb-4 border-b-4 border-blue-700">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">{contract.organization}</h1>
                    <p className="text-slate-500">Sales Contract</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{contract.scNo}</p>
                    <p className="text-slate-600">Date: {contract.date}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 my-8">
                <PartyDetails title="Seller" partner={seller} />
                <PartyDetails title="Buyer" partner={buyer} />
            </div>
            
            {shippingAddress && (
                <div className="mt-4 mb-8">
                    <h3 className="text-base font-bold text-slate-600 uppercase">Ship-To Address</h3>
                    <p className="text-sm text-slate-700 mt-1">
                        {shippingAddress.address_line1}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                    </p>
                </div>
            )}

            <PDFSection title="Contract Details">
                <div className="grid grid-cols-2 gap-x-8">
                    <PDFField label="Bargain Type" value={contract.bargainType} />
                    <PDFField label="Trade Type" value={contract.tradeType} />
                    <PDFField label="Variety" value={contract.variety} />
                    <PDFField label="Quantity" value={`${contract.quantityBales} Bales`} />
                    <PDFField label="Rate" value={`${currencyFormatter.format(contract.rate)} per Candy`} />
                    {gstRate && <PDFField label={`GST on Rate (${gstRate.rate}%)`} value={`HSN: ${gstRate.hsnCode}`} />}
                    {contract.tradeType === 'CCI Trade' && <PDFField label="CCI Contract No." value={contract.cciContractNo} />}
                </div>
            </PDFSection>

            <PDFSection title="Contract Value Breakdown">
                <PDFField label="Base Amount" value={currencyFormatter.format(baseAmount)} />
                <PDFField label={`GST (${gstRate?.rate || 0}%)`} value={currencyFormatter.format(gstAmount)} />
                <PDFField label="Total Amount" value={currencyFormatter.format(totalAmount)} className="font-bold" />
                <p className="text-xs text-slate-500 mt-1">* All amounts are approximate, calculated based on a bale-to-candy conversion factor of 0.48. Final value as per invoice.</p>
            </PDFSection>

            <PDFSection title="Quality Specifications" className="mt-6">
                <div className="grid grid-cols-3 gap-x-8">
                    <PDFField label="Length" value={contract.qualitySpecs.length} />
                    <PDFField label="Mic" value={contract.qualitySpecs.mic} />
                    <PDFField label="Strength" value={contract.qualitySpecs.strength} />
                    <PDFField label="RD" value={contract.qualitySpecs.rd} />
                    <PDFField label="Trash %" value={contract.qualitySpecs.trash} />
                    <PDFField label="Moisture %" value={contract.qualitySpecs.moisture} />
                </div>
            </PDFSection>

            <PDFSection title="Commercial & Logistical Terms" className="mt-6">
                <div className="grid grid-cols-2 gap-x-8">
                    <PDFField label="Payment Terms" value={contract.paymentTerms} />
                    <PDFField label="Delivery Terms" value={deliveryTerm ? `${deliveryTerm.name} (${deliveryTerm.days} days)` : contract.deliveryTerms} />
                    <PDFField label="Station" value={contract.location} />
                    <PDFField label="Weightment Terms" value={contract.weightmentTerms} />
                    <PDFField label="Passing Terms" value={contract.passingTerms} />
                    <PDFField label="Buyer Commission" value={formatCommissionForPDF(buyerCommission, buyerCommissionGst)} />
                    <PDFField label="Seller Commission" value={formatCommissionForPDF(sellerCommission, sellerCommissionGst)} />
                </div>
                {contract.tradeType === 'CCI Trade' && cciTerm ? (
                    <div className="mt-4 p-4 bg-slate-50 rounded-none border border-slate-200">
                        <p className="text-sm font-semibold text-slate-800">As per CCI Terms: <span className="font-bold">{cciTerm.name}</span></p>
                        <CciTermDetails term={cciTerm} />
                    </div>
                ) : (
                    <div className="mt-4">
                        <p className="text-sm font-semibold text-slate-800">Manual Terms:</p>
                        <p className="text-sm text-slate-700 mt-1">{contract.manualTerms || 'N/A'}</p>
                    </div>
                )}
            </PDFSection>

            <PDFSection title="Terms & Conditions" className="mt-6">
                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                    <li>Company shall not be legally responsible for any disputes if arises between the seller & buyer of any type.</li>
                    <li>In case of non delivery or fail to fulfill contract, the contract will be settled amicably as per CAI rules, bye laws & arbitration.</li>
                    <li>Sale Confirmation incorporates rules & by laws of the &quot;CAI&quot; in force at the time this contract was entered into.</li>
                    <li>The brokerage is required to be paid contract-wise immediately on receipt of 100% principal amount within 15 days.</li>
                    <li>Initial KYC is mandatory between the buyer and seller.</li>
                    <li>Kindly sign & send us the same for your acceptance & if not replied within 48 hrs, it will be termed as accepted by you.</li>
                </ol>
            </PDFSection>

            <div className="mt-16 pt-8">
                <p className="mb-2">Yours Faithfully,</p>
                <div className="w-1/3">
                    <img src={sealImageBase64} alt="Company Seal" className="h-32 w-32" />
                    <div className="border-t-2 border-slate-400 mt-2 pt-1">
                        <p className="font-semibold text-slate-800">For {contract.organization}</p>
                        <p className="text-sm text-slate-600">Authorised Signatory</p>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-slate-400 mt-12 pt-4 border-t">
                <p>This is a computer-generated document and does not require a physical signature.</p>
                <p>RNRL ERP System - Contract Version: {contract.version} | Generated on: {new Date().toLocaleString()}</p>
            </div>
        </div>
    </div>
  );
};

export default SalesContractPDF;
