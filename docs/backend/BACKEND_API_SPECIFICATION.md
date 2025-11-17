# Backend API Specification for Commodity Master Module

## 🎯 Overview
This document provides complete API specifications for the Commodity Master module. The frontend is **100% ready** and only requires backend API implementation.

---

## 📡 Base URL
```
Production: https://api.rnrltradehub.com/v1
Development: http://localhost:8000/api/v1
```

---

## 🔐 Authentication
All endpoints require Bearer token authentication:
```http
Authorization: Bearer <jwt_token>
```

---

## 📦 Data Models

### Commodity
```typescript
{
  id: number;                    // Auto-generated, unique
  name: string;                  // Unique, max 100 chars
  symbol: string;                // Unique, 2-10 uppercase alphanumeric
  unit: 'Kgs' | 'Qty' | 'Candy' | 'Bales' | 'Quintal' | 'Tonnes';
  
  // GST - Auto-determined by backend based on commodity name
  hsnCode: string;               // 4, 6, or 8 digits
  gstRate: number;               // 0-100%
  gstExemptionAvailable: boolean;
  gstCategory: 'Agricultural' | 'Processed' | 'Industrial' | 'Service';
  isProcessed: boolean;
  
  isActive: boolean;
  
  // Trading Parameters (inline, not references)
  tradeTypes: MasterDataItem[];
  bargainTypes: MasterDataItem[];
  varieties: MasterDataItem[];
  weightmentTerms: MasterDataItem[];
  passingTerms: MasterDataItem[];
  deliveryTerms: StructuredTerm[];
  paymentTerms: StructuredTerm[];
  commissions: CommissionStructure[];
  
  supportsCciTerms: boolean;     // true for cotton
  description?: string;          // max 500 chars
  
  // Audit fields (auto-managed)
  createdBy: string;
  createdAt: datetime;
  updatedBy: string;
  updatedAt: datetime;
}
```

### MasterDataItem
```typescript
{
  id: number;
  name: string;
}
```

### StructuredTerm
```typescript
{
  id: number;
  name: string;
  days: number;  // >= 0
}
```

### CommissionStructure
```typescript
{
  id: number;
  name: string;
  type: 'PERCENTAGE' | 'PER_BALE';
  value: number; // >= 0
  
  // GST on Commission (SAC 9983 - Brokerage & Commission Services)
  gstApplicable: boolean;  // true if value > 0
  gstRate: number;         // 18% as per GST Act
  sacCode: string;         // '9983' for brokerage/commission
}
```

---

## 🔄 API Endpoints

### 1. Get All Commodities
```http
GET /commodities
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `active` (optional): Filter by active status (true/false)
- `search` (optional): Search by name or symbol

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Cotton",
      "symbol": "CTN",
      "unit": "Bales",
      "hsnCode": "5201",
      "gstRate": 5,
      "gstExemptionAvailable": false,
      "gstCategory": "Agricultural",
      "isProcessed": false,
      "isActive": true,
      "tradeTypes": [
        { "id": 1, "name": "Normal Trade" },
        { "id": 2, "name": "CCI Trade" }
      ],
      "bargainTypes": [
        { "id": 1, "name": "Pucca Sauda" },
        { "id": 2, "name": "Subject to Approval" }
      ],
      "varieties": [
        { "id": 1, "name": "MCU-5" },
        { "id": 2, "name": "DCH-32" }
      ],
      "weightmentTerms": [
        { "id": 1, "name": "At Seller's Gin" }
      ],
      "passingTerms": [
        { "id": 1, "name": "Lab Report" }
      ],
      "deliveryTerms": [
        { "id": 1, "name": "Ex-Gin", "days": 0 },
        { "id": 2, "name": "FOR", "days": 5 }
      ],
      "paymentTerms": [
        { "id": 1, "name": "Advance", "days": 0 },
        { "id": 2, "name": "30 Days Credit", "days": 30 }
      ],
      "commissions": [
        { 
          "id": 1, 
          "name": "Standard Brokerage", 
          "type": "PERCENTAGE", 
          "value": 1.0,
          "gstApplicable": true,
          "gstRate": 18,
          "sacCode": "9983"
        }
      ],
      "supportsCciTerms": true,
      "description": "Raw cotton and cotton products",
      "createdBy": "admin@rnrl.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedBy": "admin@rnrl.com",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

### 2. Get Single Commodity
```http
GET /commodities/:id
```

**Path Parameters:**
- `id`: Commodity ID

**Response:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "name": "Cotton",
    ...
  }
}
```

