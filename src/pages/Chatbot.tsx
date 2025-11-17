
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

  const QuickAction: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
    >
      {text}
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
              <QuickAction text="📄 Upload Invoice" onClick={() => handleQuickAction('I have an invoice to upload')} />
              <QuickAction text="💰 Record Payment" onClick={() => handleQuickAction('I received a payment')} />
              <QuickAction text="📊 Check Status" onClick={() => handleQuickAction('Check contract status')} />
              <QuickAction text="📧 Email Setup" onClick={() => handleQuickAction('How do I forward emails?')} />
              <QuickAction text="❓ Help" onClick={() => handleQuickAction('help')} />
            </div>
          </div>

          {/* Input area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (e.g., 'I have an invoice for SC-2024-001')"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-6"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions Card */}
      <Card title="Email Integration Guide">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">For Sellers:</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <p className="mb-2">📧 <strong>Forward invoice emails to:</strong> invoices@rnrltradehub.com</p>
              <p className="text-slate-600">
                • Attach invoice PDF<br />
                • Mention contract number in subject/body<br />
                • System will auto-process and forward to buyer
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">For Buyers:</h3>
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
              <p className="mb-2">💰 <strong>Send payment confirmations to:</strong> payments@rnrltradehub.com</p>
              <p className="text-slate-600">
                • Include invoice number<br />
                • Mention amount and payment method<br />
                • System will auto-update records
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">Chatbot Features:</h3>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li>Natural language processing for easy data entry</li>
              <li>Auto-extraction from emails and photos</li>
              <li>Instant status updates and queries</li>
              <li>No manual form filling required</li>
              <li>Works 24/7 for sellers and buyers</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chatbot;
