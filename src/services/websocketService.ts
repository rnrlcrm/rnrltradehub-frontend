/**
 * WebSocket Service for Trade Desk Real-Time Communication
 * 
 * Handles WebSocket connections, subscriptions, and event dispatching
 * with automatic reconnection and message queuing
 */

import {
  WebSocketEventType,
  WebSocketMessage,
  TradePostedEvent,
  OfferSubmittedEvent,
  OfferCounterEvent,
  OfferAcceptedEvent,
  OfferRejectedEvent,
  TestedLotUploadedEvent,
  TradeUpdatedEvent,
  NotificationEvent,
  DashboardStatsEvent,
  DashboardAlertEvent,
  ControllerMilestoneEvent,
  TransportMilestoneEvent,
  PaymentEvent,
  DisputeEvent,
  InventoryEvent,
} from '../types/tradedesk.types';

// WebSocket server URL from environment or default
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://api.rnrltradehub.com/ws';

type EventCallback<T = any> = (data: T) => void;

interface Subscription {
  channel: string;
  callbacks: Map<WebSocketEventType, EventCallback[]>;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private messageQueue: any[] = [];
  private isConnected = false;
  private isAuthenticated = false;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_INTERVAL = 3000; // 3 seconds
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  /**
   * Initialize WebSocket connection
   */
  connect(token: string): void {
    this.token = token;
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      console.log('[WebSocket] Connecting to', WS_BASE_URL);
      this.ws = new WebSocket(WS_BASE_URL);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    console.log('[WebSocket] Disconnecting');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to a channel (user or dashboard)
   */
  subscribe(channel: string, eventType: WebSocketEventType, callback: EventCallback): void {
    console.log(`[WebSocket] Subscribing to channel: ${channel}, event: ${eventType}`);
    
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, {
        channel,
        callbacks: new Map()
      });
      
      // Send subscription message if connected
      if (this.isAuthenticated) {
        this.send({
          type: 'subscribe',
          channel
        });
      }
    }
    
    const subscription = this.subscriptions.get(channel)!;
    
    if (!subscription.callbacks.has(eventType)) {
      subscription.callbacks.set(eventType, []);
    }
    
    subscription.callbacks.get(eventType)!.push(callback);
  }

  /**
   * Unsubscribe from a channel event
   */
  unsubscribe(channel: string, eventType?: WebSocketEventType, callback?: EventCallback): void {
    const subscription = this.subscriptions.get(channel);
    
    if (!subscription) return;
    
    if (!eventType) {
      // Unsubscribe from entire channel
      this.subscriptions.delete(channel);
      
      if (this.isAuthenticated) {
        this.send({
          type: 'unsubscribe',
          channel
        });
      }
      return;
    }
    
    if (!callback) {
      // Remove all callbacks for event type
      subscription.callbacks.delete(eventType);
    } else {
      // Remove specific callback
      const callbacks = subscription.callbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
    
    // Clean up empty subscription
    if (subscription.callbacks.size === 0) {
      this.subscriptions.delete(channel);
      
      if (this.isAuthenticated) {
        this.send({
          type: 'unsubscribe',
          channel
        });
      }
    }
  }

  /**
   * Send a message to WebSocket server
   */
  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Not connected, queuing message', message);
      this.messageQueue.push(message);
      return;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('[WebSocket] Connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Authenticate
    if (this.token) {
      this.send({
        type: 'auth',
        token: `Bearer ${this.token}`
      });
    }
    
    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('[WebSocket] Closed:', event.code, event.reason);
    this.isConnected = false;
    this.isAuthenticated = false;
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    // Attempt reconnection if not manually closed
    if (event.code !== 1000 && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('[WebSocket] Error:', event);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      // Handle authentication response
      if (message.type === 'auth_success') {
        console.log('[WebSocket] Authenticated');
        this.isAuthenticated = true;
        
        // Resubscribe to all channels
        this.subscriptions.forEach(subscription => {
          this.send({
            type: 'subscribe',
            channel: subscription.channel
          });
        });
        
        // Send queued messages
        this.flushMessageQueue();
        return;
      }
      
      if (message.type === 'auth_failed') {
        console.error('[WebSocket] Authentication failed');
        this.disconnect();
        return;
      }
      
      // Handle heartbeat pong
      if (message.type === 'pong') {
        return;
      }
      
      // Handle event messages
      if (message.event) {
        this.dispatchEvent(message);
      }
    } catch (error) {
      console.error('[WebSocket] Message parse error:', error);
    }
  }

  /**
   * Dispatch event to subscribed callbacks
   */
  private dispatchEvent(message: WebSocketMessage): void {
    const eventType = message.event;
    
    // Find matching subscriptions and invoke callbacks
    this.subscriptions.forEach(subscription => {
      const callbacks = subscription.callbacks.get(eventType);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(message.data);
          } catch (error) {
            console.error(`[WebSocket] Callback error for ${eventType}:`, error);
          }
        });
      }
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.RECONNECT_INTERVAL * Math.min(this.reconnectAttempts, 5);
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * Start heartbeat ping
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; authenticated: boolean } {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated
    };
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// Helper functions for specific event subscriptions

