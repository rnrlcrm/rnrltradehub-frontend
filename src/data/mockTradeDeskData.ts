/**
 * Mock Data for Trade Desk Module
 * 
 * Complete mock data for development and testing
 */

import {
  Trade,
  Offer,
  TestedLot,
  Negotiation,
  CommodityTemplate,
  QualityParameter,
  TradeAction,
  TradeStatus,
  OfferStatus,
  TestedLotStatus,
  Urgency,
  DashboardSummary,
  DashboardTrade,
  SellerPerformance
} from '../types/tradedesk.types';

// ============================================================================
// COMMODITY TEMPLATES
// ============================================================================

export const mockCottonParameters: QualityParameter[] = [
  { name: 'staple_mm', label: 'Staple Length', unit: 'mm', min: 26, max: 34, weight: 1.0, dataType: 'decimal' },
  { name: 'mic', label: 'Micronaire', unit: 'mic', min: 3.0, max: 5.5, weight: 1.0, dataType: 'decimal' },
  { name: 'strength_gpt', label: 'Strength', unit: 'g/tex', min: 20, max: 35, weight: 0.8, dataType: 'decimal' },
  { name: 'trash_pct', label: 'Trash %', unit: '%', min: 0, max: 5, weight: 0.6, dataType: 'decimal' },
  { name: 'moisture_pct', label: 'Moisture %', unit: '%', min: 0, max: 12, weight: 0.5, dataType: 'decimal' }
];

export const mockCommodityTemplates: Record<number, CommodityTemplate> = {
  12: { // Cotton
    commodityId: 12,
    name: 'Cotton',
    symbol: 'CTN',
    unit: 'Bales',
    qualityParameters: mockCottonParameters,
    varieties: [
      { id: 1, name: 'Shankar-6' },
      { id: 2, name: 'DCH-32' },
      { id: 3, name: 'Brahma' },
      { id: 4, name: 'Suvin' }
    ],
    tradeTypes: [
      { id: 1, name: 'Purchase' },
      { id: 2, name: 'Sale' }
    ],
    bargainTypes: [
      { id: 1, name: 'FOB' },
      { id: 2, name: 'FOR' },
      { id: 3, name: 'CIF' }
    ],
    passingTerms: [
      { id: 1, name: 'Actual Weight' },
      { id: 2, name: 'Average Weight' }
    ],
    weightmentTerms: [
      { id: 1, name: 'Seller Weightment' },
      { id: 2, name: 'Buyer Weightment' },
      { id: 3, name: 'Third Party Weightment' }
    ],
    deliveryTerms: [
      { id: 1, name: 'Ex-Gin', days: 0 },
      { id: 2, name: 'Ex-Warehouse', days: 7 },
      { id: 3, name: 'Ex-Station', days: 15 },
      { id: 4, name: 'Door Delivery', days: 30 }
    ],
    paymentTerms: [
      { id: 1, name: 'Advance', days: 0 },
      { id: 2, name: 'Against Delivery', days: 0 },
      { id: 3, name: 'Credit 30 days', days: 30 },
      { id: 4, name: 'Credit 60 days', days: 60 },
      { id: 5, name: 'Credit 90 days', days: 90 }
    ],
    certificates: ['NPOP', 'Organic', 'Fair Trade', 'BCI', 'GOTS']
  }
};

// ============================================================================
// TRADES (DEMANDS)
// ============================================================================

