# Backend API Endpoints Documentation
## Complete API Reference for Backend Implementation

**Version:** 1.0  
**Date:** 2025-11-13  
**Status:** Ready for Backend Development

---

## Table of Contents
1. [Commodities API](#commodities-api)
2. [Organizations API](#organizations-api)
3. [Locations API](#locations-api)
4. [CCI Terms API](#cci-terms-api)
5. [Data Models](#data-models)

---

## Commodities API

### Base Path: `/commodities`

All commodity-related endpoints for creating, reading, updating, and deleting commodities with inline trading parameters.

#### 1. Get All Commodities
```
GET /commodities
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Cotton",
      "symbol": "CTN",
      "unit": "Bales",
      "rateUnit": "Candy",
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
        { "id": 1, "name": "At Seller's Gin" },
        { "id": 2, "name": "At Buyer's Mill" }
      ],
      "passingTerms": [
        { "id": 1, "name": "Lab Report" },
        { "id": 2, "name": "Visual Inspection" }
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
      "description": "Raw cotton and cotton products"
    }
  ],
  "success": true
}
```

#### 2. Get Commodity by ID
```
GET /commodities/:id
```

**Response:** Same as individual commodity object above

#### 3. Create Commodity
```
POST /commodities
```

**Request Body:**
```json
{
  "name": "Cotton",
  "symbol": "CTN",
  "unit": "Bales",
  "rateUnit": "Candy",
  "hsnCode": "5201",
  "gstRate": 5,
  "gstExemptionAvailable": false,
  "gstCategory": "Agricultural",
  "isProcessed": false,
  "isActive": true,
  "tradeTypes": [
    { "name": "Normal Trade" },
    { "name": "CCI Trade" }
  ],
  "bargainTypes": [
    { "name": "Pucca Sauda" },
    { "name": "Subject to Approval" }
  ],
  "varieties": [
    { "name": "MCU-5" },
    { "name": "DCH-32" }
  ],
  "weightmentTerms": [
    { "name": "At Seller's Gin" },
    { "name": "At Buyer's Mill" }
  ],
  "passingTerms": [
    { "name": "Lab Report" },
    { "name": "Visual Inspection" }
  ],
  "deliveryTerms": [
    { "name": "Ex-Gin", "days": 0 },
    { "name": "FOR", "days": 5 }
  ],
  "paymentTerms": [
    { "name": "Advance", "days": 0 },
    { "name": "30 Days Credit", "days": 30 }
  ],
  "commissions": [
    {
      "name": "Standard Brokerage",
      "type": "PERCENTAGE",
      "value": 1.0,
      "gstApplicable": true,
      "gstRate": 18,
      "sacCode": "9983"
    }
  ],
  "supportsCciTerms": true,
  "description": "Raw cotton and cotton products"
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters, unique
- `symbol`: Required, 2-10 characters, uppercase letters and numbers only, unique
- `unit`: Required, must be one of: Kgs, Qty, Candy, Bales, Quintal, Tonnes
- `rateUnit`: Required, must be one of: Kgs, Qty, Candy, Bales, Quintal, Tonnes
- `hsnCode`: Required, 4-8 digits
- `gstRate`: Required, 0-100
- `description`: Required, max 500 characters
- `tradeTypes`: Required, minimum 1 item
- `bargainTypes`: Required, minimum 1 item
- `varieties`: Required, minimum 1 item
- `weightmentTerms`: Required, minimum 1 item
- `passingTerms`: Required, minimum 1 item
- `deliveryTerms`: Required, minimum 1 item
- `paymentTerms`: Required, minimum 1 item
- `commissions`: Required, minimum 1 item

**Response:**
```json
{
  "data": { /* created commodity with id */ },
  "success": true,
  "message": "Commodity created successfully"
}
```

#### 4. Update Commodity
```
PUT /commodities/:id
```

**Request Body:** Same as create, all fields optional

**Response:**
```json
{
  "data": { /* updated commodity */ },
  "success": true,
  "message": "Commodity updated successfully"
}
```

#### 5. Delete Commodity
```
DELETE /commodities/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Commodity deleted successfully"
}
```

**Business Rules:**
- Cannot delete commodity if active contracts exist
- All associated trading parameters are deleted

#### 6. Deactivate Commodity
```
PATCH /commodities/:id/deactivate
```

**Response:**
```json
{
  "data": { /* deactivated commodity */ },
  "success": true,
  "message": "Commodity deactivated successfully"
}
```

#### 7. Auto-Determine GST (Optional - AI Feature)
```
POST /commodities/auto-gst
```

**Request Body:**
```json
{
  "commodityName": "Cotton",
  "isProcessed": false
}
```

**Response:**
```json
{
  "data": {
    "hsnCode": "5201",
    "gstRate": 5,
    "gstExemptionAvailable": false,
    "gstCategory": "Agricultural",
    "confidence": "high",
    "description": "Auto-determined based on commodity name"
  },
  "success": true
}
```

---

## Organizations API

### Base Path: `/settings/organizations`

#### 1. Get All Organizations
```
GET /settings/organizations
```

#### 2. Get Organization by ID
```
GET /settings/organizations/:id
```

#### 3. Create Organization
```
POST /settings/organizations
```

**Request Body:**
```json
{
  "name": "RNRL Trade Hub Pvt. Ltd.",
  "code": "RNRL-HO",
  "gstin": "27AABCU9603R1ZM",
  "pan": "AABCU9603R",
  "address": "123 Trade Center",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "phone": "9876543210",
  "email": "info@rnrlhub.com",
  "website": "https://rnrlhub.com",
  "bankName": "HDFC Bank",
  "accountNumber": "12345678901234",
  "ifscCode": "HDFC0001234",
  "branch": "Mumbai Main",
  "isActive": true
}
```

#### 4. Update Organization
```
PUT /settings/organizations/:id
```

#### 5. Delete Organization
```
DELETE /settings/organizations/:id
```

---

## Locations API

### Base Path: `/settings/locations`

#### 1. Get All Locations
```
GET /settings/locations
```

#### 2. Create Location
```
POST /settings/locations
```

**Request Body:**
```json
{
  "country": "India",
  "state": "Maharashtra",
  "city": "Mumbai"
}
```

#### 3. Bulk Create Locations
```
POST /settings/locations/bulk
```

**Request Body:**
```json
{
  "locations": [
    { "country": "India", "state": "Maharashtra", "city": "Mumbai" },
    { "country": "India", "state": "Gujarat", "city": "Ahmedabad" }
  ]
}
```

#### 4. Delete Location
```
DELETE /settings/locations/:id
```

---

## CCI Terms API

### Base Path: `/settings/cci-terms`

Cotton Corporation of India specific terms for cotton trading.

#### 1. Get All CCI Terms
```
GET /settings/cci-terms
```

#### 2. Get CCI Term by ID
```
GET /settings/cci-terms/:id
```

#### 3. Create CCI Term
```
POST /settings/cci-terms
```

**Request Body:** Complex structure with EMD, carrying charges, lifting terms, etc.
See CciTerm interface in types for complete structure.

#### 4. Update CCI Term
```
PUT /settings/cci-terms/:id
```

#### 5. Delete CCI Term
```
DELETE /settings/cci-terms/:id
```

---

## Data Models

### Commodity Type
```typescript
interface Commodity {
  id: number;
  name: string; // Unique
  symbol: string; // Unique, uppercase
  unit: CommodityUnit; // Primary trading unit
  rateUnit: CommodityUnit; // Rate basis unit
  hsnCode: string; // 4-8 digits
  gstRate: number; // 0-100
  gstExemptionAvailable: boolean;
  gstCategory: 'Agricultural' | 'Processed' | 'Industrial' | 'Service';
  isProcessed: boolean; // Affects GST
  isActive: boolean; // Controls availability
  tradeTypes: MasterDataItem[]; // Min 1
  bargainTypes: MasterDataItem[]; // Min 1
  varieties: MasterDataItem[]; // Min 1
  weightmentTerms: MasterDataItem[]; // Min 1
  passingTerms: MasterDataItem[]; // Min 1
  deliveryTerms: StructuredTerm[]; // Min 1
  paymentTerms: StructuredTerm[]; // Min 1
  commissions: CommissionStructure[]; // Min 1
  supportsCciTerms: boolean; // Cotton only
  description: string; // Required, max 500
}

type CommodityUnit = 'Kgs' | 'Qty' | 'Candy' | 'Bales' | 'Quintal' | 'Tonnes';

interface MasterDataItem {
  id: number;
  name: string;
}

interface StructuredTerm {
  id: number;
  name: string;
  days: number; // >= 0
}

interface CommissionStructure {
  id: number;
  name: string;
  type: 'PERCENTAGE' | 'PER_BALE';
  value: number;
  gstApplicable: boolean; // Always true for commissions
  gstRate: number; // 18% for SAC 9983
  sacCode: string; // '9983' for brokerage/commission
}
```

### Organization Type
```typescript
interface Organization {
  id: number;
  name: string;
  code: string; // Unique, uppercase
  gstin: string; // GSTIN format
  pan: string; // PAN format
  address: string;
  city: string;
  state: string;
  pincode: string; // 6 digits
  phone: string; // 10 digits
  email: string;
  website?: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string; // IFSC format
  branch: string;
  isActive: boolean;
}
```

### Location Type
```typescript
interface Location {
  id: number;
  country: string;
  state: string;
  city: string;
}
```

---

## Important Notes for Backend

### 1. Duplicate Prevention
- Commodity `name` must be unique (case-insensitive)
- Commodity `symbol` must be unique (case-insensitive)
- Organization `code` must be unique
- Organization `gstin` must be unique

### 2. Deletion Safety
- Check for active contracts before deleting commodities
- Cascade delete all trading parameters when commodity is deleted
- Soft delete recommended for audit trail

### 3. GST Validation
- HSN codes must be valid 4-8 digit numbers
- GST rates must be 0-100
- Commission GST is always 18% (SAC 9983)

### 4. Field Requirements
- **ALL fields in Commodity are mandatory** except optional ones explicitly marked
- Trading parameter arrays must have at least 1 item each
- Description is required (max 500 chars)
- Rate unit is required and separate from primary unit

### 5. Business Logic
- `isActive = false` hides commodity from new contract creation
- `supportsCciTerms` should only be true for cotton commodities
- `isProcessed` affects GST determination
- Commission type 'PER_BALE' actually means per primary unit

### 6. Response Format
All endpoints should return:
```typescript
{
  data: T | T[] | void;
  success: boolean;
  message?: string;
  error?: string;
}
```

### 7. Error Codes
- 400: Validation error
- 404: Resource not found
- 409: Duplicate entry (name/symbol/code)
- 422: Business rule violation
- 500: Server error

---

## Testing Checklist

- [ ] Create commodity with all required fields
- [ ] Attempt to create duplicate commodity (should fail)
- [ ] Update commodity
- [ ] Deactivate commodity
- [ ] Delete commodity (check cascade)
- [ ] Attempt to delete commodity with active contracts (should fail)
- [ ] Validate all field constraints
- [ ] Test GST auto-determination (if implemented)
- [ ] Bulk operations for locations
- [ ] Test all enum values

---

**END OF DOCUMENTATION**