export function subscribeToUserChannel(
  userId: number,
  callbacks: {
    onTradePosted?: (data: TradePostedEvent) => void;
    onOfferSubmitted?: (data: OfferSubmittedEvent) => void;
    onOfferCounter?: (data: OfferCounterEvent) => void;
    onOfferAccepted?: (data: OfferAcceptedEvent) => void;
    onOfferRejected?: (data: OfferRejectedEvent) => void;
    onTestedLotUploaded?: (data: TestedLotUploadedEvent) => void;
    onTradeUpdated?: (data: TradeUpdatedEvent) => void;
    onNotification?: (data: NotificationEvent) => void;
  }
): void {
  const channel = `trade/${userId}`;
  
  if (callbacks.onTradePosted) {
    wsService.subscribe(channel, WebSocketEventType.TRADE_POSTED, callbacks.onTradePosted);
  }
  if (callbacks.onOfferSubmitted) {
    wsService.subscribe(channel, WebSocketEventType.OFFER_SUBMITTED, callbacks.onOfferSubmitted);
  }
  if (callbacks.onOfferCounter) {
    wsService.subscribe(channel, WebSocketEventType.OFFER_COUNTER, callbacks.onOfferCounter);
  }
  if (callbacks.onOfferAccepted) {
    wsService.subscribe(channel, WebSocketEventType.OFFER_ACCEPTED, callbacks.onOfferAccepted);
  }
  if (callbacks.onOfferRejected) {
    wsService.subscribe(channel, WebSocketEventType.OFFER_REJECTED, callbacks.onOfferRejected);
  }
  if (callbacks.onTestedLotUploaded) {
    wsService.subscribe(channel, WebSocketEventType.TESTED_LOT_UPLOADED, callbacks.onTestedLotUploaded);
  }
  if (callbacks.onTradeUpdated) {
    wsService.subscribe(channel, WebSocketEventType.TRADE_UPDATED, callbacks.onTradeUpdated);
  }
  if (callbacks.onNotification) {
    wsService.subscribe(channel, WebSocketEventType.NOTIFICATION, callbacks.onNotification);
  }
}

export function subscribeToDashboardChannel(
  orgId: number,
  callbacks: {
    onStatsUpdate?: (data: DashboardStatsEvent) => void;
    onAlert?: (data: DashboardAlertEvent) => void;
  }
): void {
  const channel = `dashboard/${orgId}`;
  
  if (callbacks.onStatsUpdate) {
    wsService.subscribe(channel, WebSocketEventType.DASHBOARD_STATS, callbacks.onStatsUpdate);
  }
  if (callbacks.onAlert) {
    wsService.subscribe(channel, WebSocketEventType.DASHBOARD_ALERT, callbacks.onAlert);
  }
}

export function unsubscribeFromUserChannel(userId: number): void {
  wsService.unsubscribe(`trade/${userId}`);
}

export function unsubscribeFromDashboardChannel(orgId: number): void {
  wsService.unsubscribe(`dashboard/${orgId}`);
}

// ============================================================================
// ADDITIONAL CHANNEL SUBSCRIPTIONS
// ============================================================================

export function subscribeToControllerChannel(
  userId: number,
  callbacks: {
    onCheckIn?: (data: ControllerMilestoneEvent) => void;
    onSampling?: (data: ControllerMilestoneEvent) => void;
    onWeighment?: (data: ControllerMilestoneEvent) => void;
    onLoading?: (data: ControllerMilestoneEvent) => void;
    onDispatch?: (data: ControllerMilestoneEvent) => void;
  }
): void {
  const channel = `controller/${userId}`;
  
  if (callbacks.onCheckIn) {
    wsService.subscribe(channel, WebSocketEventType.CONTROLLER_CHECKIN, callbacks.onCheckIn);
  }
  if (callbacks.onSampling) {
    wsService.subscribe(channel, WebSocketEventType.CONTROLLER_SAMPLING, callbacks.onSampling);
  }
  if (callbacks.onWeighment) {
    wsService.subscribe(channel, WebSocketEventType.CONTROLLER_WEIGHMENT, callbacks.onWeighment);
  }
  if (callbacks.onLoading) {
    wsService.subscribe(channel, WebSocketEventType.CONTROLLER_LOADING, callbacks.onLoading);
  }
  if (callbacks.onDispatch) {
    wsService.subscribe(channel, WebSocketEventType.CONTROLLER_DISPATCH, callbacks.onDispatch);
  }
}