export const mockTrades: Trade[] = [
  {
    tradeId: 555,
    action: TradeAction.BUY,
    buyer: { id: 101, name: 'ABC Mills Pvt Ltd', type: 'Private Mill' },
    commodity: { id: 12, name: 'Cotton', symbol: 'CTN' },
    quantity: 500,
    unit: 'bales',
    variety: { id: 2, name: 'DCH-32' },
    parameters: {
      staple_mm: { min: 28, max: 30 },
      mic: { min: 3.8, max: 4.2 },
      strength_gpt: { min: 24, max: 30 }
    },
    tradeType: { id: 1, name: 'Purchase' },
    bargainType: { id: 2, name: 'FOR' },
    passing: { id: 1, name: 'Actual Weight' },
    weightment: { id: 2, name: 'Buyer Weightment' },
    deliveryTerm: { id: 3, name: 'Ex-Station', days: 15 },
    paymentTerm: { id: 3, name: 'Credit 30 days', days: 30 },
    location: {
      state: { id: 5, name: 'Gujarat' },
      region: { id: 12, name: 'Saurashtra', stateId: 5 },
      station: { id: 451, name: 'Rajkot', regionId: 12 }
    },
    certificates: ['NPOP'],
    targetPrice: 48000,
    notes: 'Urgent requirement for export order',
    urgency: Urgency.NORMAL,
    status: TradeStatus.OFFERS_RECEIVED,
    createdAt: '2025-11-14T10:30:00Z',
    updatedAt: '2025-11-14T11:15:00Z',
    expiresAt: '2025-11-21T10:30:00Z',
    offersCount: 3,
    bestMatchScore: 92,
    assignedTo: { id: 501, name: 'Sales Manager 1' }
  },
  {
    tradeId: 556,
    action: TradeAction.BUY,
    buyer: { id: 102, name: 'XYZ Textiles Ltd', type: 'Private Mill' },
    commodity: { id: 12, name: 'Cotton', symbol: 'CTN' },
    quantity: 300,
    unit: 'bales',
    variety: { id: 1, name: 'Shankar-6' },
    parameters: {
      staple_mm: { min: 26, max: 28 },
      mic: { min: 3.5, max: 4.0 }
    },
    tradeType: { id: 1, name: 'Purchase' },
    bargainType: { id: 1, name: 'FOB' },
    passing: { id: 1, name: 'Actual Weight' },
    weightment: { id: 1, name: 'Seller Weightment' },
    deliveryTerm: { id: 2, name: 'Ex-Warehouse', days: 7 },
    paymentTerm: { id: 2, name: 'Against Delivery', days: 0 },
    location: {
      state: { id: 6, name: 'Maharashtra' },
      region: { id: 15, name: 'Vidarbha', stateId: 6 }
    },
    certificates: ['Organic'],
    urgency: Urgency.URGENT,
    status: TradeStatus.POSTED,
    createdAt: '2025-11-14T12:00:00Z',
    updatedAt: '2025-11-14T12:00:00Z',
    expiresAt: '2025-11-21T12:00:00Z',
    offersCount: 0
  },
  {
    tradeId: 557,
    action: TradeAction.BUY,
    buyer: { id: 101, name: 'ABC Mills Pvt Ltd', type: 'Private Mill' },
    commodity: { id: 12, name: 'Cotton', symbol: 'CTN' },
    quantity: 1000,
    unit: 'bales',
    parameters: {
      staple_mm: { min: 29, max: 32 },
      mic: { min: 4.0, max: 4.5 },
      strength_gpt: { min: 26, max: 32 }
    },
    tradeType: { id: 1, name: 'Purchase' },
    bargainType: { id: 2, name: 'FOR' },
    passing: { id: 2, name: 'Average Weight' },
    weightment: { id: 2, name: 'Buyer Weightment' },
    deliveryTerm: { id: 4, name: 'Door Delivery', days: 30 },
    paymentTerm: { id: 4, name: 'Credit 60 days', days: 60 },
    location: {
      state: { id: 5, name: 'Gujarat' },
      region: { id: 12, name: 'Saurashtra', stateId: 5 },
      station: { id: 452, name: 'Gondal', regionId: 12 }
    },
    certificates: ['BCI'],
    targetPrice: 52000,
    urgency: Urgency.NORMAL,
    status: TradeStatus.NEGOTIATION,
    createdAt: '2025-11-13T09:00:00Z',
    updatedAt: '2025-11-14T08:30:00Z',
    expiresAt: '2025-11-20T09:00:00Z',
    offersCount: 5,
    bestMatchScore: 88
  }
];

// ============================================================================
// OFFERS
// ============================================================================

