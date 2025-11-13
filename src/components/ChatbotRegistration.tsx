/**
 * AI/Chatbot Registration Integration
 * 
 * Simple conversational interface that guides users through registration
 * Uses the SAME logic as PartnerRegistration but with chat interface
 * 
 * Features:
 * - Conversational step-by-step guidance
 * - Same validation as web form
 * - Can be embedded in chatbot (Chatbot.tsx)
 * - No logic changes - just different UI
 */

import React, { useState } from 'react';
import { 
  PartnerRegistrationRequest,
  BusinessPartnerType,
  RegistrationType,
  DocumentType,
} from '../types/businessPartner';
import { businessPartnerApi } from '../api/businessPartnerApi';
import { validateEmail, validatePhone, validatePAN, validateGST } from '../utils/partnerValidation';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface Props {
  onComplete?: (partnerCode: string) => void;
  embedded?: boolean; // If true, can be used inside existing chatbot
}

const ChatbotRegistration: React.FC<Props> = ({ onComplete, embedded = false }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! 👋 I can help you register as a business partner. Let me guide you through a simple process. Ready to start?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<PartnerRegistrationRequest>>({
    registrationSource: 'CHATBOT',
    registrationType: 'COMPANY',
    businessType: 'BUYER',
    hasGST: false,
    registeredAddress: {
      addressLine1: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
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

  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [otpSent, setOtpSent] = useState({ email: false, mobile: false });

  // Conversation steps
  const steps = [
    'start', // 0
    'legal_name', // 1
    'business_type', // 2
    'contact_person', // 3
    'email', // 4
    'email_otp', // 5
    'mobile', // 6
    'mobile_otp', // 7
    'pan', // 8
    'gst_check', // 9
    'gst_number', // 10
    'address', // 11
    'city', // 12
    'state', // 13
    'pincode', // 14
    'bank_name', // 15
    'account_number', // 16
    'ifsc', // 17
    'confirm', // 18
    'complete', // 19
  ];

  const addMessage = (text: string, sender: 'bot' | 'user') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const input = userInput.trim();
    addMessage(input, 'user');
    setUserInput('');
    setLoading(true);

    try {
      await processInput(input);
    } catch (error) {
      addMessage('Sorry, something went wrong. Please try again.', 'bot');
    } finally {
      setLoading(false);
    }
  };

  const processInput = async (input: string) => {
    const stepName = steps[currentStep];

    switch (stepName) {
      case 'start':
        if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('start')) {
          addMessage('Great! Let\'s start with your company details. What is your company\'s legal name?', 'bot');
          setCurrentStep(1);
        } else {
          addMessage('No problem! When you\'re ready, just say "start" or "yes"', 'bot');
        }
        break;

      case 'legal_name':
        if (input.length >= 2) {
          setFormData(prev => ({ ...prev, legalName: input }));
          addMessage(`Perfect! "${input}" registered. Now, what type of business partner are you? Please choose:\n1. Buyer\n2. Seller\n3. Trader\n4. Controller\n5. Transporter\n6. Sub-Broker`, 'bot');
          setCurrentStep(2);
        } else {
          addMessage('Company name is too short. Please provide the full legal name.', 'bot');
        }
        break;

      case 'business_type':
        const types: Record<string, BusinessPartnerType> = {
          '1': 'BUYER', 'buyer': 'BUYER',
          '2': 'SELLER', 'seller': 'SELLER',
          '3': 'TRADER', 'trader': 'TRADER',
          '4': 'CONTROLLER', 'controller': 'CONTROLLER',
          '5': 'TRANSPORTER', 'transporter': 'TRANSPORTER',
          '6': 'SUB_BROKER', 'sub-broker': 'SUB_BROKER', 'sub broker': 'SUB_BROKER',
        };
        
        const selectedType = types[input.toLowerCase()];
        if (selectedType) {
          setFormData(prev => ({ ...prev, businessType: selectedType }));
          addMessage(`Got it! You're registering as a ${selectedType}. Who is the primary contact person?`, 'bot');
          setCurrentStep(3);
        } else {
          addMessage('Please choose a valid option (1-6 or type the name)', 'bot');
        }
        break;

      case 'contact_person':
        if (input.length >= 2) {
          setFormData(prev => ({ ...prev, primaryContactPerson: input }));
          addMessage(`Thank you! What's the best email address to reach ${input}? (This will be your login email)`, 'bot');
          setCurrentStep(4);
        } else {
          addMessage('Please provide a valid contact person name.', 'bot');
        }
        break;

      case 'email':
        const emailValidation = await validateEmail(input);
        if (emailValidation.valid) {
          setFormData(prev => ({ ...prev, primaryContactEmail: input }));
          
          // Send OTP
          await businessPartnerApi.sendOTP({ email: input, type: 'email', purpose: 'registration' });
          setOtpSent(prev => ({ ...prev, email: true }));
          
          addMessage(`Perfect! I've sent a verification code to ${input}. Please enter the 6-digit OTP:`, 'bot');
          setCurrentStep(5);
        } else {
          addMessage(`❌ ${emailValidation.error}. Please provide a valid email address.`, 'bot');
        }
        break;

      case 'email_otp':
        try {
          const result = await businessPartnerApi.verifyOTP({
            email: formData.primaryContactEmail,
            otp: input,
            type: 'email',
          });
          
          if (result.verified) {
            setEmailVerified(true);
            addMessage(`✅ Email verified! Now, what's your mobile number? (Format: +91XXXXXXXXXX or 10 digits)`, 'bot');
            setCurrentStep(6);
          } else {
            addMessage('❌ Invalid OTP. Please try again or say "resend" for a new code.', 'bot');
          }
        } catch (err) {
          addMessage('❌ Verification failed. Please check the OTP and try again.', 'bot');
        }
        break;

      case 'mobile':
        const phoneValidation = await validatePhone(input);
        if (phoneValidation.valid) {
          const normalized = input.replace(/[\s\-\(\)]/g, '').replace(/^\+91/, '');
          setFormData(prev => ({ ...prev, primaryContactPhone: `+91${normalized}` }));
          
          // Send OTP
          await businessPartnerApi.sendOTP({ phone: `+91${normalized}`, type: 'mobile', purpose: 'registration' });
          setOtpSent(prev => ({ ...prev, mobile: true }));
          
          addMessage(`Great! OTP sent to ${normalized}. Please enter the 6-digit code:`, 'bot');
          setCurrentStep(7);
        } else {
          addMessage(`❌ ${phoneValidation.error}`, 'bot');
        }
        break;

      case 'mobile_otp':
        try {
          const result = await businessPartnerApi.verifyOTP({
            phone: formData.primaryContactPhone,
            otp: input,
            type: 'mobile',
          });
          
          if (result.verified) {
            setMobileVerified(true);
            addMessage(`✅ Mobile verified! Now for compliance. What's your PAN number? (Format: AAAAA1234A)`, 'bot');
            setCurrentStep(8);
          } else {
            addMessage('❌ Invalid OTP. Please try again.', 'bot');
          }
        } catch (err) {
          addMessage('❌ Verification failed. Please try again.', 'bot');
        }
        break;

      case 'pan':
        const panValidation = validatePAN(input);
        if (panValidation.valid) {
          setFormData(prev => ({ ...prev, pan: input.toUpperCase() }));
          
          const isGSTMandatory = ['BUYER', 'SELLER', 'TRADER'].includes(formData.businessType || '');
          if (isGSTMandatory) {
            addMessage(`PAN verified! For ${formData.businessType}, GST is mandatory. Please provide your GST number:`, 'bot');
            setCurrentStep(10);
          } else {
            addMessage(`PAN verified! Do you have a GST number? (yes/no)`, 'bot');
            setCurrentStep(9);
          }
        } else {
          addMessage(`❌ ${panValidation.error}`, 'bot');
        }
        break;

      case 'gst_check':
        if (input.toLowerCase().includes('yes')) {
          setFormData(prev => ({ ...prev, hasGST: true }));
          addMessage('Please provide your GST number (15 characters):', 'bot');
          setCurrentStep(10);
        } else {
          setFormData(prev => ({ ...prev, hasGST: false }));
          addMessage('Understood. Now, what\'s your registered office address? (Street address)', 'bot');
          setCurrentStep(11);
        }
        break;

      case 'gst_number':
        const gstValidation = validateGST(input, formData.pan);
        if (gstValidation.valid) {
          setFormData(prev => ({ ...prev, gstNumber: input.toUpperCase(), hasGST: true }));
          addMessage('GST verified! Now, what\'s your registered office address? (Street address)', 'bot');
          setCurrentStep(11);
        } else {
          addMessage(`❌ ${gstValidation.error}`, 'bot');
        }
        break;

      case 'address':
        if (input.length >= 5) {
          setFormData(prev => ({
            ...prev,
            registeredAddress: { ...prev.registeredAddress!, addressLine1: input },
          }));
          addMessage('Got it! Which city?', 'bot');
          setCurrentStep(12);
        } else {
          addMessage('Please provide a complete address.', 'bot');
        }
        break;

      case 'city':
        setFormData(prev => ({
          ...prev,
          registeredAddress: { ...prev.registeredAddress!, city: input },
        }));
        addMessage('And which state?', 'bot');
        setCurrentStep(13);
        break;

      case 'state':
        setFormData(prev => ({
          ...prev,
          registeredAddress: { ...prev.registeredAddress!, state: input },
        }));
        addMessage('What\'s the pincode? (6 digits)', 'bot');
        setCurrentStep(14);
        break;

      case 'pincode':
        if (/^[1-9][0-9]{5}$/.test(input)) {
          setFormData(prev => ({
            ...prev,
            registeredAddress: { ...prev.registeredAddress!, pincode: input },
          }));
          addMessage('Perfect! Now for banking details. What\'s your bank name?', 'bot');
          setCurrentStep(15);
        } else {
          addMessage('Invalid pincode. Please provide a 6-digit pincode.', 'bot');
        }
        break;

      case 'bank_name':
        setFormData(prev => ({
          ...prev,
          bankDetails: { ...prev.bankDetails!, bankName: input },
        }));
        addMessage('What\'s your bank account number?', 'bot');
        setCurrentStep(16);
        break;

      case 'account_number':
        if (input.length >= 9 && input.length <= 18) {
          setFormData(prev => ({
            ...prev,
            bankDetails: { ...prev.bankDetails!, accountNumber: input, accountHolderName: formData.legalName || '' },
          }));
          addMessage('Last one! What\'s your IFSC code? (11 characters)', 'bot');
          setCurrentStep(17);
        } else {
          addMessage('Account number must be 9-18 digits.', 'bot');
        }
        break;

      case 'ifsc':
        if (/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(input)) {
          setFormData(prev => ({
            ...prev,
            bankDetails: { ...prev.bankDetails!, ifscCode: input.toUpperCase(), branchName: 'Main Branch' },
          }));
          
          // Show summary
          addMessage(`Excellent! Let me summarize your registration:\n\n` +
            `🏢 Company: ${formData.legalName}\n` +
            `👤 Type: ${formData.businessType}\n` +
            `📧 Email: ${formData.primaryContactEmail}\n` +
            `📱 Mobile: ${formData.primaryContactPhone}\n` +
            `🆔 PAN: ${formData.pan}\n` +
            `${formData.hasGST ? `📄 GST: ${formData.gstNumber}\n` : ''}` +
            `📍 City: ${formData.registeredAddress?.city}, ${formData.registeredAddress?.state}\n` +
            `🏦 Bank: ${formData.bankDetails?.bankName}\n\n` +
            `Is this correct? (yes/no)`, 'bot');
          setCurrentStep(18);
        } else {
          addMessage('Invalid IFSC code format. Please provide a valid 11-character IFSC code.', 'bot');
        }
        break;

      case 'confirm':
        if (input.toLowerCase().includes('yes')) {
          // Submit registration
          try {
            const response = await businessPartnerApi.startRegistration({
              ...formData,
              agreeToTerms: true,
              agreeToPrivacyPolicy: true,
              agreeToDataSharing: true,
            } as PartnerRegistrationRequest);
            
            if (response.success && response.partner) {
              addMessage(`🎉 Registration successful!\n\n` +
                `Your Partner Code: ${response.partner.partnerCode}\n\n` +
                `What happens next?\n` +
                `1. Our team will review your application (2-3 days)\n` +
                `2. You'll receive an email when approved\n` +
                `3. The email will have your login credentials\n` +
                `4. You'll need to change your password on first login\n\n` +
                `Thank you for registering with us! 🙏`, 'bot');
              
              setCurrentStep(19);
              
              if (onComplete) {
                onComplete(response.partner.partnerCode);
              }
            }
          } catch (err: any) {
            addMessage(`❌ Registration failed: ${err.message}. Please try again.`, 'bot');
          }
        } else {
          addMessage('No problem! Let\'s start over. Say "restart" to begin again.', 'bot');
        }
        break;

      default:
        addMessage('Sorry, I didn\'t understand. Could you please repeat?', 'bot');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (embedded) {
    // Return minimal interface for embedding in existing chatbot
    return (
      <div className="space-y-4">
        {messages.slice(-5).map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            disabled={loading || currentStep >= 19}
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={loading || !userInput.trim() || currentStep >= 19}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    );
  }

  // Standalone chat interface
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full" style={{ height: '600px' }}>
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">🤖 Partner Registration Assistant</h2>
          <p className="text-sm text-blue-100">I'll guide you through the registration process</p>
        </div>

        {/* Messages */}
        <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading || currentStep >= 19}
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2"
            />
            <button
              onClick={handleSend}
              disabled={loading || !userInput.trim() || currentStep >= 19}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotRegistration;