export function subscribeToTransportChannel(
  userId: number,
  callbacks: {
    onAssigned?: (data: TransportMilestoneEvent) => void;
    onTruckReached?: (data: TransportMilestoneEvent) => void;
    onLoadingStarted?: (data: TransportMilestoneEvent) => void;
    onLoadingFinished?: (data: TransportMilestoneEvent) => void;
    onDispatched?: (data: TransportMilestoneEvent) => void;
    onEnRoute?: (data: TransportMilestoneEvent) => void;
    onArrived?: (data: TransportMilestoneEvent) => void;
    onDelivered?: (data: TransportMilestoneEvent) => void;
    onLocationUpdate?: (data: TransportMilestoneEvent) => void;
  }
): void {
  const channel = `transport/${userId}`;
  
  if (callbacks.onAssigned) {
    wsService.subscribe(channel, WebSocketEventType.TRANSPORT_ASSIGNED, callbacks.onAssigned);
  }
  if (callbacks.onTruckReached) {
    wsService.subscribe(channel, WebSocketEventType.TRANSPORT_TRUCK_REACHED, callbacks.onTruckReached);
  }
  if (callbacks.onLoadingStarted) {
    wsService.subscribe(channel, WebSocketEventType.TRANSPORT_LOADING_STARTED, callbacks.onLoadingStarted);
  }
  if (callbacks.onLoadingFinished) {
    wsService.subscribe(channel, WebSocketEventType.TRANSPORT_LOADING_FINISHED, callbacks.onLoadingFinished);
  }
  if (callbacks.onDispatched) {
    wsService.subscribe(channel, WebSocketEventType.TRANSPORT_DISPATCHED, callbacks.onDispatched);
  }
  if (callbacks.onEnRoute) {
    wsService.subscribe(channel, WebSocketEventType.TRANSPORT_EN_ROUTE, callbacks.onEnRoute);
  }
  if (callbacks.onArrived) {
    wsService.subscribe(channel, WebSocketEventType.TRANSPORT_ARRIVED, callbacks.onArrived);
  }
  if (callbacks.onDelivered) {
    wsService.subscribe(channel, WebSocketEventType.TRANSPORT_DELIVERED, callbacks.onDelivered);
  }
  if (callbacks.onLocationUpdate) {
    wsService.subscribe(channel, WebSocketEventType.TRANSPORT_LOCATION_UPDATE, callbacks.onLocationUpdate);
  }
}

export function subscribeToPaymentChannel(
  userId: number,
  callbacks: {
    onPaymentUploaded?: (data: PaymentEvent) => void;
    onPaymentConfirmed?: (data: PaymentEvent) => void;
    onPaymentRejected?: (data: PaymentEvent) => void;
  }
): void {
  const channel = `payment/${userId}`;
  
  if (callbacks.onPaymentUploaded) {
    wsService.subscribe(channel, WebSocketEventType.PAYMENT_UPLOADED, callbacks.onPaymentUploaded);
  }
  if (callbacks.onPaymentConfirmed) {
    wsService.subscribe(channel, WebSocketEventType.PAYMENT_CONFIRMED, callbacks.onPaymentConfirmed);
  }
  if (callbacks.onPaymentRejected) {
    wsService.subscribe(channel, WebSocketEventType.PAYMENT_REJECTED, callbacks.onPaymentRejected);
  }
}

export function subscribeToDisputeChannel(
  userId: number,
  callbacks: {
    onDisputeRaised?: (data: DisputeEvent) => void;
    onDisputeUpdated?: (data: DisputeEvent) => void;
    onDisputeResolved?: (data: DisputeEvent) => void;
  }
): void {
  const channel = `dispute/${userId}`;
  
  if (callbacks.onDisputeRaised) {
    wsService.subscribe(channel, WebSocketEventType.DISPUTE_RAISED, callbacks.onDisputeRaised);
  }
  if (callbacks.onDisputeUpdated) {
    wsService.subscribe(channel, WebSocketEventType.DISPUTE_UPDATED, callbacks.onDisputeUpdated);
  }
  if (callbacks.onDisputeResolved) {
    wsService.subscribe(channel, WebSocketEventType.DISPUTE_RESOLVED, callbacks.onDisputeResolved);
  }
}

export function subscribeToInventoryChannel(
  warehouseId: number,
  callbacks: {
    onInventoryUpdated?: (data: InventoryEvent) => void;
    onLowStock?: (data: InventoryEvent) => void;
  }
): void {
  const channel = `inventory/${warehouseId}`;
  
  if (callbacks.onInventoryUpdated) {
    wsService.subscribe(channel, WebSocketEventType.INVENTORY_UPDATED, callbacks.onInventoryUpdated);
  }
  if (callbacks.onLowStock) {
    wsService.subscribe(channel, WebSocketEventType.INVENTORY_LOW_STOCK, callbacks.onLowStock);
  }
}

export function unsubscribeFromControllerChannel(userId: number): void {
  wsService.unsubscribe(`controller/${userId}`);
}

export function unsubscribeFromTransportChannel(userId: number): void {
  wsService.unsubscribe(`transport/${userId}`);
}

export function unsubscribeFromPaymentChannel(userId: number): void {
  wsService.unsubscribe(`payment/${userId}`);
}

export function unsubscribeFromDisputeChannel(userId: number): void {
  wsService.unsubscribe(`dispute/${userId}`);
}

export function unsubscribeFromInventoryChannel(warehouseId: number): void {
  wsService.unsubscribe(`inventory/${warehouseId}`);
}
