/**
 * AI Service Integration
 * 
 * Handles AI chatbot interactions with backend AI endpoints
 * for Trade, Logistics, Payment, and Report parsing
 */

import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.rnrltradehub.com';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AIParseRequest {
  message: string;
  context?: Record<string, any>;
  userId?: number;
  sessionId?: string;
}

export interface AIParseResponse {
  success: boolean;
  action: string;
  data: Record<string, any>;
  formFields?: FormField[];
  validationErrors?: string[];
  suggestions?: string[];
  message?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  value?: any;
  options?: { label: string; value: any }[];
  required?: boolean;
  validation?: string;
}

export interface TradeParseResult {
  action: 'create_trade' | 'find_offers' | 'accept_offer' | 'reject_offer';
  trade?: {
    commodity: string;
    quantity: number;
    unit: string;
    location: string;
    parameters?: Record<string, number>;
    deliveryTerms?: string;
    paymentTerms?: string;
  };
  offerId?: number;
  reason?: string;
}

export interface LogisticsParseResult {
  action: 'create_transport_order' | 'assign_transporter' | 'update_milestone' | 'track_shipment';
  transportOrder?: {
    contractNo: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
    commodity: string;
  };
  transporterId?: number;
  milestone?: string;
  trackingId?: string;
}

export interface PaymentParseResult {
  action: 'upload_payment' | 'verify_payment' | 'reconcile_payment';
  payment?: {
    contractNo: string;
    amount: number;
    utr: string;
    bank: string;
    date: string;
  };
  paymentId?: string;
}

export interface ReportParseResult {
  action: 'generate_report' | 'export_report' | 'schedule_report';
  report?: {
    type: 'trade_register' | 'payment_summary' | 'quality_report' | 'transport_log' | 'commission_summary';
    dateFrom: string;
    dateTo: string;
    filters?: Record<string, any>;
    format?: 'pdf' | 'excel' | 'csv';
  };
}

// ============================================================================
// AI SERVICE CLASS
// ============================================================================

export class AIService {
  private apiBaseUrl: string;
  private token: string | null = null;

