/**
 * Partner Registration - Simple & Seamless
 * Can be used for self-service, chatbot, or back-office
 * 
 * Features:
 * - Very simple 7-step wizard
 * - Mandatory email & mobile OTP verification
 * - Conditional GST requirements
 * - Real-time validation
 * - Auto-save progress
 * - Minimal clicks
 */

import React, { useState, useEffect } from 'react';
import { 
  PartnerRegistrationRequest,
  BusinessPartnerType,
  RegistrationType,
  RegistrationSource,
  DocumentType,
} from '../types/businessPartner';
import { businessPartnerApi } from '../api/businessPartnerApi';
import LocationSelector from '../components/LocationSelector';
import { useLocations } from '../hooks/useLocations';

interface Props {
  source?: RegistrationSource;
  onComplete?: (partnerCode: string) => void;
  onCancel?: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const PartnerRegistration: React.FC<Props> = ({ 
  source = 'SELF_SERVICE',
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Load location master data
  const { locations, loading: locationsLoading } = useLocations();
  
  // Form data
  const [formData, setFormData] = useState<Partial<PartnerRegistrationRequest>>({
    registrationSource: source,
    registrationType: 'COMPANY',
    businessType: 'BUYER',
    hasGST: false,
    registeredAddress: {
      addressLine1: '',
      country: 'India',
      state: '',
      region: '',
      city: '',
      pincode: '',
    },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      ifscCode: '',
      branchName: '',
      accountType: 'CURRENT',
    },
    agreeToTerms: false,
    agreeToPrivacyPolicy: false,
    agreeToDataSharing: false,
  });

  // Verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailOTP, setEmailOTP] = useState('');
  const [mobileOTP, setMobileOTP] = useState('');
  const [otpSent, setOtpSent] = useState({ email: false, mobile: false });
  const [documents, setDocuments] = useState<{ documentType: DocumentType; file: File }[]>([]);
  
  // Success state
  const [success, setSuccess] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (source === 'BACK_OFFICE' && currentStep > 1) {
      const timer = setInterval(() => {
        saveDraft();
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [formData, currentStep]);

  const saveDraft = async () => {
    try {
      await businessPartnerApi.saveDraft(formData);
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  // Check if GST is mandatory for this business type
  const isGSTMandatory = () => {
    return ['BUYER', 'SELLER', 'TRADER'].includes(formData.businessType || '');
  };

  // Check if declaration needed
  const needsDeclaration = () => {
    return formData.businessType === 'TRANSPORTER' && !formData.hasGST;
  };

  // Check if ship-to addresses needed
  const needsShipToAddresses = () => {
    return ['BUYER', 'SELLER', 'TRADER'].includes(formData.businessType || '');
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const parts = field.split('.');
      let current: any = newData;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
      return newData;
    });
    setError('');
  };

  const sendEmailOTP = async () => {
    if (!formData.primaryContactEmail) {
      setError('Please enter email address');
      return;
    }
    
    setLoading(true);
    try {
      await businessPartnerApi.sendOTP({
        email: formData.primaryContactEmail,
        type: 'email',
        purpose: 'registration',
      });
      setOtpSent(prev => ({ ...prev, email: true }));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOTP = async () => {
    setLoading(true);
    try {
      const response = await businessPartnerApi.verifyOTP({
        email: formData.primaryContactEmail,
        otp: emailOTP,
        type: 'email',
      });
      
      if (response.verified) {
        setEmailVerified(true);
        setError('');
      } else {
        setError('Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const sendMobileOTP = async () => {
    if (!formData.primaryContactPhone) {
      setError('Please enter mobile number');
      return;
    }
    
    setLoading(true);
    try {
      await businessPartnerApi.sendOTP({
        phone: formData.primaryContactPhone,
        type: 'mobile',
        purpose: 'registration',
      });
      setOtpSent(prev => ({ ...prev, mobile: true }));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyMobileOTP = async () => {
    setLoading(true);
    try {
      const response = await businessPartnerApi.verifyOTP({
        phone: formData.primaryContactPhone,
        otp: mobileOTP,
        type: 'mobile',
      });
      
      if (response.verified) {
        setMobileVerified(true);
        setError('');
      } else {
        setError('Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: Step): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        if (!formData.legalName) {
          setError('Company name is required');
          return false;
        }
        if (!formData.businessType) {
          setError('Business type is required');
          return false;
        }
        break;
        
      case 2:
        if (!formData.primaryContactPerson) {
          setError('Contact person name is required');
          return false;
        }
        if (!formData.primaryContactEmail) {
          setError('Email is required');
          return false;
        }
        if (!emailVerified) {
          setError('Email verification is mandatory');
          return false;
        }
        if (!formData.primaryContactPhone) {
          setError('Mobile number is required');
          return false;
        }
        if (!mobileVerified) {
          setError('Mobile verification is mandatory');
          return false;
        }
        break;
        
      case 3:
        if (!formData.pan || formData.pan.length !== 10) {
          setError('Valid PAN is required (10 characters)');
          return false;
        }
        if (isGSTMandatory() && !formData.gstNumber) {
          setError('GST is mandatory for this business type');
          return false;
        }
        if (formData.gstNumber && formData.gstNumber.length !== 15) {
          setError('Invalid GST number format');
          return false;
        }
        if (formData.registrationType === 'INDIVIDUAL' && !formData.aadharNumber) {
          setError('Aadhar number is required for individuals');
          return false;
        }
        break;
        
      case 4:
        if (!formData.registeredAddress?.addressLine1) {
          setError('Address is required');
          return false;
        }
        if (!formData.registeredAddress?.city) {
          setError('City is required');
          return false;
        }
        if (!formData.registeredAddress?.state) {
          setError('State is required');
          return false;
        }
        if (!formData.registeredAddress?.pincode || formData.registeredAddress.pincode.length !== 6) {
          setError('Valid 6-digit pincode is required');
          return false;
        }
        break;
        
      case 5:
        if (!formData.bankDetails?.bankName) {
          setError('Bank name is required');
          return false;
        }
        if (!formData.bankDetails?.accountNumber) {
          setError('Account number is required');
          return false;
        }
        if (!formData.bankDetails?.ifscCode || formData.bankDetails.ifscCode.length !== 11) {
          setError('Valid IFSC code is required (11 characters)');
          return false;
        }
        break;
        
      case 6:
        // Check mandatory documents
        const hasPAN = documents.some(d => d.documentType === 'PAN_CARD');
        const hasCheque = documents.some(d => d.documentType === 'CANCELLED_CHECK');
        
        if (!hasPAN) {
          setError('PAN card upload is mandatory');
          return false;
        }
        if (!hasCheque) {
          setError('Cancelled check upload is mandatory');
          return false;
        }
        
        if (formData.hasGST) {
          const hasGST = documents.some(d => d.documentType === 'GST_CERTIFICATE');
          if (!hasGST) {
            setError('GST certificate upload is mandatory');
            return false;
          }
        }
        
        if (needsDeclaration()) {
          const hasDeclaration = documents.some(d => d.documentType === 'TRANSPORTER_DECLARATION');
          if (!hasDeclaration) {
            setError('Transporter declaration is mandatory');
            return false;
          }
        }
        
        if (formData.registrationType === 'INDIVIDUAL') {
          const hasAadhar = documents.some(d => d.documentType === 'AADHAR_CARD');
          if (!hasAadhar) {
            setError('Aadhar card upload is mandatory for individuals');
            return false;
          }
        }
        break;
        
      case 7:
        if (!formData.agreeToTerms) {
          setError('You must agree to terms and conditions');
          return false;
        }
        if (!formData.agreeToPrivacyPolicy) {
          setError('You must agree to privacy policy');
          return false;
        }
        if (!formData.agreeToDataSharing) {
          setError('You must agree to data sharing policy');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((currentStep + 1) as Step);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(7)) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await businessPartnerApi.startRegistration({
        ...formData,
        documents,
      } as PartnerRegistrationRequest);
      
      if (response.success && response.partner) {
        setPartnerCode(response.partner.partnerCode);
        setSuccess(true);
        
        if (onComplete) {
          onComplete(response.partner.partnerCode);
        }
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (documentType: DocumentType, file: File | null) => {
    if (file) {
      setDocuments(prev => {
        const filtered = prev.filter(d => d.documentType !== documentType);
        return [...filtered, { documentType, file }];
      });
    } else {
      setDocuments(prev => prev.filter(d => d.documentType !== documentType));
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl border border-green-200 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Registration Successful!</h2>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700 mb-2">Your Partner Code</p>
              <p className="text-2xl font-mono font-bold text-blue-900">{partnerCode}</p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-left mb-6">
              <h3 className="font-bold text-amber-900 mb-4 text-lg">📋 What Happens Next?</h3>
              <ol className="space-y-3 text-sm text-amber-800">
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-lg">1.</span>
                  <span><strong>Review</strong> - Your application will be reviewed (typically 2-3 business days)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-lg">2.</span>
                  <span><strong>Email Notification</strong> - You'll receive an email when approved</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-lg">3.</span>
                  <span><strong>Login Credentials</strong> - Email will contain your login details</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-lg">4.</span>
                  <span><strong>First Login</strong> - Change your temporary password</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-lg">5.</span>
                  <span><strong>Profile Setup</strong> - Add branches, documents, and invite sub-users</span>
                </li>
              </ol>
            </div>
            
            <button
              onClick={() => window.location.href = '/#login'}
              className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg"
            >
              Go to Login Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration wizard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Partner Registration</h1>
          <p className="text-slate-600">Simple, fast, and secure registration</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div key={step} className="flex-1">
                <div className={`h-2 rounded-full ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
                }`} />
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-600">
            Step {currentStep} of 7
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Company Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Registration Type
                  </label>
                  <select
                    value={formData.registrationType || 'COMPANY'}
                    onChange={(e) => handleChange('registrationType', e.target.value as RegistrationType)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="COMPANY">Company</option>
                    <option value="INDIVIDUAL">Individual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Legal Name / Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.legalName || ''}
                    onChange={(e) => handleChange('legalName', e.target.value)}
                    placeholder="Enter full legal name as per PAN"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    placeholder="Business/brand name if different from legal name"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-slate-500">Leave blank if same as legal name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    value={formData.businessType || 'BUYER'}
                    onChange={(e) => handleChange('businessType', e.target.value as BusinessPartnerType)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="BUYER">Buyer</option>
                    <option value="SELLER">Seller</option>
                    <option value="TRADER">Trader</option>
                    <option value="CONTROLLER">Controller</option>
                    <option value="TRANSPORTER">Transporter</option>
                    <option value="SUB_BROKER">Sub-Broker</option>
                  </select>
                  <p className="mt-2 text-sm text-slate-600">
                    {isGSTMandatory() ? '⚠️ GST is mandatory for this business type' : 'ℹ️ GST is optional for this business type'}
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information & Verification */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Contact Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Primary Contact Person *
                  </label>
                  <input
                    type="text"
                    value={formData.primaryContactPerson || ''}
                    onChange={(e) => handleChange('primaryContactPerson', e.target.value)}
                    placeholder="Full name of contact person"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address * {emailVerified && <span className="text-green-600">✓ Verified</span>}
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={formData.primaryContactEmail || ''}
                      onChange={(e) => {
                        handleChange('primaryContactEmail', e.target.value);
                        setEmailVerified(false);
                        setOtpSent(prev => ({ ...prev, email: false }));
                      }}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={emailVerified}
                    />
                    {!emailVerified && !otpSent.email && (
                      <button
                        onClick={sendEmailOTP}
                        disabled={loading || !formData.primaryContactEmail}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                  
                  {otpSent.email && !emailVerified && (
                    <div className="mt-3 flex gap-3">
                      <input
                        type="text"
                        value={emailOTP}
                        onChange={(e) => setEmailOTP(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={verifyEmailOTP}
                        disabled={loading || emailOTP.length !== 6}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Verify
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile Number * {mobileVerified && <span className="text-green-600">✓ Verified</span>}
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="tel"
                      value={formData.primaryContactPhone || ''}
                      onChange={(e) => {
                        handleChange('primaryContactPhone', e.target.value);
                        setMobileVerified(false);
                        setOtpSent(prev => ({ ...prev, mobile: false }));
                      }}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={mobileVerified}
                    />
                    {!mobileVerified && !otpSent.mobile && (
                      <button
                        onClick={sendMobileOTP}
                        disabled={loading || !formData.primaryContactPhone}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                  
                  {otpSent.mobile && !mobileVerified && (
                    <div className="mt-3 flex gap-3">
                      <input
                        type="text"
                        value={mobileOTP}
                        onChange={(e) => setMobileOTP(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={verifyMobileOTP}
                        disabled={loading || mobileOTP.length !== 6}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Verify
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Tax Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Tax Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    value={formData.pan || ''}
                    onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                  <p className="mt-1 text-sm text-slate-600">10-character PAN number</p>
                </div>

                {formData.registrationType === 'INDIVIDUAL' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Aadhar Number *
                    </label>
                    <input
                      type="text"
                      value={formData.aadharNumber || ''}
                      onChange={(e) => handleChange('aadharNumber', e.target.value)}
                      placeholder="1234-5678-9012"
                      maxLength={12}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasGST || false}
                      onChange={(e) => handleChange('hasGST', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      disabled={isGSTMandatory()}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      I have GST registration {isGSTMandatory() && '(Mandatory for your business type)'}
                    </span>
                  </label>
                </div>

                {formData.hasGST && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      GST Number *
                    </label>
                    <input
                      type="text"
                      value={formData.gstNumber || ''}
                      onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                      placeholder="27ABCDE1234F1Z5"
                      maxLength={15}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                    <p className="mt-1 text-sm text-slate-600">15-character GSTIN</p>
                  </div>
                )}

                {formData.registrationType === 'COMPANY' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CIN Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.cin || ''}
                        onChange={(e) => handleChange('cin', e.target.value.toUpperCase())}
                        placeholder="U12345MH2020PTC123456"
                        maxLength={21}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      />
                      <p className="mt-1 text-sm text-slate-600">Corporate Identification Number (for companies)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        TAN Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.tan || ''}
                        onChange={(e) => handleChange('tan', e.target.value.toUpperCase())}
                        placeholder="ABCD12345E"
                        maxLength={10}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      />
                      <p className="mt-1 text-sm text-slate-600">Tax Deduction Account Number</p>
                    </div>
                  </>
                )}

                {needsDeclaration() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      ℹ️ As a transporter without GST, you'll need to upload a declaration document in the next steps.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Address Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Registered Address</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.registeredAddress?.addressLine1 || ''}
                    onChange={(e) => handleChange('registeredAddress.addressLine1', e.target.value)}
                    placeholder="Building/Street"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.registeredAddress?.addressLine2 || ''}
                    onChange={(e) => handleChange('registeredAddress.addressLine2', e.target.value)}
                    placeholder="Locality/Area (Optional)"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Location Selector */}
                <LocationSelector
                  value={{
                    country: formData.registeredAddress?.country || 'India',
                    state: formData.registeredAddress?.state || '',
                    region: formData.registeredAddress?.region,
                    city: formData.registeredAddress?.city || '',
                  }}
                  onChange={(location) => {
                    setFormData(prev => ({
                      ...prev,
                      registeredAddress: {
                        ...prev.registeredAddress!,
                        country: location.country,
                        state: location.state,
                        region: location.region,
                        city: location.city,
                      },
                    }));
                  }}
                  locations={locations}
                  required={true}
                  showRegion={true}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.registeredAddress?.pincode || ''}
                    onChange={(e) => handleChange('registeredAddress.pincode', e.target.value)}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Bank Details */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Bank Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails?.bankName || ''}
                    onChange={(e) => handleChange('bankDetails.bankName', e.target.value)}
                    placeholder="e.g., HDFC Bank, State Bank of India"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails?.accountHolderName || ''}
                    onChange={(e) => handleChange('bankDetails.accountHolderName', e.target.value)}
                    placeholder="As per bank records"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails?.accountNumber || ''}
                    onChange={(e) => handleChange('bankDetails.accountNumber', e.target.value)}
                    placeholder="Bank account number"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails?.ifscCode || ''}
                    onChange={(e) => handleChange('bankDetails.ifscCode', e.target.value.toUpperCase())}
                    placeholder="HDFC0000001"
                    maxLength={11}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                  <p className="mt-1 text-sm text-slate-600">11-character IFSC code</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails?.branchName || ''}
                    onChange={(e) => handleChange('bankDetails.branchName', e.target.value)}
                    placeholder="Branch name (optional)"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Account Type
                  </label>
                  <select
                    value={formData.bankDetails?.accountType || 'CURRENT'}
                    onChange={(e) => handleChange('bankDetails.accountType', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CURRENT">Current Account</option>
                    <option value="SAVINGS">Savings Account</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 6: Document Upload */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Document Upload</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">📄 Required Documents</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• PAN Card (Mandatory)</li>
                    <li>• Cancelled Check (Mandatory)</li>
                    {formData.hasGST && <li>• GST Certificate (Mandatory)</li>}
                    {needsDeclaration() && <li>• Transporter Declaration (Mandatory)</li>}
                    {formData.registrationType === 'INDIVIDUAL' && <li>• Aadhar Card (Mandatory)</li>}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      PAN Card * {documents.some(d => d.documentType === 'PAN_CARD') && <span className="text-green-600">✓</span>}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload('PAN_CARD', e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cancelled Check * {documents.some(d => d.documentType === 'CANCELLED_CHECK') && <span className="text-green-600">✓</span>}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload('CANCELLED_CHECK', e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {formData.hasGST && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        GST Certificate * {documents.some(d => d.documentType === 'GST_CERTIFICATE') && <span className="text-green-600">✓</span>}
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentUpload('GST_CERTIFICATE', e.target.files?.[0] || null)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {needsDeclaration() && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Transporter Declaration * {documents.some(d => d.documentType === 'TRANSPORTER_DECLARATION') && <span className="text-green-600">✓</span>}
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleDocumentUpload('TRANSPORTER_DECLARATION', e.target.files?.[0] || null)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {formData.registrationType === 'INDIVIDUAL' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Aadhar Card * {documents.some(d => d.documentType === 'AADHAR_CARD') && <span className="text-green-600">✓</span>}
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentUpload('AADHAR_CARD', e.target.files?.[0] || null)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-600 mt-4">
                  Accepted formats: PDF, JPG, PNG (Max 5MB per file)
                </p>
              </div>
            )}

            {/* Step 7: Terms & Conditions */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Terms & Conditions</h2>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-h-60 overflow-y-auto">
                  <h3 className="font-semibold text-slate-900 mb-3">Summary</h3>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li>✓ All information provided is accurate and complete</li>
                    <li>✓ Documents uploaded are authentic and valid</li>
                    <li>✓ Application will be reviewed within 2-3 business days</li>
                    <li>✓ Login credentials will be sent via email upon approval</li>
                    <li>✓ Annual KYC renewal is mandatory</li>
                    <li>✓ Any changes to profile require re-approval</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms || false}
                      onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
                      I agree to the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> *
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToPrivacyPolicy || false}
                      onChange={(e) => handleChange('agreeToPrivacyPolicy', e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
                      I agree to the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> *
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToDataSharing || false}
                      onChange={(e) => handleChange('agreeToDataSharing', e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
                      I consent to data sharing across RNRL organizations for business purposes *
                    </span>
                  </label>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-green-800">
                    <strong>✓ Review Complete!</strong> Click "Submit Application" to complete your registration.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
            >
              ← Previous
            </button>

            <div className="flex gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
              )}
              
              {currentStep < 7 ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application ✓'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegistration;
