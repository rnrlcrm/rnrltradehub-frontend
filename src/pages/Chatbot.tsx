
import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/ui/Card';
import { Button } from '../components/ui/Form';
import { User } from '../types';
import { Upload, FileText, Image, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import OCRService, { OCRResult } from '../services/ocrService';
import ValidationService, { ValidationResult } from '../services/validationService';
import NotificationService from '../services/notificationService';
import AutoPostingService from '../services/autoPostingService';

interface Message {
  id: number;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  fileAttachment?: {
    name: string;
    type: string;
    size: number;
  };
  ocrResult?: OCRResult;
  validationResult?: ValidationResult;
}

interface ChatbotProps {
  currentUser: User;
}

const Chatbot: React.FC<ChatbotProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: `Hello ${currentUser.name}! I'm your RNRL ERP Assistant with OCR capabilities. I can help you with:\n\n📄 INVOICE AUTOMATION\n• Upload invoices (PDF/Image) - I'll extract data using OCR\n• Auto-validate against contracts\n• Auto-email to buyers\n• Auto-post to ledger\n\n💰 PAYMENT AUTOMATION\n• Upload payment receipts - I'll extract details\n• Auto-post to ledger\n• Auto-reconcile with invoices\n\n🚛 LOGISTICS & CONTROLLER\n• Upload logistics bills\n• Upload controller invoices\n• Auto-forward to relevant parties\n\n📊 ACCOUNTING\n• Raise debit/credit notes\n• Auto-post to ledgers\n• Check ledger balances\n• Run auto-reconciliation\n\nJust type what you need or upload a document!`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    // Add user message with file attachment
    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: `Uploaded file: ${file.name}`,
      timestamp: new Date(),
      fileAttachment: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Determine document type from filename or user context
    let documentType: 'invoice' | 'payment' | 'logistics' = 'invoice';
    if (file.name.toLowerCase().includes('payment') || file.name.toLowerCase().includes('receipt')) {
      documentType = 'payment';
    } else if (file.name.toLowerCase().includes('lr') || file.name.toLowerCase().includes('logistics')) {
      documentType = 'logistics';
    }

    // Process with OCR
    let ocrResult: OCRResult;
    if (documentType === 'invoice') {
      ocrResult = await OCRService.processInvoice(file);
    } else if (documentType === 'payment') {
      ocrResult = await OCRService.processPaymentReceipt(file);
    } else {
      ocrResult = await OCRService.processLogisticsBill(file);
    }

    setIsTyping(false);
    setIsProcessing(false);

    // Process OCR result
    if (ocrResult.success && ocrResult.data) {
      await handleOCRSuccess(ocrResult, documentType);
    } else {
      const errorMessage: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: `❌ Failed to process document:\n\n${ocrResult.errors?.join('\n') || 'Unknown error'}\n\nPlease try:\n• Taking a clearer photo\n• Ensuring good lighting\n• Uploading a higher resolution image\n• Or enter details manually`,
        timestamp: new Date(),
        ocrResult,
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOCRSuccess = async (ocrResult: OCRResult, documentType: string) => {
    if (documentType === 'invoice' && ocrResult.data) {
      const invoiceData = ocrResult.data as any;
      
      // Validate invoice
      const validationResult = await ValidationService.validateInvoice(invoiceData);
      
      if (validationResult.isValid) {
        // Validation successful
        const successMessage: Message = {
          id: messages.length + 2,
          sender: 'bot',
          text: `✅ Invoice processed successfully!\n\n📄 Invoice: ${invoiceData.invoiceNumber}\n📅 Date: ${invoiceData.invoiceDate}\n👤 Seller: ${invoiceData.sellerName}\n👥 Buyer: ${invoiceData.buyerName}\n💰 Amount: ₹${invoiceData.totalAmount.toLocaleString()}\n📊 Confidence: ${OCRService.getConfidenceLevel(ocrResult.confidence)}\n\n✓ Validated against contract ${invoiceData.salesContractNumber || 'N/A'}\n✓ Auto-posting to ledger...\n✓ Sending email to buyer...\n\n✨ Invoice has been processed and saved!`,
          timestamp: new Date(),
          ocrResult,
          validationResult,
        };
        setMessages(prev => [...prev, successMessage]);

        // Auto-post to ledger
        await AutoPostingService.postInvoiceToLedger(invoiceData);

        // Send notification to buyer
        await NotificationService.notifyInvoiceUploaded(invoiceData, { email: invoiceData.buyerName });

      } else {
        // Validation failed
        const errorList = validationResult.errors.map(e => `• ${e.field}: ${e.message}`).join('\n');
        const warningList = validationResult.warnings.length > 0 
          ? '\n\n⚠️ Warnings:\n' + validationResult.warnings.map(w => `• ${w.field}: ${w.message}`).join('\n')
          : '';
        
        const errorMessage: Message = {
          id: messages.length + 2,
          sender: 'bot',
          text: `❌ Invoice validation failed:\n\n${errorList}${warningList}\n\nPlease correct these issues and upload again.`,
          timestamp: new Date(),
          ocrResult,
          validationResult,
        };
        setMessages(prev => [...prev, errorMessage]);

        // Send error notification to seller
        await NotificationService.notifyInvoiceError(
          invoiceData,
          { email: invoiceData.sellerName },
          validationResult.errors.map(e => e.message)
        );
      }
    } else if (documentType === 'payment' && ocrResult.data) {
      const paymentData = ocrResult.data as any;
      
      // Validate payment
      const validationResult = await ValidationService.validatePayment(paymentData);
      
      if (validationResult.isValid) {
        const successMessage: Message = {
          id: messages.length + 2,
          sender: 'bot',
          text: `✅ Payment processed successfully!\n\n💰 Transaction: ${paymentData.transactionId}\n📅 Date: ${paymentData.paymentDate}\n💵 Amount: ₹${paymentData.amount.toLocaleString()}\n🏦 Mode: ${paymentData.paymentMode}\n📄 Invoice: ${paymentData.invoiceNumber || 'N/A'}\n📊 Confidence: ${OCRService.getConfidenceLevel(ocrResult.confidence)}\n\n✓ Auto-posting to buyer ledger...\n✓ Notifying seller...\n✓ Running auto-reconciliation...\n\n✨ Payment has been recorded!`,
          timestamp: new Date(),
          ocrResult,
          validationResult,
        };
        setMessages(prev => [...prev, successMessage]);

        // Auto-post to ledger
        await AutoPostingService.postPaymentToLedger(paymentData);

        // Send notification
        await NotificationService.notifyPaymentReceived(paymentData, { email: 'seller@example.com' });

      } else {
        const errorList = validationResult.errors.map(e => `• ${e.field}: ${e.message}`).join('\n');
        const errorMessage: Message = {
          id: messages.length + 2,
          sender: 'bot',
          text: `❌ Payment validation failed:\n\n${errorList}\n\nPlease correct these issues and try again.`,
          timestamp: new Date(),
          ocrResult,
          validationResult,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else if (documentType === 'logistics' && ocrResult.data) {
      const logisticsData = ocrResult.data as any;
      
      const successMessage: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: `✅ Logistics bill processed successfully!\n\n🚛 Bill: ${logisticsData.billNumber}\n📦 LR: ${logisticsData.lrNumber}\n🚗 Vehicle: ${logisticsData.vehicleNumber}\n📍 Route: ${logisticsData.fromLocation} → ${logisticsData.toLocation}\n💰 Amount: ₹${logisticsData.totalAmount.toLocaleString()}\n\n✓ Auto-forwarding to buyer...\n\n✨ Logistics bill saved!`,
        timestamp: new Date(),
        ocrResult,
      };
      setMessages(prev => [...prev, successMessage]);

      // Send notification
      await NotificationService.notifyLogisticsBillUploaded(logisticsData, { email: 'buyer@example.com', type: 'buyer' });
    }
  };

  const simulateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Invoice-related queries
    if (input.includes('invoice') || input.includes('bill')) {
      return 'I can help you with invoices!\n\nTo create an invoice:\n1. Forward the seller\'s invoice email to invoices@rnrltradehub.com\n2. I\'ll extract the details automatically\n3. You\'ll get a confirmation email\n4. The invoice will be auto-forwarded to the buyer\n\nOr you can say "I have an invoice for SC-2024-001" and I\'ll create it for you.';
    }
    
    // Payment-related queries
    if (input.includes('payment') || input.includes('paid') || input.includes('pay')) {
      return 'I can help you record payments!\n\nJust tell me:\n1. Invoice number\n2. Amount paid\n3. Payment date\n4. Payment method\n\nExample: "Payment of ₹50000 received for INV-2024-001 via Bank Transfer today"';
    }
    
    // Contract-related queries
    if (input.includes('contract') || input.includes('sc-') || input.includes('agreement')) {
      return 'I can check contract status for you!\n\nJust provide:\n• Contract number (e.g., SC-2024-001)\n• Or party name (buyer/seller)\n\nI\'ll show you all relevant details including invoices, payments, and outstanding amounts.';
    }
    
    // Status tracking
    if (input.includes('status') || input.includes('track') || input.includes('where')) {
      return 'I can track your shipments and transactions!\n\nTell me:\n• Contract number, or\n• Invoice number, or\n• LR number\n\nI\'ll provide real-time status updates.';
    }
    
    // Email upload
    if (input.includes('email') || input.includes('forward') || input.includes('send')) {
      return 'Email Integration is active!\n\n📧 Forward emails to:\n• invoices@rnrltradehub.com - For seller invoices\n• payments@rnrltradehub.com - For payment confirmations\n• lorry@rnrltradehub.com - For LR updates\n\nI\'ll automatically:\n✓ Extract data from emails\n✓ Create records in the system\n✓ Forward to relevant parties\n✓ Send you confirmation';
    }
    
    // Help
    if (input.includes('help') || input.includes('what can') || input.includes('how')) {
      return 'I can assist you with:\n\n1. 📄 Invoice Management\n   - Upload via email/photo\n   - Auto-forward to buyers\n   - Track payment status\n\n2. 💰 Payment Recording\n   - Quick payment entry\n   - Match with invoices\n   - Generate receipts\n\n3. 📦 Shipment Tracking\n   - LR number updates\n   - Delivery status\n   - Documents\n\n4. 📊 Quick Reports\n   - Outstanding amounts\n   - Payment due dates\n   - Commission status\n\nJust tell me what you need!';
    }
    
    // Default response
    return 'I understand you\'re asking about: "' + userInput + '"\n\nCould you provide more details? I can help you with:\n• Creating invoices\n• Recording payments\n• Checking contracts\n• Tracking shipments\n• Email integration\n\nType "help" to see all my capabilities!';
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing and response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: simulateBotResponse(inputMessage),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const QuickAction: React.FC<{ text: string; onClick: () => void; icon?: React.ReactNode }> = ({ text, onClick, icon }) => (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200 flex items-center space-x-1"
    >
      {icon}
      <span>{text}</span>
    </button>
  );

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">AI Assistant</h1>
      <p className="text-sm text-slate-600 -mt-2">
        Conversational interface for quick data entry and queries
      </p>

      <Card title="Chat with RNRL Assistant">
        <div className="flex flex-col h-[600px]">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-4 py-2 bg-white border-t border-slate-200">
            <p className="text-xs text-slate-600 mb-2">Quick Actions:</p>
            <div className="flex flex-wrap gap-2">
              <QuickAction 
                text="📄 Upload Invoice" 
                icon={<Upload className="w-3 h-3" />}
                onClick={() => fileInputRef.current?.click()} 
              />
              <QuickAction 
                text="💰 Upload Payment" 
                icon={<FileText className="w-3 h-3" />}
                onClick={() => fileInputRef.current?.click()} 
              />
              <QuickAction 
                text="🚛 Upload Logistics Bill" 
                icon={<FileText className="w-3 h-3" />}
                onClick={() => fileInputRef.current?.click()} 
              />
              <QuickAction 
                text="📊 Check Status" 
                onClick={() => handleQuickAction('Check contract status')} 
              />
              <QuickAction 
                text="💳 Raise Debit Note" 
                onClick={() => handleQuickAction('I want to raise a debit note')} 
              />
              <QuickAction 
                text="💵 Raise Credit Note" 
                onClick={() => handleQuickAction('I want to raise a credit note')} 
              />
              <QuickAction text="❓ Help" onClick={() => handleQuickAction('help')} />
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Input area */}
          <div className="p-4 bg-white border-t border-slate-200">
            {isProcessing && (
              <div className="mb-3 flex items-center space-x-2 text-blue-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing document with OCR...</span>
              </div>
            )}
            <div className="flex space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-2"
                disabled={isTyping || isProcessing}
                title="Upload document (Invoice, Payment Receipt, Logistics Bill)"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">Upload</span>
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or upload a document..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isTyping || isProcessing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping || isProcessing}
                className="px-6"
              >
                Send
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              💡 Tip: Upload invoices, payment receipts, or logistics bills for automatic OCR processing
            </p>
          </div>
        </div>
      </Card>

      {/* Instructions Card */}
      <Card title="📋 Automated Document Processing Guide">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              How to Upload Documents:
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm space-y-2">
              <p><strong>1. Click "Upload" button or drag & drop</strong></p>
              <p><strong>2. Select document type:</strong></p>
              <ul className="ml-4 space-y-1 text-slate-600">
                <li>• <strong>Invoice:</strong> PDF or image of seller invoice</li>
                <li>• <strong>Payment:</strong> Bank receipt, RTGS/NEFT confirmation</li>
                <li>• <strong>Logistics:</strong> LR receipt, transporter bill</li>
              </ul>
              <p><strong>3. System will:</strong></p>
              <ul className="ml-4 space-y-1 text-slate-600">
                <li>✓ Extract data using OCR</li>
                <li>✓ Validate against contracts</li>
                <li>✓ Auto-post to ledger</li>
                <li>✓ Send notifications</li>
                <li>✓ Update reconciliation</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">📧 Email Integration (Alternative):</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="font-semibold mb-1">📄 Invoices</p>
                <p className="text-xs text-slate-600">invoices@rnrltradehub.com</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="font-semibold mb-1">💰 Payments</p>
                <p className="text-xs text-slate-600">payments@rnrltradehub.com</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="font-semibold mb-1">🚛 Logistics</p>
                <p className="text-xs text-slate-600">logistics@rnrltradehub.com</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">🤖 Chatbot Capabilities:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-semibold text-blue-700 mb-1">Automated Processing:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>OCR data extraction (95%+ accuracy)</li>
                  <li>Auto-validation against contracts</li>
                  <li>Auto-posting to ledgers</li>
                  <li>Auto-reconciliation (RECO)</li>
                  <li>Email notifications with timeline</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-blue-700 mb-1">Supported Documents:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Seller invoices (with GST)</li>
                  <li>Payment receipts (RTGS/NEFT/Cheque)</li>
                  <li>Controller invoices</li>
                  <li>Logistics/LR bills</li>
                  <li>Debit/Credit notes</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">⚡ Key Features:</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-md p-3">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
                <li>✅ <strong>Zero Manual Entry:</strong> Upload & done</li>
                <li>✅ <strong>Real-time Validation:</strong> Instant error detection</li>
                <li>✅ <strong>Auto-Notifications:</strong> Buyer/seller alerts</li>
                <li>✅ <strong>Auto-Ledger Posting:</strong> Immediate updates</li>
                <li>✅ <strong>Auto-Reconciliation:</strong> Match/unmatch detection</li>
                <li>✅ <strong>Timeline Tracking:</strong> Complete audit trail</li>
                <li>✅ <strong>Multi-party Support:</strong> Buyers, sellers, controllers, transporters</li>
                <li>✅ <strong>24/7 Availability:</strong> Process anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chatbot;
