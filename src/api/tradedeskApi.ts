/**
 * Trade Desk API Client
 * 
 * REST API wrapper for all Trade Desk endpoints
 */

import { apiClient, ApiResponse } from './client';
import {
  NLPParseRequest,
  NLPParseResponse,
  CommodityTemplate,
  CreateTradeRequest,
  CreateTradeResponse,
  Trade,
  CreateOfferRequest,
  CreateOfferResponse,
  Offer,
  CounterOfferRequest,
  CounterOfferResponse,
  AcceptOfferRequest,
  AcceptOfferResponse,
  RejectOfferRequest,
  RejectOfferResponse,
  CreateTestedLotRequest,
  CreateTestedLotResponse,
  TestedLot,
  Negotiation,
  MatchedSellersResponse,
  DashboardSummary,
  DashboardTradesResponse,
  SellerPerformanceResponse,
  ForceMatchRequest,
  ForceMatchResponse,
  InviteSellerRequest,
  InviteSellerResponse,
  TradeStatus,
  OfferStatus,
  TestedLotStatus
} from '../types/tradedesk.types';

const BASE_PATH = '/api';

// ============================================================================
// NLP & Commodity
// ============================================================================

export async function parseNLP(request: NLPParseRequest): Promise<ApiResponse<NLPParseResponse>> {
  return apiClient.post<NLPParseResponse>(`${BASE_PATH}/nlp/parse`, request);
}

export async function getCommodityParameters(commodityId: number): Promise<ApiResponse<CommodityTemplate>> {
  return apiClient.get<CommodityTemplate>(`${BASE_PATH}/commodity/${commodityId}/parameters`);
}

// ============================================================================
// Trades
// ============================================================================

export async function createTrade(request: CreateTradeRequest): Promise<ApiResponse<CreateTradeResponse>> {
  return apiClient.post<CreateTradeResponse>(`${BASE_PATH}/trades`, request);
}

export async function getTrade(tradeId: number): Promise<ApiResponse<Trade>> {
  return apiClient.get<Trade>(`${BASE_PATH}/trades/${tradeId}`);
}

export async function getMyTrades(params?: {
  status?: TradeStatus;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ trades: Trade[]; pagination: any }>> {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get(`${BASE_PATH}/trades/my-trades${query ? `?${query}` : ''}`);
}

export async function getMatchedSellers(tradeId: number): Promise<ApiResponse<MatchedSellersResponse>> {
  return apiClient.get<MatchedSellersResponse>(`${BASE_PATH}/trades/${tradeId}/matches`);
}

export async function getTradeOffers(tradeId: number, params?: {
  status?: OfferStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}): Promise<ApiResponse<{ offers: Offer[] }>> {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get(`${BASE_PATH}/trades/${tradeId}/offers${query ? `?${query}` : ''}`);
}

// ============================================================================
// Offers
// ============================================================================

export async function createOffer(request: CreateOfferRequest): Promise<ApiResponse<CreateOfferResponse>> {
  return apiClient.post<CreateOfferResponse>(`${BASE_PATH}/offers`, request);
}

export async function getMyOffers(params?: {
  status?: OfferStatus;
  tradeId?: number;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ offers: Offer[] }>> {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get(`${BASE_PATH}/offers/my-offers${query ? `?${query}` : ''}`);
}

export async function counterOffer(offerId: number, request: CounterOfferRequest): Promise<ApiResponse<CounterOfferResponse>> {
  return apiClient.post<CounterOfferResponse>(`${BASE_PATH}/offers/${offerId}/counter`, request);
}

export async function acceptOffer(offerId: number, request: AcceptOfferRequest): Promise<ApiResponse<AcceptOfferResponse>> {
  return apiClient.post<AcceptOfferResponse>(`${BASE_PATH}/offers/${offerId}/accept`, request);
}

export async function rejectOffer(offerId: number, request: RejectOfferRequest): Promise<ApiResponse<RejectOfferResponse>> {
  return apiClient.post<RejectOfferResponse>(`${BASE_PATH}/offers/${offerId}/reject`, request);
}

// ============================================================================
// Tested Lots
// ============================================================================

export async function createTestedLot(request: CreateTestedLotRequest): Promise<ApiResponse<CreateTestedLotResponse>> {
  return apiClient.post<CreateTestedLotResponse>(`${BASE_PATH}/tested-lots`, request);
}

export async function getTestedLots(params?: {
  sellerId?: number;
  commodityId?: number;
  status?: TestedLotStatus;
}): Promise<ApiResponse<{ lots: TestedLot[] }>> {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get(`${BASE_PATH}/tested-lots${query ? `?${query}` : ''}`);
}

// ============================================================================
// Negotiations
// ============================================================================

export async function getNegotiationHistory(offerId: number): Promise<ApiResponse<{ negotiations: Negotiation[] }>> {
  return apiClient.get(`${BASE_PATH}/negotiations/${offerId}/history`);
}

// ============================================================================
// Dashboard
// ============================================================================

export async function getDashboardSummary(params?: {
  orgId?: number;
  dateFrom?: string;
  dateTo?: string;
  commodityId?: number;
}): Promise<ApiResponse<DashboardSummary>> {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get<DashboardSummary>(`${BASE_PATH}/dashboard/trades-summary${query ? `?${query}` : ''}`);
}

export async function getDashboardTrades(params?: {
  status?: TradeStatus;
  commodityId?: number;
  regionId?: number;
  dateFrom?: string;
  dateTo?: string;
  ownerId?: number;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<DashboardTradesResponse>> {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get<DashboardTradesResponse>(`${BASE_PATH}/dashboard/trades${query ? `?${query}` : ''}`);
}

export async function getSellerPerformance(params?: {
  sellerId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ApiResponse<SellerPerformanceResponse>> {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get<SellerPerformanceResponse>(`${BASE_PATH}/dashboard/seller-performance${query ? `?${query}` : ''}`);
}

export async function forceMatch(tradeId: number, request: ForceMatchRequest): Promise<ApiResponse<ForceMatchResponse>> {
  return apiClient.post<ForceMatchResponse>(`${BASE_PATH}/dashboard/trade/${tradeId}/force-match`, request);
}

export async function inviteSeller(tradeId: number, request: InviteSellerRequest): Promise<ApiResponse<InviteSellerResponse>> {
  return apiClient.post<InviteSellerResponse>(`${BASE_PATH}/dashboard/trade/${tradeId}/invite-seller`, request);
}