  constructor(apiBaseUrl: string = API_BASE_URL) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Parse trade-related queries
   * 
   * Examples:
   * - "I want to buy 100 bales of cotton in Mumbai"
   * - "Show me offers for wheat in Delhi"
   * - "Accept offer #12345"
   */
  async parseTrade(request: AIParseRequest): Promise<AIParseResponse> {
    try {
      const response: AxiosResponse<AIParseResponse> = await axios.post(
        `${this.apiBaseUrl}/ai/trade/parse`,
        request,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('[AI Service] Trade parse error:', error);
      return this.handleError(error, 'trade');
    }
  }

  /**
   * Parse logistics/transport queries
   * 
   * Examples:
   * - "Create transport order for contract SC-2024-001"
   * - "Assign transporter to TO-2024-001"
   * - "Track shipment TO-2024-002"
   */
  async parseLogistics(request: AIParseRequest): Promise<AIParseResponse> {
    try {
      const response: AxiosResponse<AIParseResponse> = await axios.post(
        `${this.apiBaseUrl}/ai/logistics/parse`,
        request,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('[AI Service] Logistics parse error:', error);
      return this.handleError(error, 'logistics');
    }
  }

  /**
   * Parse payment-related queries
   * 
   * Examples:
   * - "Upload payment for contract SC-2024-001, UTR 123456789, amount 50000"
   * - "Verify payment for invoice INV-001"
   * - "Reconcile payments for this month"
   */
  async parsePayment(request: AIParseRequest): Promise<AIParseResponse> {
    try {
      const response: AxiosResponse<AIParseResponse> = await axios.post(
        `${this.apiBaseUrl}/ai/payment/parse`,
        request,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('[AI Service] Payment parse error:', error);
      return this.handleError(error, 'payment');
    }
  }

  /**
   * Parse report generation queries
   * 
   * Examples:
   * - "Generate trade register for November 2024"
   * - "Show me payment summary for last month"
   * - "Export quality report in Excel"
   */
  async parseReport(request: AIParseRequest): Promise<AIParseResponse> {
    try {
      const response: AxiosResponse<AIParseResponse> = await axios.post(
        `${this.apiBaseUrl}/ai/report/parse`,
        request,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('[AI Service] Report parse error:', error);
      return this.handleError(error, 'report');
    }
  }

  /**
   * Generic AI query parser (routes to appropriate endpoint)
   */
  async parse(request: AIParseRequest): Promise<AIParseResponse> {
    try {
      const response: AxiosResponse<AIParseResponse> = await axios.post(
        `${this.apiBaseUrl}/ai/parse`,
        request,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('[AI Service] Parse error:', error);
      return this.handleError(error, 'general');
    }
  }

  /**
   * Get AI suggestions based on context
   */
  async getSuggestions(context: Record<string, any>): Promise<string[]> {
    try {
      const response: AxiosResponse<{ suggestions: string[] }> = await axios.post(
        `${this.apiBaseUrl}/ai/suggestions`,
        { context },
        { headers: this.getHeaders() }
      );
      return response.data.suggestions;
    } catch (error) {
      console.error('[AI Service] Suggestions error:', error);
      return [];
    }
  }

  /**
   * Handle errors and provide fallback responses
   */
  private handleError(error: any, type: string): AIParseResponse {
    let message = 'Sorry, I encountered an error processing your request.';
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        message = 'Authentication required. Please log in.';
      } else if (error.response?.status === 400) {
        message = error.response.data?.message || 'Invalid request. Please rephrase.';
      } else if (error.response?.status === 503) {
        message = 'AI service is currently unavailable. Please try again later.';
      }
    }

    return {
      success: false,
      action: 'error',
      data: {},
      message,
      suggestions: this.getFallbackSuggestions(type),
    };
  }

  /**
   * Get fallback suggestions based on type
   */
  private getFallbackSuggestions(type: string): string[] {
    const suggestions: Record<string, string[]> = {
      trade: [
        'I want to buy 100 bales of cotton',
        'Show me current offers for wheat',
        'Accept offer #12345',
      ],
      logistics: [
        'Create transport order for SC-2024-001',
        'Track shipment TO-2024-001',
        'Update milestone for TO-2024-002',
      ],
      payment: [
        'Upload payment for SC-2024-001',
        'Verify payment INV-001',
        'Show outstanding payments',
      ],
      report: [
        'Generate trade register for this month',
        'Show payment summary',
        'Export quality report in Excel',
      ],
      general: [
        'Show my dashboard',
        'What trades are pending?',
        'Help me with trade creation',
      ],
    };

    return suggestions[type] || suggestions.general;
  }
}

// Singleton instance
export const aiService = new AIService();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Initialize AI service with auth token
 */
export function initializeAI(token: string): void {
  aiService.setToken(token);
}

/**
 * Parse trade query and return structured result
 */
export async function parseTradeQuery(
  message: string,
  context?: Record<string, any>
): Promise<AIParseResponse> {
  return aiService.parseTrade({ message, context });
}

/**
 * Parse logistics query
 */
export async function parseLogisticsQuery(
  message: string,
  context?: Record<string, any>
): Promise<AIParseResponse> {
  return aiService.parseLogistics({ message, context });
}

/**
 * Parse payment query
 */
export async function parsePaymentQuery(
  message: string,
  context?: Record<string, any>
): Promise<AIParseResponse> {
  return aiService.parsePayment({ message, context });
}

/**
 * Parse report query
 */
export async function parseReportQuery(
  message: string,
  context?: Record<string, any>
): Promise<AIParseResponse> {
  return aiService.parseReport({ message, context });
}

/**
 * Auto-detect query type and route to appropriate parser
 */
export async function parseQuery(
  message: string,
  context?: Record<string, any>
): Promise<AIParseResponse> {
  // Simple keyword-based routing (backend AI will do the real routing)
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('buy') || lowerMessage.includes('sell') || 
      lowerMessage.includes('trade') || lowerMessage.includes('offer')) {
    return parseTradeQuery(message, context);
  }
  
  if (lowerMessage.includes('transport') || lowerMessage.includes('logistics') || 
      lowerMessage.includes('shipment') || lowerMessage.includes('track')) {
    return parseLogisticsQuery(message, context);
  }
  
  if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || 
      lowerMessage.includes('utr') || lowerMessage.includes('reconcile')) {
    return parsePaymentQuery(message, context);
  }
  
  if (lowerMessage.includes('report') || lowerMessage.includes('export') || 
      lowerMessage.includes('generate') || lowerMessage.includes('summary')) {
    return parseReportQuery(message, context);
  }
  
  // Default: use generic parser
  return aiService.parse({ message, context });
}

/**
 * Get contextual suggestions
 */
export async function getAISuggestions(context: Record<string, any>): Promise<string[]> {
  return aiService.getSuggestions(context);
}
