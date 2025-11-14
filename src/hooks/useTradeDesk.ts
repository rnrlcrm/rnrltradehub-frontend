/**
 * Custom React Hooks for Trade Desk
 */

import { useState, useEffect, useCallback } from 'react';
import { wsService, subscribeToUserChannel, subscribeToDashboardChannel, unsubscribeFromUserChannel, unsubscribeFromDashboardChannel } from '../services/websocketService';
import * as tradedeskApi from '../api/tradedeskApi';
import { parseNLPMessage, suggestNextQuestions, formatParsedDataConfirmation } from '../services/nlpService';
import {
  Trade,
  Offer,
  TestedLot,
  NLPParseResponse,
  TradeStatus,
  OfferStatus,
  ChatMessage,
  DashboardSummary,
  DashboardTrade
} from '../types/tradedesk.types';

// Mock mode flag
const USE_MOCK = true;

// ============================================================================
// useWebSocket Hook
// ============================================================================

export function useWebSocket(userId: number, orgId?: number) {
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Connect WebSocket
    const token = localStorage.getItem('authToken') || 'mock-token';
    wsService.connect(token);

    // Check status periodically
    const interval = setInterval(() => {
      const status = wsService.getStatus();
      setConnected(status.connected);
      setAuthenticated(status.authenticated);
    }, 1000);

    return () => {
      clearInterval(interval);
      wsService.disconnect();
    };
  }, []);

  return { connected, authenticated };
}

// ============================================================================
// useTradeWebSocket Hook
// ============================================================================

export function useTradeWebSocket(userId: number, callbacks: {
  onOfferSubmitted?: (offer: any) => void;
  onOfferCounter?: (data: any) => void;
  onOfferAccepted?: (data: any) => void;
  onTradeUpdated?: (data: any) => void;
  onNotification?: (data: any) => void;
}) {
  useEffect(() => {
    if (!userId) return;

    subscribeToUserChannel(userId, callbacks);

    return () => {
      unsubscribeFromUserChannel(userId);
    };
  }, [userId, callbacks]);
}

// ============================================================================
// useDashboardWebSocket Hook
// ============================================================================

export function useDashboardWebSocket(orgId: number, callbacks: {
  onStatsUpdate?: (stats: any) => void;
  onAlert?: (alert: any) => void;
}) {
  useEffect(() => {
    if (!orgId) return;

    subscribeToDashboardChannel(orgId, callbacks);

    return () => {
      unsubscribeFromDashboardChannel(orgId);
    };
  }, [orgId, callbacks]);
}

// ============================================================================
// useNLP Hook
// ============================================================================

export function useNLP() {
  const [parsing, setParsing] = useState(false);
  const [lastParsed, setLastParsed] = useState<NLPParseResponse | null>(null);

  const parse = useCallback(async (text: string, userId: number): Promise<NLPParseResponse> => {
    setParsing(true);
    try {
      const result = await parseNLPMessage({ text, userId });
      setLastParsed(result);
      return result;
    } finally {
      setParsing(false);
    }
  }, []);

  const getSuggestions = useCallback((parsed: NLPParseResponse) => {
    return suggestNextQuestions(parsed);
  }, []);

  const formatConfirmation = useCallback((parsed: NLPParseResponse) => {
    return formatParsedDataConfirmation(parsed);
  }, []);

  return {
    parse,
    parsing,
    lastParsed,
    getSuggestions,
    formatConfirmation
  };
}

// ============================================================================
// useMyTrades Hook
// ============================================================================

export function useMyTrades(userId: number, status?: TradeStatus) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrades = useCallback(async () => {
    if (USE_MOCK) {
      // Load from mock data
      const { mockTrades } = await import('../data/mockTradeDeskData');
      setTrades(mockTrades.filter(t => !status || t.status === status));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await tradedeskApi.getMyTrades({ status });
      setTrades(response.data.trades);
    } catch (err: any) {
      setError(err.message || 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  return { trades, loading, error, reload: loadTrades };
}

// ============================================================================
// useTradeOffers Hook
// ============================================================================

export function useTradeOffers(tradeId: number) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    if (!tradeId) return;

    if (USE_MOCK) {
      const { mockOffers } = await import('../data/mockTradeDeskData');
      setOffers(mockOffers.filter(o => o.tradeId === tradeId));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await tradedeskApi.getTradeOffers(tradeId);
      setOffers(response.data.offers);
    } catch (err: any) {
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [tradeId]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  return { offers, loading, error, reload: loadOffers };
}

// ============================================================================
// useMyOffers Hook (Seller)
// ============================================================================

export function useMyOffers(sellerId: number, status?: OfferStatus) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    if (USE_MOCK) {
      const { mockOffers } = await import('../data/mockTradeDeskData');
      setOffers(mockOffers.filter(o => !status || o.status === status));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await tradedeskApi.getMyOffers({ status });
      setOffers(response.data.offers);
    } catch (err: any) {
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  return { offers, loading, error, reload: loadOffers };
}

// ============================================================================
// useDashboard Hook
// ============================================================================

export function useDashboard(orgId: number) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trades, setTrades] = useState<DashboardTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (USE_MOCK) {
      const { mockDashboardSummary, mockDashboardTrades } = await import('../data/mockTradeDeskData');
      setSummary(mockDashboardSummary);
      setTrades(mockDashboardTrades);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [summaryRes, tradesRes] = await Promise.all([
        tradedeskApi.getDashboardSummary({ orgId }),
        tradedeskApi.getDashboardTrades({})
      ]);
      setSummary(summaryRes.data);
      setTrades(tradesRes.data.trades);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Subscribe to real-time updates
  useDashboardWebSocket(orgId, {
    onStatsUpdate: (stats) => {
      setSummary(prev => prev ? { ...prev, ...stats } : null);
    }
  });

  return { summary, trades, loading, error, reload: loadDashboard };
}

// ============================================================================
// useChatMessages Hook
// ============================================================================

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 1,
    sender: 'ai',
    text: 'Hello! I\'m your Trade Desk AI assistant. Tell me what you\'re looking to buy or sell, and I\'ll help you create a trade requirement.\n\nFor example: "Need 500 bales organic cotton with staple 28-30"',
    timestamp: new Date()
  }]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: messages.length + 1,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, [messages.length]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, addMessage, clearMessages };
}

// ============================================================================
// useMatchScore Hook
// ============================================================================

export function useMatchScore() {
  const calculateScore = useCallback((offer: Offer, trade: Trade) => {
    // This would use the full matching algorithm
    // For now, return the pre-calculated score
    return offer.matchScore;
  }, []);

  return { calculateScore };
}