**Errors:**
- `404 Not Found`: Commodity not found

---

### 3. Create Commodity
```http
POST /commodities
```

**Request Body:**
```json
{
  "name": "Cotton",
  "symbol": "CTN",
  "unit": "Bales",
  "isProcessed": false,
  "isActive": true,
  "tradeTypes": [
    { "name": "Normal Trade" },
    { "name": "CCI Trade" }
  ],
  "bargainTypes": [
    { "name": "Pucca Sauda" }
  ],
  "varieties": [
    { "name": "MCU-5" }
  ],
  "weightmentTerms": [
    { "name": "At Seller's Gin" }
  ],
  "passingTerms": [
    { "name": "Lab Report" }
  ],
  "deliveryTerms": [
    { "name": "Ex-Gin", "days": 0 }
  ],
  "paymentTerms": [
    { "name": "Advance", "days": 0 }
  ],
  "commissions": [
    { 
      "name": "Standard Brokerage", 
      "type": "PERCENTAGE", 
      "value": 1.0 
    }
  ],
  "description": "Raw cotton"
}
```

**Backend Processing:**
1. Validate uniqueness (name, symbol)
2. Auto-determine HSN code based on commodity name
3. Auto-determine GST rate based on HSN code
4. Auto-set `supportsCciTerms` for cotton
5. Generate unique IDs for all nested items
6. Auto-set commission GST:
   - If commission value > 0: `gstApplicable = true`, `gstRate = 18`, `sacCode = '9983'`
   - If commission value = 0: `gstApplicable = false`, `gstRate = 0`
7. Set audit fields (createdBy, createdAt)

**Response:** `201 Created`
```json
{
  "data": {
    "id": 1,
    "name": "Cotton",
    "hsnCode": "5201",
    "gstRate": 5,
    ...
  },
  "message": "Commodity created successfully"
}
```

**Errors:**
- `400 Bad Request`: Validation failed
- `409 Conflict`: Duplicate name or symbol

---

### 4. Update Commodity
```http
PUT /commodities/:id
```

**Request Body:** Same as Create

**Backend Processing:**
1. Check if commodity is used in active contracts
2. If active contracts exist:
   - Lock critical fields: `symbol`, `unit`, `hsnCode`, `supportsCciTerms`
   - Return error if trying to modify locked fields
3. For non-locked fields, allow updates
4. Preserve commodity ID
5. Update audit fields (updatedBy, updatedAt)

**Response:** `200 OK`
```json
{
  "data": {
    "id": 1,
    ...
  },
  "message": "Commodity updated successfully"
}
```

**Errors:**
- `400 Bad Request`: Validation failed or locked field modified
- `404 Not Found`: Commodity not found
- `409 Conflict`: Duplicate name or symbol

---

### 5. Delete Commodity
```http
DELETE /commodities/:id
```

**Backend Validation (CRITICAL):**
1. Check if it's the last active commodity → BLOCK
2. Check for active sales contracts → BLOCK
3. Check for historical sales contracts → BLOCK (preserve audit trail)
4. If all checks pass → Allow deletion

**Response:** `200 OK`
```json
{
  "message": "Commodity deleted successfully"
}
```

**Errors:**
- `400 Bad Request`: Cannot delete (last active, has contracts, etc.)
- `404 Not Found`: Commodity not found

---

### 6. Deactivate Commodity
```http
PATCH /commodities/:id/deactivate
```

**Backend Validation:**
1. Check if it's the last active commodity → BLOCK
2. Check for active sales contracts → BLOCK
3. If checks pass → Set `isActive = false`

