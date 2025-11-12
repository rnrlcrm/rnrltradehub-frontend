/**
 * Self-Service Onboarding Page
 * Allows users to register their company without back-office intervention
 * 
 * Features:
 * - Public access (no login required)
 * - Step-by-step wizard
 * - Auto-validation
 * - Document upload
 * - Status tracking
 */

import React, { useState } from 'react';
import { selfOnboardingApi } from '../api/selfOnboardingApi';
import { SelfOnboardingRequest } from '../types/selfOnboarding';
import { Button } from '../components/ui/Form';
import { DataEntryAutomation } from '../services/automation';

type Step = 'company' | 'contact' | 'compliance' | 'branch' | 'documents' | 'review' | 'complete';

const SelfOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('company');
  const [formData, setFormData] = useState<Partial<SelfOnboardingRequest>>({
    businessType: 'BUYER',
    country: 'India',
    agreeToTerms: false,
    agreeToPrivacyPolicy: false,
  });
  const [documents, setDocuments] = useState<{
    panCard?: File;
    gstCertificate?: File;
    addressProof?: File;
    cancelledCheque?: File;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');

  const steps: { id: Step; title: string; description: string }[] = [
    { id: 'company', title: 'Company Info', description: 'Basic company details' },
    { id: 'contact', title: 'Contact Details', description: 'Your contact information' },
    { id: 'compliance', title: 'Compliance', description: 'PAN, GST, etc.' },
    { id: 'branch', title: 'Branch Details', description: 'Optional - can add later' },
    { id: 'documents', title: 'Documents', description: 'Upload documents' },
    { id: 'review', title: 'Review', description: 'Review and submit' },
  ];

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    if (file) {
      setDocuments(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleGSTChange = async (gst: string) => {
    handleChange('gstNumber', gst);
    
    // Auto-populate from GST
    if (gst.length === 15) {
      const data = await DataEntryAutomation.autoPopulateBranchFromGST(gst);
      if (data) {
        handleChange('state', data.state);
        if (!formData.pan) {
          handleChange('pan', data.panNumber);
        }
      }
    }
  };

  const validateStep = (step: Step): string | null => {
    switch (step) {
      case 'company':
        if (!formData.legalName) return 'Company name is required';
        if (!formData.businessType) return 'Business type is required';
        break;
      case 'contact':
        if (!formData.contactPerson) return 'Contact person is required';
        if (!formData.contactEmail) return 'Email is required';
        if (!formData.contactPhone) return 'Phone is required';
        break;
      case 'compliance':
        if (!formData.pan) return 'PAN is required';
        if (!DataEntryAutomation.validatePAN(formData.pan)) return 'Invalid PAN format';
        if (formData.gstNumber && !DataEntryAutomation.validateGST(formData.gstNumber)) {
          return 'Invalid GST format';
        }
        if (!formData.addressLine1) return 'Address is required';
        if (!formData.city) return 'City is required';
        if (!formData.state) return 'State is required';
        if (!formData.pincode) return 'Pincode is required';
        break;
      case 'review':
        if (!formData.agreeToTerms) return 'You must agree to terms and conditions';
        if (!formData.agreeToPrivacyPolicy) return 'You must agree to privacy policy';
        break;
    }
    return null;
  };

  const handleNext = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await selfOnboardingApi.selfRegister({
        ...formData,
        documents,
      } as SelfOnboardingRequest);
      
      setPartnerCode(response.partnerCode);
      setRegistrationComplete(true);
      setCurrentStep('complete' as Step);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful!</h2>
              <p className="text-lg text-slate-600 mb-6">
                Your partner code: <span className="font-mono font-bold text-blue-600">{partnerCode}</span>
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">What Happens Next?</h3>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <span>Your application will be reviewed by our team (typically 2-3 business days)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <span>You will receive an email notification when your application is approved</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <span>The email will contain your login credentials and a temporary password</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">4.</span>
                    <span>You must change your password on first login for security</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">5.</span>
                    <span>Once logged in, you can add branches, documents, and invite sub-users</span>
                  </li>
                </ol>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.href = '/#login'}
                  className="w-full"
                >
                  Go to Login Page
                </Button>
                
                <Button
                  onClick={() => {
                    setRegistrationComplete(false);
                    setCurrentStep('company');
                    setFormData({
                      businessType: 'BUYER',
                      country: 'India',
                      agreeToTerms: false,
                      agreeToPrivacyPolicy: false,
                    });
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Register Another Company
                </Button>
              </div>
              
              <p className="text-xs text-slate-500 mt-6">
                Need help? Contact us at <a href="mailto:support@rnrltradehub.com" className="text-blue-600 hover:underline">support@rnrltradehub.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Business Partner Registration</h1>
          <p className="text-slate-600 mt-2">Register your company to join RNRL TradeHub</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : steps.findIndex(s => s.id === currentStep) > index
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {steps.findIndex(s => s.id === currentStep) > index ? '✓' : index + 1}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs font-medium text-slate-700">{step.title}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 ${
                    steps.findIndex(s => s.id === currentStep) > index ? 'bg-green-500' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Company Info Step */}
          {currentStep === 'company' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Company Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Legal Company Name *
                </label>
                <input
                  type="text"
                  value={formData.legalName || ''}
                  onChange={(e) => handleChange('legalName', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="ABC Corporation Pvt. Ltd."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Trade Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.tradeName || ''}
                  onChange={(e) => handleChange('tradeName', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="ABC Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="BUYER">Buyer - Purchases cotton</option>
                  <option value="SELLER">Seller - Sells cotton</option>
                  <option value="TRADER">Trader - Both buying and selling</option>
                  <option value="SUB_BROKER">Sub Broker - Commission sharing partner</option>
                  <option value="TRANSPORTER">Transporter - Logistics and transportation</option>
                  <option value="CONTROLLER">Controller - Quality control and disputes</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Select the type that best describes your business
                </p>
              </div>
            </div>
          )}

          {/* Contact Details Step */}
          {currentStep === 'contact' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Contact Details</h2>
              <p className="text-sm text-slate-600 mb-4">
                These details will be used to create your user account
              </p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  value={formData.contactPerson || ''}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="john@company.com"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  This will be your login email address
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone || ''}
                  onChange={(e) => handleChange('contactPhone', DataEntryAutomation.formatPhoneNumber(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="+91-9876543210"
                  required
                />
              </div>
            </div>
          )}

          {/* Compliance Step */}
          {currentStep === 'compliance' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Compliance & Address</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  PAN Number *
                </label>
                <input
                  type="text"
                  value={formData.pan || ''}
                  onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono"
                  placeholder="AAAAA0000A"
                  maxLength={10}
                  required
                />
                {formData.pan && !DataEntryAutomation.validatePAN(formData.pan) && (
                  <p className="text-xs text-red-600 mt-1">Invalid PAN format</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.gstNumber || ''}
                  onChange={(e) => handleGSTChange(e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono"
                  placeholder="27AAAAA0000A1Z5"
                  maxLength={15}
                />
                {formData.gstNumber && !DataEntryAutomation.validateGST(formData.gstNumber) && (
                  <p className="text-xs text-red-600 mt-1">Invalid GST format</p>
                )}
                {formData.gstNumber && DataEntryAutomation.validateGST(formData.gstNumber) && (
                  <p className="text-xs text-green-600 mt-1">✓ State auto-populated from GST</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CIN (Optional)
                </label>
                <input
                  type="text"
                  value={formData.cin || ''}
                  onChange={(e) => handleChange('cin', e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono"
                  placeholder="U12345MH2020PTC123456"
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold text-slate-700 mb-3">Registered Address</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine1 || ''}
                      onChange={(e) => handleChange('addressLine1', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => handleChange('state', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pincode *</label>
                    <input
                      type="text"
                      value={formData.pincode || ''}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Branch Step (Optional) */}
          {currentStep === 'branch' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Branch Details (Optional)</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  You can skip this step and add branches later from your dashboard
                </p>
              </div>
              
              {/* Branch form fields - similar to compliance but for branch */}
              <p className="text-sm text-slate-600">
                Add your first branch location with GST and banking details
              </p>
            </div>
          )}

          {/* Documents Step (Optional) */}
          {currentStep === 'documents' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Upload Documents (Optional)</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  You can skip this step and upload documents later from your dashboard
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PAN Card</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('panCard', e.target.files?.[0] || null)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GST Certificate</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('gstCertificate', e.target.files?.[0] || null)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address Proof</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('addressProof', e.target.files?.[0] || null)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cancelled Cheque</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('cancelledCheque', e.target.files?.[0] || null)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Review & Submit</h2>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-600">Company Name</p>
                  <p className="font-semibold text-slate-800">{formData.legalName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Business Type</p>
                  <p className="font-semibold text-slate-800">{formData.businessType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Contact Person</p>
                  <p className="font-semibold text-slate-800">{formData.contactPerson}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Email</p>
                  <p className="font-semibold text-slate-800">{formData.contactEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">PAN</p>
                  <p className="font-semibold text-slate-800 font-mono">{formData.pan}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                    className="mt-1 mr-2"
                    required
                  />
                  <span className="text-sm text-slate-700">
                    I agree to the <a href="#terms" className="text-blue-600 hover:underline">Terms and Conditions</a>
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.agreeToPrivacyPolicy}
                    onChange={(e) => handleChange('agreeToPrivacyPolicy', e.target.checked)}
                    className="mt-1 mr-2"
                    required
                  />
                  <span className="text-sm text-slate-700">
                    I agree to the <a href="#privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> After submission, your application will be reviewed by our team. 
                  You will receive an email with login credentials once approved (typically 2-3 business days).
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentStep === 'company'}
            >
              Previous
            </Button>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => window.location.href = '/#login'}
              >
                Cancel
              </Button>
              
              {currentStep !== 'review' ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.agreeToTerms || !formData.agreeToPrivacyPolicy}
                  className="!bg-green-600 hover:!bg-green-700"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-600">
          <p>
            Already have an account?{' '}
            <a href="/#login" className="text-blue-600 hover:text-blue-700 font-medium">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelfOnboarding;