export const mockOffers: Offer[] = [
  {
    offerId: 9001,
    tradeId: 555,
    seller: { id: 21, name: 'XYZ Ginners', rating: 4.5, completedTrades: 45 },
    station: { id: 451, name: 'Rajkot' },
    price: 48000,
    currency: 'INR',
    priceUnit: 'per_candy',
    quantity: 300,
    unit: 'bales',
    variety: { id: 2, name: 'DCH-32' },
    parameters: {
      staple_mm: 29.0,
      mic: 4.1,
      strength_gpt: 26.5,
      trash_pct: 2.0,
      moisture_pct: 7.5
    },
    testReportUrl: 'https://s3.amazonaws.com/bucket/report_7001.pdf',
    testReportDate: '2025-11-10',
    testedLotId: 7001,
    deliveryTerm: { id: 3, name: 'Ex-Station' },
    paymentTerm: { id: 3, name: 'Credit 30 days' },
    validUntil: '2025-11-20T18:00:00Z',
    validityHours: 72,
    hoursRemaining: 150,
    notes: 'Can supply 300 now, additional 200 in 5 days',
    status: OfferStatus.PENDING,
    matchScore: 92,
    matchBreakdown: {
      parameterScore: 100,
      priceScore: 98,
      locationScore: 100,
      paymentScore: 100
    },
    parameterDeviations: [],
    createdAt: '2025-11-14T11:00:00Z',
    updatedAt: '2025-11-14T11:00:00Z',
    negotiationVersions: 1
  },
  {
    offerId: 9002,
    tradeId: 555,
    seller: { id: 34, name: 'PQR Cotton Co', rating: 4.2, completedTrades: 32 },
    station: { id: 452, name: 'Gondal' },
    price: 47500,
    currency: 'INR',
    priceUnit: 'per_candy',
    quantity: 500,
    unit: 'bales',
    variety: { id: 2, name: 'DCH-32' },
    parameters: {
      staple_mm: 28.5,
      mic: 3.9,
      strength_gpt: 25.0,
      trash_pct: 2.5,
      moisture_pct: 8.0
    },
    deliveryTerm: { id: 3, name: 'Ex-Station' },
    paymentTerm: { id: 3, name: 'Credit 30 days' },
    validUntil: '2025-11-19T18:00:00Z',
    validityHours: 72,
    hoursRemaining: 126,
    status: OfferStatus.PENDING,
    matchScore: 88,
    matchBreakdown: {
      parameterScore: 95,
      priceScore: 100,
      locationScore: 85,
      paymentScore: 100
    },
    parameterDeviations: [
      {
        parameter: 'staple_mm',
        requested: { min: 28, max: 30 },
        actual: 28.5,
        within: true
      }
    ],
    createdAt: '2025-11-14T11:15:00Z',
    updatedAt: '2025-11-14T11:15:00Z',
    negotiationVersions: 1
  },
  {
    offerId: 9003,
    tradeId: 555,
    seller: { id: 45, name: 'LMN Exports', rating: 4.7, completedTrades: 67 },
    station: { id: 451, name: 'Rajkot' },
    price: 49000,
    currency: 'INR',
    priceUnit: 'per_candy',
    quantity: 400,
    unit: 'bales',
    variety: { id: 2, name: 'DCH-32' },
    parameters: {
      staple_mm: 29.5,
      mic: 4.0,
      strength_gpt: 28.0,
      trash_pct: 1.5,
      moisture_pct: 7.0
    },
    testReportUrl: 'https://s3.amazonaws.com/bucket/report_7002.pdf',
    testReportDate: '2025-11-12',
    deliveryTerm: { id: 3, name: 'Ex-Station' },
    paymentTerm: { id: 3, name: 'Credit 30 days' },
    validUntil: '2025-11-21T18:00:00Z',
    validityHours: 96,
    hoursRemaining: 174,
    notes: 'Premium quality, ready for immediate dispatch',
    status: OfferStatus.PENDING,
    matchScore: 94,
    matchBreakdown: {
      parameterScore: 100,
      priceScore: 96,
      locationScore: 100,
      paymentScore: 100
    },
    parameterDeviations: [],
    createdAt: '2025-11-14T10:45:00Z',
    updatedAt: '2025-11-14T10:45:00Z',
    negotiationVersions: 1
  }
];

