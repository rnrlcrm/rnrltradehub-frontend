
import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/ui/Card';
import { Button } from '../components/ui/Form';
import { User } from '../types';
import { getNotifications } from '../utils/notifications';

interface Message {
  id: number;
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp: Date;
  isNotification?: boolean;
}

interface ChatbotProps {
  currentUser: User;
}

const Chatbot: React.FC<ChatbotProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: `Hello ${currentUser.name}! I'm your RNRL ERP Assistant. I can help you with:\n\n• Creating invoices from emails\n• Recording payments\n• Checking contract status\n• Tracking shipments\n• Answering questions about your transactions\n• Viewing system notifications\n\nWhat would you like to do today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<Date>(new Date());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for new notifications periodically
  useEffect(() => {
    const checkNotifications = () => {
      const notifications = getNotifications();
      const newNotifications = notifications.filter(n => 
        new Date(n.timestamp) > lastNotificationCheck && !n.isRead
      );

      if (newNotifications.length > 0) {
        newNotifications.forEach(notification => {
          const notificationMessage: Message = {
            id: messages.length + Math.random(),
            sender: 'system',
            text: `🔔 ${notification.title}\n\n${notification.message}`,
            timestamp: notification.timestamp,
            isNotification: true,
          };
          setMessages(prev => [...prev, notificationMessage]);
        });
        setLastNotificationCheck(new Date());
      }
    };

    const interval = setInterval(checkNotifications, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [messages.length, lastNotificationCheck]);

  const simulateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Notification-related queries
    if (input.includes('notification') || input.includes('alert') || input.includes('updates')) {
      const notifications = getNotifications();
      const unreadCount = notifications.filter(n => !n.isRead).length;
      
      if (notifications.length === 0) {
        return '📬 You have no notifications at the moment.\n\nNotifications will appear here automatically when:\n• New sales confirmations are created\n• Confirmations are amended\n• Confirmations require approval\n• Other important system events occur';
      }
      
      const recentNotifications = notifications.slice(0, 5);
      const notifText = recentNotifications.map((n, i) => 
        `${i + 1}. ${n.title}\n   ${n.message}\n   ${new Date(n.timestamp).toLocaleString()}`
      ).join('\n\n');
      
      return `📬 You have ${unreadCount} unread notification(s)\n\nRecent notifications:\n\n${notifText}`;
    }

    // Sales Confirmation queries
    if (input.includes('sales confirmation') || input.includes('confirmation')) {
      return 'I can help you with Sales Confirmations!\n\n📋 Sales Confirmation features:\n• Create multi-commodity confirmations\n• Dynamic forms based on commodity types\n• Amendment tracking with full audit trail\n• Email notifications to buyers and sellers\n• Approval workflow\n\nGo to Sales Confirmation page to manage confirmations, or type "notifications" to see recent updates.';
    }
    
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
      return 'I can assist you with:\n\n1. 📄 Invoice Management\n   - Upload via email/photo\n   - Auto-forward to buyers\n   - Track payment status\n\n2. 💰 Payment Recording\n   - Quick payment entry\n   - Match with invoices\n   - Generate receipts\n\n3. 📦 Shipment Tracking\n   - LR number updates\n   - Delivery status\n   - Documents\n\n4. 📊 Quick Reports\n   - Outstanding amounts\n   - Payment due dates\n   - Commission status\n\n5. 📋 Sales Confirmations\n   - Multi-commodity support\n   - Amendment tracking\n   - Email notifications\n\n6. 🔔 Notifications\n   - Real-time system updates\n   - Action reminders\n   - Status changes\n\nJust tell me what you need!';
    }
    
    // Default response
    return 'I understand you\'re asking about: "' + userInput + '"\n\nCould you provide more details? I can help you with:\n• Creating invoices\n• Recording payments\n• Checking contracts\n• Tracking shipments\n• Email integration\n• Sales confirmations\n• Notifications\n\nType "help" to see all my capabilities!';
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
                      : message.sender === 'system'
                      ? 'bg-yellow-50 border-2 border-yellow-300 text-yellow-900'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 
                      message.sender === 'system' ? 'text-yellow-700' :
                      'text-slate-400'
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