**Response:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "isActive": false,
    ...
  },
  "message": "Commodity deactivated successfully"
}
```

---

### 7. Auto-Determine GST
```http
POST /commodities/auto-gst
```

**Request Body:**
```json
{
  "commodityName": "Cotton",
  "isProcessed": false
}
```

**Backend Processing:**
1. Use GST Determination Engine
2. Match commodity name to HSN database
3. Determine GST rate based on HSN and processing status
4. Return HSN, GST rate, exemption status

**Response:** `200 OK`
```json
{
  "data": {
    "hsnCode": "5201",
    "gstRate": 5,
    "gstExemptionAvailable": false,
    "gstCategory": "Agricultural",
    "confidence": "high",
    "description": "Cotton, not carded or combed"
  }
}
```

---

## 🔒 Business Rules (Backend Validation)

### 1. Uniqueness Rules
- ✅ Commodity name must be unique (case-insensitive)
- ✅ Commodity symbol must be unique (case-insensitive)

### 2. GST Rules
- ✅ HSN code must be valid (4, 6, or 8 digits)
- ✅ GST rate must be 0-100%
- ✅ Auto-determine HSN and GST based on commodity name
- ✅ **Commission GST: Always 18% (SAC 9983) when commission > 0**

### 3. Cotton-Specific Rules
- ✅ If commodity name contains "cotton" → `supportsCciTerms = true`
- ✅ Cotton should use "Bales" as unit (warning, not error)

### 4. Deletion Rules
- ✅ Cannot delete if last active commodity
- ✅ Cannot delete if active contracts exist
- ✅ Cannot delete if historical contracts exist (preserve audit trail)

### 5. Edit Rules
- ✅ Lock `symbol`, `unit`, `hsnCode`, `supportsCciTerms` if active contracts exist
- ✅ Allow other fields to be edited

### 6. Trading Parameters
- ✅ At least one trade type required
- ✅ At least one bargain type required
- ✅ At least one weightment term required
- ✅ At least one passing term required
- ✅ At least one delivery term required
- ✅ At least one payment term required
- ✅ At least one commission required

---

## 📊 GST Determination Logic

### Backend GST Engine Requirements:

```javascript
function determineGST(commodityName, isProcessed) {
  // 1. Normalize commodity name
  const normalized = commodityName.toLowerCase().trim();
  
  // 2. Match to HSN database
  const hsnMapping = {
    'cotton': { hsn: '5201', rate: 5, category: 'Agricultural' },
    'wheat': { hsn: '1001', rate: 0, category: 'Agricultural' },
    'rice': { hsn: '1006', rate: 0, category: 'Agricultural' },
    // ... complete HSN database
  };
  
  // 3. Determine based on processing
  if (isProcessed) {
    // Apply processed rates
  }
  
  // 4. Return determination
  return {
    hsnCode: '5201',
    gstRate: 5,
    gstExemptionAvailable: false,
    gstCategory: 'Agricultural',
    confidence: 'high'
  };
}
```

### Commission GST Logic:
```javascript
function applyCommissionGST(commission) {
  if (commission.value > 0) {
    return {
      ...commission,
      gstApplicable: true,
      gstRate: 18,  // As per GST Act SAC 9983
      sacCode: '9983'
    };
  } else {
    return {
      ...commission,
      gstApplicable: false,
      gstRate: 0,
      sacCode: '9983'
    };
  }
}
```

---

## 🔄 Integration with Sales Contract

### When Creating Sales Contract:
```http
POST /sales-contracts
```

**Request includes:**
```json
{
  "commodityId": 1,  // Link to commodity
  ...
}
```

**Backend Processing:**
1. Validate `commodityId` exists and is active
2. Cache commodity details:
   ```json
   {
     "commodityId": 1,
     "commodityName": "Cotton",
     "commoditySymbol": "CTN"
   }
   ```
3. Load available varieties, trade types, etc. from commodity
4. Validate selections against commodity's available options

---

## 📝 Audit Trail Requirements

### Every Operation Must Log:
```json
{
  "entityType": "commodity",
  "entityId": 1,
  "operation": "create" | "update" | "delete" | "deactivate" | "reactivate",
  "performedBy": "user@example.com",
  "performedAt": "2024-01-15T10:30:00Z",
  "changes": {
    "before": {...},
    "after": {...}
  },
  "reason": "User provided reason",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 🚨 Error Responses

### Standard Error Format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Commodity name already exists"
      }
    ]
  }
}
```

### Error Codes:
- `VALIDATION_ERROR`: Input validation failed
- `DUPLICATE_ERROR`: Duplicate name/symbol
- `NOT_FOUND`: Resource not found
- `CANNOT_DELETE`: Deletion blocked by business rules
- `LOCKED_FIELD`: Trying to modify locked field
- `UNAUTHORIZED`: Authentication failed
- `FORBIDDEN`: Permission denied

---

## ✅ Frontend Ready Checklist

- ✅ All UI components built
- ✅ Form validation implemented
- ✅ Mock data configured
- ✅ Security checks (XSS, SQL injection)
- ✅ Audit logging hooks in place
- ✅ Business rule validation
- ✅ Commission GST handling
- ✅ Ready to switch from mock to real API

## 🔄 Switching to Real API

In `src/api/settingsApi.ts`, change:
```typescript
const USE_MOCK_DATA = false; // Set to false for production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
```

---

## 📞 Support

For questions or clarifications:
- Frontend Lead: [Contact Info]
- Backend Lead: [Contact Info]
- Product Owner: [Contact Info]