// ============================================================================
// TESTED LOTS
// ============================================================================

export const mockTestedLots: TestedLot[] = [
  {
    lotId: 7001,
    seller: { id: 21, name: 'XYZ Ginners' },
    commodity: { id: 12, name: 'Cotton' },
    station: { id: 451, name: 'Rajkot' },
    quantity: 1000,
    quantityAvailable: 700,
    quantityOffered: 300,
    unit: 'bales',
    variety: { id: 2, name: 'DCH-32' },
    parameters: {
      staple_mm: 29.0,
      mic: 4.1,
      strength_gpt: 26.5,
      trash_pct: 2.0,
      moisture_pct: 7.5
    },
    testReportUrl: 'https://s3.amazonaws.com/bucket/lot_7001.pdf',
    testReportDate: '2025-11-10',
    testingLab: 'Gujarat Cotton Testing Laboratory',
    validUntil: '2025-12-10',
    notes: 'Premium quality lot, ready for immediate dispatch',
    status: TestedLotStatus.ACTIVE,
    matchedTrades: [555, 556, 558],
    createdAt: '2025-11-14T09:00:00Z',
    updatedAt: '2025-11-14T11:00:00Z'
  }
];

// ============================================================================
// NEGOTIATIONS
// ============================================================================

export const mockNegotiations: Negotiation[] = [
  {
    negotiationId: 4001,
    offerId: 9001,
    version: 1,
    sender: { id: 21, name: 'XYZ Ginners', role: 'seller' },
    terms: { price: 48000, quantity: 300 },
    message: 'Initial offer',
    timestamp: '2025-11-14T11:00:00Z'
  }
];

// ============================================================================
// DASHBOARD DATA
// ============================================================================

export const mockDashboardSummary: DashboardSummary = {
  postedCount: 12,
  offersReceivedCount: 8,
  negotiatingCount: 5,
  agreedCount: 3,
  completedCount: 45,
  expiredCount: 2,
  totalValue: 125000000,
  avgMatchScore: 87.5,
  avgResponseTime: '2.5 hours',
  topCommodities: [
    { commodityId: 12, name: 'Cotton', count: 35 },
    { commodityId: 15, name: 'Wheat', count: 10 },
    { commodityId: 18, name: 'Rice', count: 5 }
  ]
};

export const mockDashboardTrades: DashboardTrade[] = mockTrades.map(trade => ({
  tradeId: trade.tradeId,
  buyer: trade.buyer,
  commodity: trade.commodity,
  quantity: trade.quantity,
  location: {
    state: trade.location.state.name,
    region: trade.location.region?.name
  },
  status: trade.status,
  offersCount: trade.offersCount,
  bestMatchScore: trade.bestMatchScore,
  lastActivity: trade.updatedAt,
  createdAt: trade.createdAt,
  urgency: trade.urgency,
  assignedTo: trade.assignedTo
}));

export const mockSellerPerformance: SellerPerformance[] = [
  {
    sellerId: 21,
    sellerName: 'XYZ Ginners',
    offersSubmitted: 45,
    offersAccepted: 32,
    acceptanceRate: 71.1,
    avgMatchScore: 89.5,
    avgResponseTime: '1.5 hours',
    totalValue: 45000000,
    rating: 4.5,
    reliabilityScore: 92
  },
  {
    sellerId: 34,
    sellerName: 'PQR Cotton Co',
    offersSubmitted: 38,
    offersAccepted: 25,
    acceptanceRate: 65.8,
    avgMatchScore: 85.2,
    avgResponseTime: '2.2 hours',
    totalValue: 32000000,
    rating: 4.2,
    reliabilityScore: 88
  },
  {
    sellerId: 45,
    sellerName: 'LMN Exports',
    offersSubmitted: 67,
    offersAccepted: 52,
    acceptanceRate: 77.6,
    avgMatchScore: 91.3,
    avgResponseTime: '1.2 hours',
    totalValue: 68000000,
    rating: 4.7,
    reliabilityScore: 95
  }
];
