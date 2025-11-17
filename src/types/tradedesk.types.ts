/**
 * Trade Desk TypeScript Types
 * 
 * Complete type definitions for Trade Desk module entities and APIs
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum TradeAction {
  BUY = 'buy',
  SELL = 'sell'
}

export enum TradeStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  OFFERS_RECEIVED = 'OFFERS_RECEIVED',
  NEGOTIATION = 'NEGOTIATION',
  AGREED = 'AGREED',
  CONTRACT_CREATED = 'CONTRACT_CREATED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum OfferStatus {
  PENDING = 'PENDING',
  COUNTERED = 'COUNTERED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum TestedLotStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DEPLETED = 'DEPLETED'
}

export enum Urgency {
  NORMAL = 'normal',
  URGENT = 'urgent'
}

export enum MatchScoreLabel {
  BEST = 'Best Match',
  GOOD = 'Good Match',
  AVERAGE = 'Average Match',
  POOR = 'Poor Match'
}

// ============================================================================
// QUALITY PARAMETERS
// ============================================================================

export interface QualityParameter {
  name: string;              // e.g., "staple_mm", "mic"
  label: string;             // e.g., "Staple Length", "Micronaire"
  unit: string;              // e.g., "mm", "mic", "%"
  min: number;               // Commodity minimum allowed value
  max: number;               // Commodity maximum allowed value
  weight: number;            // Weight for scoring (default 1.0)
  dataType: 'decimal' | 'integer';
}

export interface ParameterRange {
  min: number;
  max: number;
}

export interface ParameterValue {
  [parameterName: string]: number;
}

export interface ParameterRanges {
  [parameterName: string]: ParameterRange;
}

export interface ParameterDeviation {
  parameter: string;
  requested: ParameterRange;
  actual: number;
  within: boolean;
  deviation?: number;         // Percentage or absolute
}

// ============================================================================
// LOCATION
// ============================================================================

export interface LocationHierarchy {
  state: { id: number; name: string };
  region?: { id: number; name: string; stateId: number };
  station?: { id: number; name: string; regionId: number };
}

export interface LocationSelection {
  stateId: number;
  regionId?: number;
  stationId?: number;
}

// ============================================================================
// TERMS (Delivery, Payment, etc.)
// ============================================================================

export interface Term {
  id: number;
  name: string;
  days?: number;
}

export interface StructuredTerm extends Term {
  description?: string;
}

// ============================================================================
// COMMODITY TEMPLATE
// ============================================================================

export interface CommodityTemplate {
  commodityId: number;
  name: string;
  symbol: string;
  unit: string;
  qualityParameters: QualityParameter[];
  varieties: Term[];
  tradeTypes: Term[];
  bargainTypes: Term[];
  passingTerms: Term[];
  weightmentTerms: Term[];
  deliveryTerms: StructuredTerm[];
  paymentTerms: StructuredTerm[];
  certificates: string[];
}

// ============================================================================
// TRADE (DEMAND)
// ============================================================================

export interface Trade {
  tradeId: number;
  action: TradeAction;
  buyer: {
    id: number;
    name: string;
    type: string;
  };
  commodity: {
    id: number;
    name: string;
    symbol: string;
  };
  quantity: number;
  unit: string;
  variety?: {
    id: number;
    name: string;
  };
  parameters: ParameterRanges;
  tradeType: Term;
  bargainType: Term;
  passing: Term;
  weightment: Term;
  deliveryTerm: StructuredTerm;
  paymentTerm: StructuredTerm;
  location: LocationHierarchy;
  certificates: string[];
  targetPrice?: number;
  notes?: string;
  urgency: Urgency;
  status: TradeStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  offersCount: number;
  bestMatchScore?: number;
  assignedTo?: {
    id: number;
    name: string;
  };
}

export interface CreateTradeRequest {
  action: TradeAction;
  buyerId: number;
  commodityId: number;
  quantity: number;
  unit: string;
  varietyId?: number;
  parameters: ParameterRanges;
  tradeTypeId: number;
  bargainTypeId: number;
  passingId: number;
  weightmentId: number;
  deliveryTermId: number;
  deliveryDays: number;
  paymentTermId: number;
  paymentDays: number;
  location: LocationSelection;
  certificates: string[];
  targetPrice?: number;
  notes?: string;
  urgency?: Urgency;
}

export interface CreateTradeResponse {
  tradeId: number;
  status: TradeStatus;
  estimatedMatches: number;
  createdAt: string;
  expiresAt: string;
}

// ============================================================================
// OFFER
// ============================================================================

export interface MatchBreakdown {
  parameterScore: number;  // 0-100
  priceScore: number;      // 0-100
  locationScore: number;   // 0-100
  paymentScore: number;    // 0-100
}

export interface Offer {
  offerId: number;
  tradeId: number;
  seller: {
    id: number;
    name: string;
    rating: number;
    completedTrades: number;
  };
  station: {
    id: number;
    name: string;
  };
  price: number;
  currency: string;
  priceUnit: string;
  quantity: number;
  unit: string;
  variety?: {
    id: number;
    name: string;
  };
  parameters: ParameterValue;
  testReportUrl?: string;
  testReportDate?: string;
  testedLotId?: number;
  deliveryTerm: Term;
  paymentTerm: Term;
  validUntil: string;
  validityHours: number;
  hoursRemaining: number;
  notes?: string;
  status: OfferStatus;
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  parameterDeviations: ParameterDeviation[];
  createdAt: string;
  updatedAt: string;
  negotiationVersions: number;
}

export interface CreateOfferRequest {
  tradeId: number;
  sellerId: number;
  stationId: number;
  price: number;
  currency: string;
  priceUnit: string;
  quantity: number;
  unit: string;
  varietyId?: number;
  parameters: ParameterValue;
  testReportUrl?: string;
  testReportDate?: string;
  testedLotId?: number;
  deliveryTermId: number;
  paymentTermId: number;
  validUntil: string;
  validityHours: number;
  notes?: string;
}

export interface CreateOfferResponse {
  offerId: number;
  tradeId: number;
  status: OfferStatus;
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  createdAt: string;
  validUntil: string;
}

// ============================================================================
// TESTED LOT
// ============================================================================

export interface TestedLot {
  lotId: number;
  seller: {
    id: number;
    name: string;
  };
  commodity: {
    id: number;
    name: string;
  };
  station: {
    id: number;
    name: string;
  };
  quantity: number;
  quantityAvailable: number;
  quantityOffered: number;
  unit: string;
  variety?: {
    id: number;
    name: string;
  };
  parameters: ParameterValue;
  testReportUrl: string;
  testReportDate: string;
  testingLab: string;
  validUntil: string;
  notes?: string;
  status: TestedLotStatus;
  matchedTrades: number[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestedLotRequest {
  sellerId: number;
  commodityId: number;
  stationId: number;
  quantity: number;
  unit: string;
  varietyId?: number;
  parameters: ParameterValue;
  testReportUrl: string;
  testReportDate: string;
  testingLab: string;
  validUntil: string;
  notes?: string;
}

export interface CreateTestedLotResponse {
  lotId: number;
  status: TestedLotStatus;
  matchedTrades: number[];
  createdAt: string;
}

// ============================================================================
// NEGOTIATION
// ============================================================================

export interface Negotiation {
  negotiationId: number;
  offerId: number;
  version: number;
  sender: {
    id: number;
    name: string;
    role: 'buyer' | 'seller';
  };
  terms: {
    price?: number;
    quantity?: number;
    validUntil?: string;
  };
  message: string;
  timestamp: string;
}

export interface CounterOfferRequest {
  senderId: number;
  senderRole: 'buyer' | 'seller';
  newPrice?: number;
  newQuantity?: number;
  newValidUntil?: string;
  message: string;
}

export interface CounterOfferResponse {
  negotiationId: number;
  offerId: number;
  version: number;
  status: OfferStatus;
  createdAt: string;
  currentTerms: {
    price?: number;
    quantity?: number;
    validUntil?: string;
  };
  counterBy: 'buyer' | 'seller';
}

// ============================================================================
// ACCEPTANCE & REJECTION
// ============================================================================

export interface AcceptOfferRequest {
  acceptedBy: number;
  acceptedRole: 'buyer' | 'seller';
  acceptedQuantity?: number;
  notes?: string;
}

export interface AcceptOfferResponse {
  offerId: number;
  tradeId: number;
  status: OfferStatus;
  contractId: number;
  contractStatus: string;
  acceptedAt: string;
}

export interface RejectOfferRequest {
  rejectedBy: number;
  rejectedRole: 'buyer' | 'seller';
  reason: string;
}

export interface RejectOfferResponse {
  offerId: number;
  status: OfferStatus;
  rejectedAt: string;
}

// ============================================================================
// NLP PARSING
// ============================================================================

export interface NLPParseRequest {
  text: string;
  userId: number;
}

export interface NLPParseResponse {
  action: TradeAction;
  commodity_hint: string;
  commodityId?: number;
  quantity?: number;
  unit?: string;
  certificates?: string[];
  parameterHints?: ParameterRanges;
  confidence: number;
}

// ============================================================================
// MATCHED SELLERS
// ============================================================================

export interface MatchedSeller {
  sellerId: number;
  sellerName: string;
  location: {
    state: string;
    region?: string;
    station?: string;
  };
  certificates: string[];
  estimatedMatchScore: number;
  notifiedAt: string;
  responseStatus: 'pending' | 'offer_submitted' | 'declined';
}

export interface MatchedSellersResponse {
  tradeId: number;
  matches: MatchedSeller[];
}

// ============================================================================
// DASHBOARD
// ============================================================================

export interface DashboardSummary {
  postedCount: number;
  offersReceivedCount: number;
  negotiatingCount: number;
  agreedCount: number;
  completedCount: number;
  expiredCount: number;
  totalValue: number;
  avgMatchScore: number;
  avgResponseTime: string;
  topCommodities: Array<{
    commodityId: number;
    name: string;
    count: number;
  }>;
}

export interface DashboardTrade {
  tradeId: number;
  buyer: {
    id: number;
    name: string;
  };
  commodity: {
    id: number;
    name: string;
  };
  quantity: number;
  location: {
    state: string;
    region?: string;
  };
  status: TradeStatus;
  offersCount: number;
  bestMatchScore?: number;
  lastActivity: string;
  createdAt: string;
  urgency: Urgency;
  assignedTo?: {
    id: number;
    name: string;
  };
}

export interface DashboardTradesResponse {
  trades: DashboardTrade[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SellerPerformance {
  sellerId: number;
  sellerName: string;
  offersSubmitted: number;
  offersAccepted: number;
  acceptanceRate: number;
  avgMatchScore: number;
  avgResponseTime: string;
  totalValue: number;
  rating: number;
  reliabilityScore: number;
}

export interface SellerPerformanceResponse {
  sellers: SellerPerformance[];
}

export interface ForceMatchRequest {
  sellerIds: number[];
  message: string;
  urgency: Urgency;
}

export interface ForceMatchResponse {
  tradeId: number;
  notifiedSellers: number;
  notificationsSent: Array<{
    sellerId: number;
    status: 'sent' | 'failed';
  }>;
}

export interface InviteSellerRequest {
  sellerId: number;
  message: string;
  bypassLocationMatch?: boolean;
}

export interface InviteSellerResponse {
  invitationId: number;
  sellerId: number;
  tradeId: number;
  sentAt: string;
}

// ============================================================================
// WEBSOCKET EVENTS
// ============================================================================

export enum WebSocketEventType {
  TRADE_POSTED = 'trade.posted',
  OFFER_SUBMITTED = 'offer.submitted',
  OFFER_COUNTER = 'offer.counter',
  OFFER_ACCEPTED = 'offer.accepted',
  OFFER_REJECTED = 'offer.rejected',
  TESTED_LOT_UPLOADED = 'testedlot.uploaded',
  TRADE_UPDATED = 'trade.updated',
  NOTIFICATION = 'notification',
  DASHBOARD_STATS = 'dashboard.stats',
  DASHBOARD_ALERT = 'dashboard.alert',
  // Controller milestone events
  CONTROLLER_CHECKIN = 'controller.checkin',
  CONTROLLER_SAMPLING = 'controller.sampling',
  CONTROLLER_WEIGHMENT = 'controller.weighment',
  CONTROLLER_LOADING = 'controller.loading',
  CONTROLLER_DISPATCH = 'controller.dispatch',
  // Transport milestone events
  TRANSPORT_ASSIGNED = 'transport.assigned',
  TRANSPORT_TRUCK_REACHED = 'transport.truck_reached',
  TRANSPORT_LOADING_STARTED = 'transport.loading_started',
  TRANSPORT_LOADING_FINISHED = 'transport.loading_finished',
  TRANSPORT_DISPATCHED = 'transport.dispatched',
  TRANSPORT_EN_ROUTE = 'transport.en_route',
  TRANSPORT_ARRIVED = 'transport.arrived',
  TRANSPORT_DELIVERED = 'transport.delivered',
  TRANSPORT_LOCATION_UPDATE = 'transport.location_update',
  // Payment events
  PAYMENT_UPLOADED = 'payment.uploaded',
  PAYMENT_CONFIRMED = 'payment.confirmed',
  PAYMENT_REJECTED = 'payment.rejected',
  // Dispute events
  DISPUTE_RAISED = 'dispute.raised',
  DISPUTE_UPDATED = 'dispute.updated',
  DISPUTE_RESOLVED = 'dispute.resolved',
  // Inventory events
  INVENTORY_UPDATED = 'inventory.updated',
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
}

export interface WebSocketMessage<T = any> {
  event: WebSocketEventType;
  data: T;
}

export interface TradePostedEvent {
  tradeId: number;
  commodity: { id: number; name: string };
  quantity: number;
  location: { state: string; region?: string };
  estimatedMatchScore: number;
  urgency: Urgency;
  postedAt: string;
}

export interface OfferSubmittedEvent {
  offerId: number;
  tradeId: number;
  seller: { id: number; name: string };
  price: number;
  quantity: number;
  matchScore: number;
  submittedAt: string;
}

export interface OfferCounterEvent {
  negotiationId: number;
  offerId: number;
  version: number;
  counterBy: 'buyer' | 'seller';
  newTerms: {
    price?: number;
    quantity?: number;
  };
  message: string;
  timestamp: string;
}

export interface OfferAcceptedEvent {
  offerId: number;
  tradeId: number;
  contractId: number;
  acceptedAt: string;
}

export interface OfferRejectedEvent {
  offerId: number;
  tradeId: number;
  rejectedBy: 'buyer' | 'seller';
  reason: string;
  rejectedAt: string;
}

export interface TestedLotUploadedEvent {
  lotId: number;
  seller: { id: number; name: string };
  commodity: { id: number; name: string };
  quantity: number;
  parameters: ParameterValue;
  matchedTrades: number[];
  uploadedAt: string;
}

export interface TradeUpdatedEvent {
  tradeId: number;
  status: TradeStatus;
  updatedAt: string;
}

export interface NotificationEvent {
  type: 'digest' | 'instant' | 'alert';
  commodity?: { id: number; name: string };
  count?: number;
  message: string;
  tradeIds?: number[];
  timestamp: string;
}

export interface DashboardStatsEvent {
  postedCount: number;
  offersReceivedCount: number;
  negotiatingCount: number;
  agreedCount: number;
  timestamp: string;
}

export interface DashboardAlertEvent {
  type: 'high_value' | 'expired' | 'no_response' | 'urgent';
  tradeId?: number;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: string;
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export interface AuditLog {
  logId: number;
  tradeId?: number;
  offerId?: number;
  actorId: number;
  actorRole: string;
  action: string;
  payload: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  traceId?: string;
}

// ============================================================================
// CHAT MESSAGE
// ============================================================================

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  parsed?: NLPParseResponse;
  relatedTrade?: number;
  relatedOffer?: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface TradeWizardState {
  step: 'commodity' | 'parameters' | 'terms' | 'location' | 'review';
  parsedData?: NLPParseResponse;
  template?: CommodityTemplate;
  formData: Partial<CreateTradeRequest>;
  validation: Record<string, string>;
}

export interface OfferFormState {
  trade: Trade;
  formData: Partial<CreateOfferRequest>;
  testedLot?: TestedLot;
  validation: Record<string, string>;
}

export interface NegotiationState {
  offer: Offer;
  history: Negotiation[];
  currentCounter?: Partial<CounterOfferRequest>;
}

export interface DashboardFilters {
  status?: TradeStatus;
  commodityId?: number;
  regionId?: number;
  dateFrom?: string;
  dateTo?: string;
  ownerId?: number;
  urgency?: Urgency;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// HELPER FUNCTIONS (type guards, converters)
// ============================================================================

export function getMatchScoreLabel(score: number): MatchScoreLabel {
  if (score >= 90) return MatchScoreLabel.BEST;
  if (score >= 75) return MatchScoreLabel.GOOD;
  if (score >= 60) return MatchScoreLabel.AVERAGE;
  return MatchScoreLabel.POOR;
}

export function getMatchScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export function getMatchScoreBadgeColor(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-800';
  if (score >= 75) return 'bg-blue-100 text-blue-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTimeRemaining(validUntil: string): string {
  const now = new Date();
  const expiry = new Date(validUntil);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function isTradeActive(status: TradeStatus): boolean {
  return [
    TradeStatus.POSTED,
    TradeStatus.OFFERS_RECEIVED,
    TradeStatus.NEGOTIATION
  ].includes(status);
}

export function isOfferActive(status: OfferStatus): boolean {
  return [
    OfferStatus.PENDING,
    OfferStatus.COUNTERED
  ].includes(status);
}

export function canCounterOffer(status: OfferStatus): boolean {
  return status === OfferStatus.PENDING || status === OfferStatus.COUNTERED;
}

export function canAcceptOffer(status: OfferStatus): boolean {
  return status === OfferStatus.PENDING || status === OfferStatus.COUNTERED;
}

export function canRejectOffer(status: OfferStatus): boolean {
  return status === OfferStatus.PENDING || status === OfferStatus.COUNTERED;
}

// ============================================================================
// ADDITIONAL EVENT TYPES FOR WEBSOCKET
// ============================================================================

export interface ControllerMilestoneEvent {
  taskId: string;
  contractNo: string;
  milestone: string;
  location?: { lat: number; lng: number };
  timestamp: string;
  data?: any;
}

export interface TransportMilestoneEvent {
  orderId: string;
  toNumber: string;
  milestone: string;
  location?: { lat: number; lng: number; address: string };
  timestamp: string;
  vehicleNo?: string;
  driverName?: string;
}

export interface PaymentEvent {
  paymentId: string;
  contractNo: string;
  amount: number;
  status: 'uploaded' | 'confirmed' | 'rejected';
  timestamp: string;
  remarks?: string;
}

export interface DisputeEvent {
  disputeId: string;
  contractNo: string;
  status: 'raised' | 'updated' | 'resolved';
  raisedBy: string;
  timestamp: string;
  description?: string;
}

export interface InventoryEvent {
  warehouseId: string;
  commodity: string;
  quantity: number;
  action: 'inward' | 'outward' | 'adjustment';
  timestamp: string;
}
