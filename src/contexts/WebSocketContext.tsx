/**
 * WebSocket Context for Real-Time Updates
 * Provides WebSocket connection and real-time data across the application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebSocketService } from '../services/websocketService';
import { WebSocketEventType } from '../types/tradedesk.types';

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (channel: string, eventType: WebSocketEventType, callback: (data: any) => void) => () => void;
  send: (message: any) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const wsService = new WebSocketService();

interface WebSocketProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, enabled = true }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Get auth token from localStorage (or your auth service)
    const token = localStorage.getItem('authToken') || 'demo-token';

    // Connect to WebSocket
    wsService.connect(token);

    // Subscribe to connection status events
    const unsubscribeOpen = wsService.subscribe('connection', WebSocketEventType.CONNECTED, () => {
      setIsConnected(true);
      console.log('[WebSocket] Connected');
    });

    const unsubscribeClose = wsService.subscribe('connection', WebSocketEventType.DISCONNECTED, () => {
      setIsConnected(false);
      console.log('[WebSocket] Disconnected');
    });

    // Cleanup on unmount
    return () => {
      unsubscribeOpen();
      unsubscribeClose();
      wsService.disconnect();
    };
  }, [enabled]);

  const subscribe = (channel: string, eventType: WebSocketEventType, callback: (data: any) => void) => {
    return wsService.subscribe(channel, eventType, callback);
  };

  const send = (message: any) => {
    wsService.send(message);
  };

  const reconnect = () => {
    const token = localStorage.getItem('authToken') || 'demo-token';
    wsService.connect(token);
  };

  const value: WebSocketContextType = {
    isConnected,
    subscribe,
    send,
    reconnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketProvider;
