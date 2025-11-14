/**
 * Chat Interface Component
 * AI-powered chat for creating trades
 */

import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../../types';
import { useChatMessages, useNLP } from '../../../hooks/useTradeDesk';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '../../ui/Form';

interface ChatInterfaceProps {
  currentUser: User;
  onTradeCreated: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, onTradeCreated }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage } = useChatMessages();
  const { parse, parsing } = useNLP();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || parsing) return;

    // Add user message
    addMessage({ sender: 'user', text: input });
    const userInput = input;
    setInput('');

    // Parse with NLP
    try {
      const parsed = await parse(userInput, currentUser.id);
      
      if (parsed.confidence >= 0.5) {
        const confirmation = `I understood: ${parsed.action === 'buy' ? 'Buying' : 'Selling'} ${parsed.quantity || ''} ${parsed.unit || 'units'} of ${parsed.commodity_hint || 'commodity'}. ${parsed.certificates.length > 0 ? `With ${parsed.certificates.join(', ')} certification.` : ''}\n\nWould you like to proceed and fill in the remaining details?`;
        
        addMessage({ 
          sender: 'ai', 
          text: confirmation,
          parsed
        });
      } else {
        addMessage({
          sender: 'ai',
          text: "I couldn't quite understand that. Could you please specify:\n- Commodity (e.g., cotton, wheat)\n- Quantity (e.g., 500 bales)\n- Any quality requirements?\n\nExample: 'Need 500 bales organic cotton with staple 28-30'"
        });
      }
    } catch (error) {
      addMessage({
        sender: 'ai',
        text: 'Sorry, I encountered an error. Please try again.'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-900'
              }`}
            >
              {message.sender === 'ai' && (
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs font-medium">AI Assistant</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {parsing && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
                <span className="text-sm text-neutral-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-neutral-200 bg-neutral-50">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => handleQuickAction('Need 500 bales organic cotton')}
            className="px-3 py-1.5 bg-white border border-neutral-300 rounded-full text-xs hover:bg-neutral-50 whitespace-nowrap"
          >
            Cotton Example
          </button>
          <button
            onClick={() => handleQuickAction('Buying 1000 quintal wheat')}
            className="px-3 py-1.5 bg-white border border-neutral-300 rounded-full text-xs hover:bg-neutral-50 whitespace-nowrap"
          >
            Wheat Example
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your requirement... (e.g., 'Need 500 bales organic cotton')"
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={parsing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || parsing}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
