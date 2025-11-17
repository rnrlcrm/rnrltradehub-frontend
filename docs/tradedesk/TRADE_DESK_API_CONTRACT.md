# Trade Desk API Contract

**Version:** 1.0  
**Date:** 2025-11-14  
**Purpose:** Complete REST + WebSocket API specification for Trade Desk module backend implementation

---

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URLs](#base-urls)
4. [REST Endpoints](#rest-endpoints)
5. [WebSocket Channels](#websocket-channels)
6. [Data Models](#data-models)
7. [Matching Algorithm](#matching-algorithm)
8. [State Machine](#state-machine)
9. [Error Codes](#error-codes)
10. [Example Flows](#example-flows)

---

## Overview

Trade Desk is a chat-first, AI-powered commodity trading platform enabling:
- **Buyers** create demands via NLP chat
- **Sellers** submit offers with test reports
- **Real-time matching** using weighted scoring algorithm
- **Multi-round negotiations** with versioned counter-offers
- **Back-office oversight** with live dashboard

**Key Principles:**
- Progressive disclosure (minimal buyer input)
- Real-time WebSocket updates
- Commodity template-driven parameters
- Separate from Sales Contracts (new contract type)

---

## Authentication

All API requests require Bearer token authentication:

```http
Authorization: Bearer {token}
```

User roles with Trade Desk access:
- **Buyer Partner**: Create own trades, view own offers
- **Seller Partner**: Submit own offers, view matched trades
- **Trader**: Create/submit trades & offers (proxy), multiple stations
- **Sales (internal)**: Create/view all trades, access dashboard
- **Admin**: Full access

---

## Base URLs

**REST API:** `https://api.rnrltradehub.com/api`  
**WebSocket:** `wss://api.rnrltradehub.com/ws`

---

## REST Endpoints

### 1. NLP Parsing

**POST** `/nlp/parse`

Parse natural language buyer input to extract trade details.

**Request:**
```json
{
  "text": "Need 500 bales Organic NPOP cotton with staple 28-30",
  "userId": 123
}
```

**Response:**
```json
{
  "action": "buy",
  "commodity_hint": "cotton",
  "commodityId": 12,
  "quantity": 500,
  "unit": "bales",
  "certificates": ["NPOP", "Organic"],
  "parameterHints": {
    "staple_mm": { "min": 28, "max": 30 }
  },
  "confidence": 0.92
}
```

**Error Codes:**
- `400` - Invalid input text
- `422` - Unable to parse (low confidence)

---

### 2. Commodity Metadata

**GET** `/commodity/{commodityId}/parameters`

Get commodity template with quality parameters, terms, and trading options.

**Response:**
```json
{
  "commodityId": 12,
  "name": "Cotton",
  "symbol": "CTN",
  "unit": "Bales",
  "qualityParameters": [
    {
      "name": "staple_mm",
      "label": "Staple Length",
      "unit": "mm",
      "min": 26,
      "max": 34,
      "weight": 1.0,
      "dataType": "decimal"
    },
    {
      "name": "mic",
      "label": "Micronaire",
      "unit": "mic",
      "min": 3.0,
      "max": 5.5,
      "weight": 1.0,
      "dataType": "decimal"
    },
    {
      "name": "strength_gpt",
      "label": "Strength",
      "unit": "g/tex",
      "min": 20,
      "max": 35,
      "weight": 0.8,
      "dataType": "decimal"
    },
    {
      "name": "trash_pct",
      "label": "Trash %",
      "unit": "%",
      "min": 0,
      "max": 5,
      "weight": 0.6,
      "dataType": "decimal"
    },
    {
      "name": "moisture_pct",
      "label": "Moisture %",
      "unit": "%",
      "min": 0,
      "max": 12,
      "weight": 0.5,
      "dataType": "decimal"
    }
  ],
  "varieties": [
    { "id": 1, "name": "Shankar-6" },
    { "id": 2, "name": "DCH-32" },
    { "id": 3, "name": "Brahma" }
  ],
  "tradeTypes": [
    { "id": 1, "name": "Purchase" },
    { "id": 2, "name": "Sale" }
  ],
  "bargainTypes": [
    { "id": 1, "name": "FOB" },
    { "id": 2, "name": "FOR" }
  ],
  "passingTerms": [
    { "id": 1, "name": "Actual Weight" },
    { "id": 2, "name": "Average Weight" }
  ],
  "weightmentTerms": [
    { "id": 1, "name": "Seller Weightment" },
    { "id": 2, "name": "Buyer Weightment" }
  ],
  "deliveryTerms": [
    { "id": 1, "name": "Ex-Gin", "days": 0 },
    { "id": 2, "name": "Ex-Warehouse", "days": 7 },
    { "id": 3, "name": "Ex-Station", "days": 15 }
  ],
  "paymentTerms": [
    { "id": 1, "name": "Advance", "days": 0 },
    { "id": 2, "name": "Against Delivery", "days": 0 },
    { "id": 3, "name": "Credit 30 days", "days": 30 },
    { "id": 4, "name": "Credit 60 days", "days": 60 }
  ],
  "certificates": ["NPOP", "Organic", "Fair Trade", "BCI"]
}
```

---

### 3. Create Trade (Buyer Demand)

**POST** `/trades`

Create a new trade (buyer demand).

**Request:**
```json
{
  "action": "buy",
  "buyerId": 101,
  "commodityId": 12,
  "quantity": 500,
  "unit": "bales",
  "varietyId": 2,
  "parameters": {
    "staple_mm": { "min": 28, "max": 30 },
    "mic": { "min": 3.8, "max": 4.2 },
    "strength_gpt": { "min": 24, "max": 30 }
  },
  "tradeTypeId": 1,
  "bargainTypeId": 2,
  "passingId": 1,
  "weightmentId": 2,
  "deliveryTermId": 3,
  "deliveryDays": 15,
  "paymentTermId": 3,
  "paymentDays": 30,
  "location": {
    "stateId": 5,
    "regionId": 12,
    "stationId": 451
  },
  "certificates": ["NPOP"],
  "targetPrice": 48000,
  "notes": "Urgent requirement for export order",
  "urgency": "normal"
}
```

**Response:**
```json
{
  "tradeId": 555,
  "status": "POSTED",
  "estimatedMatches": 6,
  "createdAt": "2025-11-14T10:30:00Z",
  "expiresAt": "2025-11-21T10:30:00Z"
}
```

**Error Codes:**
- `400` - Invalid request data
- `422` - Validation failed (missing mandatory fields, parameters outside commodity min/max)
- `404` - Commodity not found

---

### 4. Get Trade Details

**GET** `/trades/{tradeId}`

Get full trade details including offers and negotiation history.

**Response:**
```json
{
  "tradeId": 555,
  "action": "buy",
  "buyer": {
    "id": 101,
    "name": "ABC Mills Pvt Ltd",
    "type": "Private Mill"
  },
  "commodity": {
    "id": 12,
    "name": "Cotton",
    "symbol": "CTN"
  },
  "quantity": 500,
  "unit": "bales",
  "variety": { "id": 2, "name": "DCH-32" },
  "parameters": {
    "staple_mm": { "min": 28, "max": 30 },
    "mic": { "min": 3.8, "max": 4.2 },
    "strength_gpt": { "min": 24, "max": 30 }
  },
  "location": {
    "state": { "id": 5, "name": "Gujarat" },
    "region": { "id": 12, "name": "Saurashtra" },
    "station": { "id": 451, "name": "Rajkot" }
  },
  "certificates": ["NPOP"],
  "targetPrice": 48000,
  "status": "OFFERS_RECEIVED",
  "createdAt": "2025-11-14T10:30:00Z",
  "updatedAt": "2025-11-14T11:15:00Z",
  "offersCount": 3,
  "bestMatchScore": 92
}
```

---

### 5. Get Matched Sellers (Optional Preview)

**GET** `/trades/{tradeId}/matches`

Get list of sellers matched for the trade (before they submit offers).

**Response:**
```json
{
  "tradeId": 555,
  "matches": [
    {
      "sellerId": 21,
      "sellerName": "XYZ Ginners",
      "location": {
        "state": "Gujarat",
        "region": "Saurashtra",
        "station": "Rajkot"
      },
      "certificates": ["NPOP", "Organic"],
      "estimatedMatchScore": 90,
      "notifiedAt": "2025-11-14T10:31:00Z",
      "responseStatus": "pending"
    },
    {
      "sellerId": 34,
      "sellerName": "PQR Cotton Co",
      "location": {
        "state": "Gujarat",
        "region": "Saurashtra",
        "station": "Gondal"
      },
      "certificates": ["NPOP"],
      "estimatedMatchScore": 85,
      "notifiedAt": "2025-11-14T10:31:00Z",
      "responseStatus": "offer_submitted"
    }
  ]
}
```

---

### 6. Submit Offer (Seller)

**POST** `/offers`

Seller submits an offer for a trade.

**Request:**
```json
{
  "tradeId": 555,
  "sellerId": 21,
  "stationId": 451,
  "price": 48000,
  "currency": "INR",
  "priceUnit": "per_candy",
  "quantity": 300,
  "unit": "bales",
  "varietyId": 2,
  "parameters": {
    "staple_mm": 29.0,
    "mic": 4.1,
    "strength_gpt": 26.5,
    "trash_pct": 2.0,
    "moisture_pct": 7.5
  },
  "testReportUrl": "https://s3.amazonaws.com/bucket/report_7001.pdf",
  "testReportDate": "2025-11-10",
  "testedLotId": 7001,
  "deliveryTermId": 3,
  "paymentTermId": 3,
  "validUntil": "2025-11-20T18:00:00Z",
  "validityHours": 72,
  "notes": "Can supply 300 now, additional 200 in 5 days"
}
```

**Response:**
```json
{
  "offerId": 9001,
  "tradeId": 555,
  "status": "PENDING",
  "matchScore": 92,
  "matchBreakdown": {
    "parameterScore": 100,
    "priceScore": 98,
    "locationScore": 100,
    "paymentScore": 100
  },
  "createdAt": "2025-11-14T11:00:00Z",
  "validUntil": "2025-11-20T18:00:00Z"
}
```

**Error Codes:**
- `400` - Invalid request data
- `404` - Trade not found
- `409` - Offer already exists for this seller-trade combination
- `410` - Trade expired or closed
- `422` - Parameters outside commodity min/max

---

### 7. Get Offers for Trade

**GET** `/trades/{tradeId}/offers`

Get all offers for a trade, ranked by match score.

**Query Params:**
- `status` (optional): `PENDING`, `COUNTERED`, `ACCEPTED`, `REJECTED`, `EXPIRED`
- `sortBy` (optional): `matchScore`, `price`, `createdAt`
- `order` (optional): `asc`, `desc`

**Response:**
```json
{
  "tradeId": 555,
  "offers": [
    {
      "offerId": 9001,
      "seller": {
        "id": 21,
        "name": "XYZ Ginners",
        "rating": 4.5,
        "completedTrades": 45
      },
      "price": 48000,
      "currency": "INR",
      "quantity": 300,
      "parameters": {
        "staple_mm": 29.0,
        "mic": 4.1,
        "strength_gpt": 26.5,
        "trash_pct": 2.0,
        "moisture_pct": 7.5
      },
      "matchScore": 92,
      "matchBreakdown": {
        "parameterScore": 100,
        "priceScore": 98,
        "locationScore": 100,
        "paymentScore": 100
      },
      "parameterDeviations": [],
      "testReportUrl": "https://s3.amazonaws.com/bucket/report_7001.pdf",
      "status": "PENDING",
      "validUntil": "2025-11-20T18:00:00Z",
      "hoursRemaining": 71.5,
      "createdAt": "2025-11-14T11:00:00Z",
      "negotiationVersions": 1
    },
    {
      "offerId": 9002,
      "seller": {
        "id": 34,
        "name": "PQR Cotton Co",
        "rating": 4.2,
        "completedTrades": 32
      },
      "price": 47500,
      "currency": "INR",
      "quantity": 500,
      "parameters": {
        "staple_mm": 28.5,
        "mic": 3.9,
        "strength_gpt": 25.0,
        "trash_pct": 2.5,
        "moisture_pct": 8.0
      },
      "matchScore": 88,
      "matchBreakdown": {
        "parameterScore": 95,
        "priceScore": 100,
        "locationScore": 85,
        "paymentScore": 100
      },
      "parameterDeviations": [
        {
          "parameter": "staple_mm",
          "requested": { "min": 28, "max": 30 },
          "actual": 28.5,
          "within": true
        }
      ],
      "testReportUrl": null,
      "status": "PENDING",
      "validUntil": "2025-11-19T18:00:00Z",
      "hoursRemaining": 47.5,
      "createdAt": "2025-11-14T11:15:00Z",
      "negotiationVersions": 1
    }
  ]
}
```

---

### 8. Counter Offer (Negotiation)

**POST** `/offers/{offerId}/counter`

Submit a counter-offer in negotiation.

**Request:**
```json
{
  "senderId": 101,
  "senderRole": "buyer",
  "newPrice": 47500,
  "newQuantity": 350,
  "newValidUntil": "2025-11-21T18:00:00Z",
  "message": "Can you reduce price to 47500? I can take 350 bales immediately."
}
```

**Response:**
```json
{
  "negotiationId": 4001,
  "offerId": 9001,
  "version": 2,
  "status": "COUNTERED",
  "createdAt": "2025-11-14T12:00:00Z",
  "currentTerms": {
    "price": 47500,
    "quantity": 350,
    "validUntil": "2025-11-21T18:00:00Z"
  },
  "counterBy": "buyer"
}
```

---

### 9. Accept Offer

**POST** `/offers/{offerId}/accept`

Accept an offer (final acceptance).

**Request:**
```json
{
  "acceptedBy": 101,
  "acceptedRole": "buyer",
  "acceptedQuantity": 300,
  "notes": "Confirmed. Please proceed with contract preparation."
}
```

**Response:**
```json
{
  "offerId": 9001,
  "tradeId": 555,
  "status": "ACCEPTED",
  "contractId": 222,
  "contractStatus": "DRAFT",
  "acceptedAt": "2025-11-14T14:00:00Z"
}
```

**Error Codes:**
- `404` - Offer not found
- `409` - Offer already accepted/rejected
- `410` - Offer expired

---

### 10. Reject Offer

**POST** `/offers/{offerId}/reject`

Reject an offer.

**Request:**
```json
{
  "rejectedBy": 101,
  "rejectedRole": "buyer",
  "reason": "Price not competitive"
}
```

**Response:**
```json
{
  "offerId": 9001,
  "status": "REJECTED",
  "rejectedAt": "2025-11-14T13:00:00Z"
}
```

---

### 11. Create Tested Lot (Seller)

**POST** `/tested-lots`

Seller uploads a pre-tested lot (inventory) that can match multiple trades.

**Request:**
```json
{
  "sellerId": 21,
  "commodityId": 12,
  "stationId": 451,
  "quantity": 1000,
  "unit": "bales",
  "varietyId": 2,
  "parameters": {
    "staple_mm": 29.0,
    "mic": 4.1,
    "strength_gpt": 26.5,
    "trash_pct": 2.0,
    "moisture_pct": 7.5
  },
  "testReportUrl": "https://s3.amazonaws.com/bucket/lot_7001.pdf",
  "testReportDate": "2025-11-10",
  "testingLab": "Gujarat Cotton Testing Laboratory",
  "validUntil": "2025-12-10",
  "notes": "Premium quality lot, ready for immediate dispatch"
}
```

**Response:**
```json
{
  "lotId": 7001,
  "status": "ACTIVE",
  "matchedTrades": [555, 556, 558],
  "createdAt": "2025-11-14T09:00:00Z"
}
```

---

### 12. Get Tested Lots

**GET** `/tested-lots`

Get seller's tested lots.

**Query Params:**
- `sellerId` (required for non-sellers)
- `commodityId` (optional)
- `status` (optional): `ACTIVE`, `EXPIRED`, `DEPLETED`

**Response:**
```json
{
  "lots": [
    {
      "lotId": 7001,
      "commodity": { "id": 12, "name": "Cotton" },
      "quantity": 1000,
      "quantityAvailable": 700,
      "quantityOffered": 300,
      "parameters": {
        "staple_mm": 29.0,
        "mic": 4.1,
        "strength_gpt": 26.5
      },
      "testReportUrl": "https://s3.amazonaws.com/bucket/lot_7001.pdf",
      "status": "ACTIVE",
      "matchedTrades": 3,
      "createdAt": "2025-11-14T09:00:00Z",
      "validUntil": "2025-12-10"
    }
  ]
}
```

---

### 13. Create Contract (from Accepted Offer)

**POST** `/contracts`

Backend creates draft contract after offer acceptance.

**Request:**
```json
{
  "tradeId": 555,
  "offerId": 9001,
  "buyerId": 101,
  "sellerId": 21,
  "contractType": "TRADE_DESK",
  "draft": true
}
```

**Response:**
```json
{
  "contractId": 222,
  "contractNumber": "TD-2025-0222",
  "status": "DRAFT",
  "trade": { "tradeId": 555 },
  "offer": { "offerId": 9001 },
  "buyer": { "id": 101, "name": "ABC Mills Pvt Ltd" },
  "seller": { "id": 21, "name": "XYZ Ginners" },
  "quantity": 300,
  "price": 48000,
  "totalValue": 14400000,
  "createdAt": "2025-11-14T14:05:00Z"
}
```

---

### 14. Dashboard - Trade Summary

**GET** `/dashboard/trades-summary`

Get aggregated trade statistics for back-office dashboard.

**Query Params:**
- `orgId` (required)
- `dateFrom` (optional)
- `dateTo` (optional)
- `commodityId` (optional)

**Response:**
```json
{
  "postedCount": 12,
  "offersReceivedCount": 8,
  "negotiatingCount": 5,
  "agreedCount": 3,
  "completedCount": 45,
  "expiredCount": 2,
  "totalValue": 125000000,
  "avgMatchScore": 87.5,
  "avgResponseTime": "2.5 hours",
  "topCommodities": [
    { "commodityId": 12, "name": "Cotton", "count": 35 },
    { "commodityId": 15, "name": "Wheat", "count": 10 }
  ]
}
```

---

### 15. Dashboard - Trade List

**GET** `/dashboard/trades`

Get paginated trade list for back-office.

**Query Params:**
- `status` (optional): `POSTED`, `OFFERS_RECEIVED`, `NEGOTIATION`, `AGREED`, `COMPLETED`, `EXPIRED`
- `commodityId` (optional)
- `regionId` (optional)
- `dateFrom` (optional)
- `dateTo` (optional)
- `ownerId` (optional): Back-office user assigned
- `page` (default: 1)
- `limit` (default: 20)

**Response:**
```json
{
  "trades": [
    {
      "tradeId": 555,
      "buyer": { "id": 101, "name": "ABC Mills Pvt Ltd" },
      "commodity": { "id": 12, "name": "Cotton" },
      "quantity": 500,
      "location": { "state": "Gujarat", "region": "Saurashtra" },
      "status": "OFFERS_RECEIVED",
      "offersCount": 3,
      "bestMatchScore": 92,
      "lastActivity": "2025-11-14T11:15:00Z",
      "createdAt": "2025-11-14T10:30:00Z",
      "urgency": "normal",
      "assignedTo": { "id": 501, "name": "Sales Manager 1" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### 16. Dashboard - Force Match

**POST** `/dashboard/trade/{tradeId}/force-match`

Manually send trade to specific seller(s).

**Request:**
```json
{
  "sellerIds": [21, 34, 45],
  "message": "High priority buyer. Please submit competitive offer.",
  "urgency": "urgent"
}
```

**Response:**
```json
{
  "tradeId": 555,
  "notifiedSellers": 3,
  "notificationsSent": [
    { "sellerId": 21, "status": "sent" },
    { "sellerId": 34, "status": "sent" },
    { "sellerId": 45, "status": "sent" }
  ]
}
```

---

### 17. Dashboard - Invite Seller

**POST** `/dashboard/trade/{tradeId}/invite-seller`

Invite specific seller to submit offer.

**Request:**
```json
{
  "sellerId": 67,
  "message": "We have a requirement matching your recent lots. Please check and submit offer.",
  "bypassLocationMatch": true
}
```

**Response:**
```json
{
  "invitationId": 8001,
  "sellerId": 67,
  "tradeId": 555,
  "sentAt": "2025-11-14T15:00:00Z"
}
```

---

### 18. Dashboard - Seller Performance

**GET** `/dashboard/seller-performance`

Get seller performance metrics.

**Query Params:**
- `sellerId` (optional): Specific seller or all
- `dateFrom` (optional)
- `dateTo` (optional)

**Response:**
```json
{
  "sellers": [
    {
      "sellerId": 21,
      "sellerName": "XYZ Ginners",
      "offersSubmitted": 45,
      "offersAccepted": 32,
      "acceptanceRate": 71.1,
      "avgMatchScore": 89.5,
      "avgResponseTime": "1.5 hours",
      "totalValue": 45000000,
      "rating": 4.5,
      "reliabilityScore": 92
    }
  ]
}
```

---

### 19. Get My Trades (Buyer)

**GET** `/trades/my-trades`

Get trades created by logged-in user.

**Query Params:**
- `status` (optional)
- `page`, `limit`

**Response:** Same structure as Dashboard trade list, filtered by buyer.

---

### 20. Get My Offers (Seller)

**GET** `/offers/my-offers`

Get offers submitted by logged-in seller.

**Query Params:**
- `status` (optional)
- `tradeId` (optional)
- `page`, `limit`

**Response:**
```json
{
  "offers": [
    {
      "offerId": 9001,
      "trade": {
        "tradeId": 555,
        "buyer": { "id": 101, "name": "ABC Mills Pvt Ltd" },
        "commodity": { "id": 12, "name": "Cotton" },
        "quantity": 500
      },
      "myPrice": 48000,
      "myQuantity": 300,
      "status": "PENDING",
      "matchScore": 92,
      "validUntil": "2025-11-20T18:00:00Z",
      "createdAt": "2025-11-14T11:00:00Z",
      "lastCounterAt": null
    }
  ]
}
```

---

### 21. Get Negotiation History

**GET** `/negotiations/{offerId}/history`

Get full negotiation thread for an offer.

**Response:**
```json
{
  "offerId": 9001,
  "negotiations": [
    {
      "negotiationId": 4001,
      "version": 1,
      "sender": { "id": 21, "name": "XYZ Ginners", "role": "seller" },
      "terms": {
        "price": 48000,
        "quantity": 300
      },
      "message": "Initial offer",
      "timestamp": "2025-11-14T11:00:00Z"
    },
    {
      "negotiationId": 4002,
      "version": 2,
      "sender": { "id": 101, "name": "ABC Mills Pvt Ltd", "role": "buyer" },
      "terms": {
        "price": 47500,
        "quantity": 350
      },
      "message": "Can you reduce price to 47500? I can take 350 bales immediately.",
      "timestamp": "2025-11-14T12:00:00Z"
    }
  ]
}
```

---

## WebSocket Channels

### Connection

**URL:** `wss://api.rnrltradehub.com/ws`

**Authentication:** Send token after connection:
```json
{
  "type": "auth",
  "token": "Bearer {token}"
}
```

### Subscriptions

#### 1. User Channel (Buyer/Seller)

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "trade/{userId}"
}
```

**Events Received:**

**Trade Posted** (to matched sellers):
```json
{
  "event": "trade.posted",
  "data": {
    "tradeId": 555,
    "commodity": { "id": 12, "name": "Cotton" },
    "quantity": 500,
    "location": { "state": "Gujarat", "region": "Saurashtra" },
    "estimatedMatchScore": 88,
    "urgency": "normal",
    "postedAt": "2025-11-14T10:30:00Z"
  }
}
```

**Offer Submitted** (to buyer):
```json
{
  "event": "offer.submitted",
  "data": {
    "offerId": 9001,
    "tradeId": 555,
    "seller": { "id": 21, "name": "XYZ Ginners" },
    "price": 48000,
    "quantity": 300,
    "matchScore": 92,
    "submittedAt": "2025-11-14T11:00:00Z"
  }
}
```

**Offer Counter** (to both parties):
```json
{
  "event": "offer.counter",
  "data": {
    "negotiationId": 4002,
    "offerId": 9001,
    "version": 2,
    "counterBy": "buyer",
    "newTerms": {
      "price": 47500,
      "quantity": 350
    },
    "message": "Can you reduce price to 47500?",
    "timestamp": "2025-11-14T12:00:00Z"
  }
}
```

**Offer Accepted**:
```json
{
  "event": "offer.accepted",
  "data": {
    "offerId": 9001,
    "tradeId": 555,
    "contractId": 222,
    "acceptedAt": "2025-11-14T14:00:00Z"
  }
}
```

**Offer Rejected**:
```json
{
  "event": "offer.rejected",
  "data": {
    "offerId": 9001,
    "tradeId": 555,
    "rejectedBy": "buyer",
    "reason": "Price not competitive",
    "rejectedAt": "2025-11-14T13:00:00Z"
  }
}
```

**Tested Lot Uploaded** (to matched buyers):
```json
{
  "event": "testedlot.uploaded",
  "data": {
    "lotId": 7001,
    "seller": { "id": 21, "name": "XYZ Ginners" },
    "commodity": { "id": 12, "name": "Cotton" },
    "quantity": 1000,
    "parameters": {
      "staple_mm": 29.0,
      "mic": 4.1
    },
    "matchedTrades": [555, 556],
    "uploadedAt": "2025-11-14T09:00:00Z"
  }
}
```

**Trade Updated**:
```json
{
  "event": "trade.updated",
  "data": {
    "tradeId": 555,
    "status": "AGREED",
    "updatedAt": "2025-11-14T14:00:00Z"
  }
}
```

**Notification** (grouped digest):
```json
{
  "event": "notification",
  "data": {
    "type": "digest",
    "commodity": { "id": 12, "name": "Cotton" },
    "count": 5,
    "message": "5 new cotton trades posted in your region in the last 30 minutes",
    "tradeIds": [555, 556, 557, 558, 559],
    "timestamp": "2025-11-14T11:30:00Z"
  }
}
```

#### 2. Dashboard Channel (Back-office)

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "dashboard/{orgId}"
}
```

**Events Received:**

**Stats Update**:
```json
{
  "event": "dashboard.stats",
  "data": {
    "postedCount": 12,
    "offersReceivedCount": 8,
    "negotiatingCount": 5,
    "agreedCount": 3,
    "timestamp": "2025-11-14T12:00:00Z"
  }
}
```

**Alert**:
```json
{
  "event": "dashboard.alert",
  "data": {
    "type": "high_value",
    "tradeId": 560,
    "message": "High value trade posted: ₹50,00,000",
    "urgency": "high",
    "timestamp": "2025-11-14T12:05:00Z"
  }
}
```

---

## Data Models

### Trade
```typescript
interface Trade {
  tradeId: number;
  action: 'buy' | 'sell';
  buyerId: number;
  commodityId: number;
  quantity: number;
  unit: string;
  varietyId?: number;
  parameters: Record<string, { min: number; max: number }>;
  tradeTypeId: number;
  bargainTypeId: number;
  passingId: number;
  weightmentId: number;
  deliveryTermId: number;
  deliveryDays: number;
  paymentTermId: number;
  paymentDays: number;
  location: {
    stateId: number;
    regionId?: number;
    stationId?: number;
  };
  certificates: string[];
  targetPrice?: number;
  notes?: string;
  urgency: 'normal' | 'urgent';
  status: TradeStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  offersCount: number;
  bestMatchScore?: number;
  assignedTo?: number;
}

enum TradeStatus {
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
```

### Offer
```typescript
interface Offer {
  offerId: number;
  tradeId: number;
  sellerId: number;
  stationId: number;
  price: number;
  currency: string;
  priceUnit: string;
  quantity: number;
  unit: string;
  varietyId?: number;
  parameters: Record<string, number>;
  testReportUrl?: string;
  testReportDate?: string;
  testedLotId?: number;
  deliveryTermId: number;
  paymentTermId: number;
  validUntil: string;
  validityHours: number;
  notes?: string;
  status: OfferStatus;
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  createdAt: string;
  updatedAt: string;
  negotiationVersions: number;
}

enum OfferStatus {
  PENDING = 'PENDING',
  COUNTERED = 'COUNTERED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}
```

### TestedLot
```typescript
interface TestedLot {
  lotId: number;
  sellerId: number;
  commodityId: number;
  stationId: number;
  quantity: number;
  quantityAvailable: number;
  quantityOffered: number;
  unit: string;
  varietyId?: number;
  parameters: Record<string, number>;
  testReportUrl: string;
  testReportDate: string;
  testingLab: string;
  validUntil: string;
  notes?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
  matchedTrades: number[];
  createdAt: string;
  updatedAt: string;
}
```

### Negotiation
```typescript
interface Negotiation {
  negotiationId: number;
  offerId: number;
  version: number;
  senderId: number;
  senderRole: 'buyer' | 'seller';
  terms: {
    price?: number;
    quantity?: number;
    validUntil?: string;
  };
  message: string;
  timestamp: string;
}
```

### MatchBreakdown
```typescript
interface MatchBreakdown {
  parameterScore: number;  // 0-100
  priceScore: number;      // 0-100
  locationScore: number;   // 0-100
  paymentScore: number;    // 0-100
}
```

### AuditLog
```typescript
interface AuditLog {
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
```

---

## Matching Algorithm

### Inputs
- **Buyer ranges**: `{ parameter: { min, max } }` for each quality parameter
- **Seller values**: `{ parameter: value }` actual test results
- **Parameter weights**: Configured per commodity (default 1.0)
- **Price**: Buyer target (optional) vs seller offer
- **Location**: State/Region/Station hierarchy
- **Terms**: Payment & Delivery compatibility

### Algorithm Steps

#### 1. Parameter Score (per parameter)
```python
for each parameter p:
  if seller.value is null:
    param_score_p = 0  # Heavy penalty for unknown
  else:
    if buyer.min <= seller.value <= buyer.max:
      param_score_p = 100  # Perfect match
    else:
      # Distance penalty (linear decay)
      dist = min(abs(seller.value - buyer.min), abs(seller.value - buyer.max))
      tolerance = max(buyer.max - buyer.min, 1)  # Avoid division by zero
      # Score decreases linearly outside range up to 3*tolerance
      param_score_p = max(0, 100 - (dist / (3 * tolerance) * 100))

# Aggregate parameter score (weighted average)
parameter_score = sum(param_score_p * weight_p) / sum(weight_p)
```

**Example:**
- Buyer: staple 28-30 mm, mic 3.8-4.2
- Seller: staple 29.0, mic 4.1
- Both within range → param_score = 100 for each → **parameter_score = 100**

#### 2. Location Score
```python
if station_exact_match:
  location_score = 100
elif region_match:
  location_score = 85
elif state_match:
  location_score = 70
elif trader_role (anywhere):
  location_score = 60
else:
  location_score = 0
```

#### 3. Payment & Delivery Score
```python
if seller_supports_buyer_term:
  payment_score = 100
else:
  payment_score = 0  # Or configurable penalty
```

#### 4. Price Score
```python
if buyer.targetPrice exists:
  # Deviation from target
  deviation = abs(seller.price - buyer.targetPrice) / buyer.targetPrice
  price_score = max(0, 100 - (deviation * 100))
else:
  # Relative ranking (best price gets 100)
  best_price = min(all_seller_prices)
  price_score = (best_price / seller.price) * 100
```

#### 5. Final Composite Score
```python
# Default weights (configurable per commodity)
W_PARAM = 0.45
W_PRICE = 0.35
W_LOCATION = 0.10
W_PAYMENT = 0.10

final_score = (
  parameter_score * W_PARAM +
  price_score * W_PRICE +
  location_score * W_LOCATION +
  payment_score * W_PAYMENT
)

# Round to integer 0-100
match_score = round(final_score)
```

### Match Score Labels
- **90-100**: Best Match (green badge)
- **75-89**: Good Match (blue badge)
- **60-74**: Average Match (yellow badge)
- **<60**: Poor Match (red badge, may hide)

---

## State Machine

### Trade States
```
DRAFT → POSTED → OFFERS_RECEIVED → NEGOTIATION → AGREED → CONTRACT_CREATED → COMPLETED
                     ↓                   ↓            ↓
                  EXPIRED          CANCELLED     CANCELLED
```

**Transitions:**
- `DRAFT → POSTED`: Buyer confirms trade creation
- `POSTED → OFFERS_RECEIVED`: First offer submitted
- `OFFERS_RECEIVED → NEGOTIATION`: Counter-offer initiated
- `NEGOTIATION → AGREED`: Offer accepted
- `AGREED → CONTRACT_CREATED`: Backend generates contract
- `CONTRACT_CREATED → COMPLETED`: Contract executed
- `Any → CANCELLED`: Manual cancellation
- `POSTED/OFFERS_RECEIVED → EXPIRED`: Auto-expiry (7 days default)

### Offer States
```
PENDING → COUNTERED → ACCEPTED
    ↓         ↓          ↓
REJECTED  EXPIRED   COMPLETED
```

**Transitions:**
- `PENDING → COUNTERED`: Buyer/seller submits counter
- `PENDING → ACCEPTED`: Direct acceptance
- `PENDING → REJECTED`: Rejection
- `PENDING → EXPIRED`: Validity period elapsed
- `COUNTERED → ACCEPTED`: Counter accepted
- `COUNTERED → REJECTED`: Counter rejected
- `COUNTERED → EXPIRED`: Counter validity elapsed

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `400` | Bad Request | Fix request payload |
| `401` | Unauthorized | Provide valid token |
| `403` | Forbidden | Check role permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate offer, already accepted |
| `410` | Gone | Trade/offer expired or closed |
| `422` | Validation Failed | Fix parameter values, missing fields |
| `429` | Rate Limit | Reduce request frequency |
| `500` | Server Error | Retry or contact support |
| `503` | Service Unavailable | Retry after delay |

### Custom Error Codes (in response body)
```json
{
  "error": {
    "code": "TRADE_EXPIRED",
    "message": "This trade has expired and no longer accepts offers",
    "details": {
      "tradeId": 555,
      "expiredAt": "2025-11-21T10:30:00Z"
    }
  }
}
```

**Common Custom Codes:**
- `TRADE_EXPIRED`
- `OFFER_EXPIRED`
- `PARAMETERS_OUT_OF_RANGE`
- `DUPLICATE_OFFER`
- `INSUFFICIENT_QUANTITY`
- `LOCATION_MISMATCH`
- `CERTIFICATE_MISMATCH`
- `NLP_PARSE_FAILED`

---

## Example Flows

### Flow 1: Buyer Creates Trade via Chat

1. **Buyer types**: "Need 500 bales organic cotton with staple 28-30"
2. **Frontend → POST /nlp/parse**:
   ```json
   { "text": "Need 500 bales organic cotton with staple 28-30" }
   ```
3. **Backend responds**:
   ```json
   {
     "commodity_hint": "cotton",
     "commodityId": 12,
     "quantity": 500,
     "certificates": ["Organic"],
     "parameterHints": { "staple_mm": { "min": 28, "max": 30 } }
   }
   ```
4. **Frontend → GET /commodity/12/parameters** (load template)
5. **Frontend shows wizard**: Missing fields (Trade Type, Bargain, Location, Payment, Delivery)
6. **Buyer selects**: All mandatory fields
7. **Frontend → POST /trades** (create trade)
8. **Backend responds**:
   ```json
   { "tradeId": 555, "status": "POSTED", "estimatedMatches": 6 }
   ```
9. **Backend → WebSocket** to matched sellers:
   ```json
   { "event": "trade.posted", "data": { "tradeId": 555, ... } }
   ```

### Flow 2: Seller Submits Offer

1. **Seller receives WebSocket notification**: New trade posted
2. **Seller opens trade**: Frontend → GET /trades/555
3. **Seller fills offer form**: Price, quantity, parameters, test report
4. **Frontend → POST /offers** (submit offer)
5. **Backend calculates match score**: 92%
6. **Backend responds**:
   ```json
   { "offerId": 9001, "matchScore": 92, ... }
   ```
7. **Backend → WebSocket** to buyer:
   ```json
   { "event": "offer.submitted", "data": { "offerId": 9001, ... } }
   ```

### Flow 3: Negotiation & Acceptance

1. **Buyer views offers**: Frontend → GET /trades/555/offers
2. **Buyer counters**: Frontend → POST /offers/9001/counter
   ```json
   { "newPrice": 47500, "message": "Can you reduce?" }
   ```
3. **Backend → WebSocket** to seller:
   ```json
   { "event": "offer.counter", "data": { "version": 2, ... } }
   ```
4. **Seller accepts counter**: Frontend → POST /offers/9001/accept
5. **Backend creates contract**: POST /contracts (internal)
6. **Backend → WebSocket** to both:
   ```json
   { "event": "offer.accepted", "data": { "contractId": 222 } }
   ```

### Flow 4: Back-Office Intervention

1. **Back-office views dashboard**: GET /dashboard/trades-summary
2. **Sees low-response trade**: tradeId 560
3. **Manually invites sellers**: POST /dashboard/trade/560/invite-seller
   ```json
   { "sellerId": 67, "message": "High priority buyer..." }
   ```
4. **Backend sends notification** to seller 67
5. **Dashboard updates via WebSocket**: Real-time stats change

---

## Notes for Backend Implementation

### Priority 1 (MVP)
- [ ] NLP parsing endpoint (Gemini/GPT integration)
- [ ] Trade CRUD + matching logic
- [ ] Offer submission + match score calculation
- [ ] WebSocket server (user channels)
- [ ] Basic negotiation (counter-offer)
- [ ] Offer acceptance → contract creation

### Priority 2 (Post-MVP)
- [ ] Tested lot management
- [ ] Dashboard endpoints + WebSocket
- [ ] Notification throttling/digest
- [ ] Advanced filters & search
- [ ] Seller performance metrics
- [ ] Audit log storage

### Priority 3 (Future)
- [ ] AI test report parsing (OCR)
- [ ] Multi-currency support
- [ ] ML-based fraud detection
- [ ] Advanced analytics
- [ ] Mobile push notifications

### Performance Considerations
- **Match score calculation**: Cache scores, recompute only on parameter changes
- **WebSocket scaling**: Use Redis pub/sub for multi-server deployment
- **Database indexes**: tradeId, sellerId, status, createdAt, location fields
- **Rate limiting**: 100 requests/min per user, 1000/min per org

### Security Requirements
- **Input validation**: All parameters within commodity min/max
- **Role-based access**: Enforce RBAC at API level
- **WebSocket auth**: Validate token on every subscription
- **Audit logging**: Log all critical actions (create, accept, reject)
- **Rate limiting**: Prevent spam offers/counters

---

**End of API Contract**

**Version History:**
- v1.0 (2025-11-14): Initial specification based on approved requirements
