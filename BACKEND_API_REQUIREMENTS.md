# Backend API Requirements for Settings Module

## Overview

This document specifies the complete backend API requirements to support the Settings module frontend implementation.

## 🎯 Quick Start

**What you need to build:**
A REST API with 7 resource groups, each supporting CRUD operations, with JWT authentication and Admin role authorization.

## 📡 API Endpoints Summary

| Resource | GET (List) | POST (Create) | PUT (Update) | DELETE |
|----------|------------|---------------|--------------|--------|
| Organizations | ✅ | ✅ | ✅ | ✅ |
| Master Data (7 types) | ✅ | ✅ | ✅ | ✅ |
| GST Rates | ✅ | ✅ | ✅ | ✅ |
| Locations | ✅ | ✅ | ❌ | ✅ |
| Commissions | ✅ | ✅ | ✅ | ✅ |
| CCI Terms | ✅ | ✅ | ✅ | ✅ |
| Delivery Terms | ✅ | ✅ | ✅ | ✅ |
| Payment Terms | ✅ | ✅ | ✅ | ✅ |

**Total Endpoints:** ~32 endpoints

## 🔐 Authentication & Authorization

### Requirements

1. **Authentication:** All requests must include JWT token in Authorization header
2. **Authorization:** All endpoints require Admin role
3. **Token Format:** `Bearer <jwt_token>`

### Expected Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### JWT Payload (minimum)

```json
{
  "userId": 1,
  "email": "admin@example.com",
  "role": "Admin",
  "name": "Admin User",
  "iat": 1699632000,
  "exp": 1699718400
}
```

### Response Codes for Auth

- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Valid token but insufficient permissions (not Admin)

## 📋 API Specification

### Standard Response Format

All responses should follow this format:

```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Standard Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry |
| 500 | Internal Server Error | Server error |

## 📍 Endpoint Details

### 1. Organizations

#### GET /api/settings/organizations

List all organizations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "RNRL Mumbai Office",
      "code": "RNRL-MUM",
      "gstin": "27AABCU9603R1ZM",
      "pan": "AABCU9603R",
      "address": "123 Business Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "phone": "9876543210",
      "email": "mumbai@rnrl.com",
      "website": "https://rnrl.com",
      "bankName": "State Bank of India",
      "accountNumber": "1234567890",
      "ifscCode": "SBIN0001234",
      "branch": "Mumbai Main Branch",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/settings/organizations

Create a new organization.

**Request Body:**
```json
{
  "name": "RNRL Delhi Office",
  "code": "RNRL-DEL",
  "gstin": "07AABCU9603R1ZM",
  "pan": "AABCU9603R",
  "address": "456 Corporate Avenue",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001",
  "phone": "9876543211",
  "email": "delhi@rnrl.com",
  "website": "https://rnrl.com",
  "bankName": "HDFC Bank",
  "accountNumber": "0987654321",
  "ifscCode": "HDFC0001234",
  "branch": "Delhi Main Branch",
  "isActive": true
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `code`: Required, unique, 1-20 characters, uppercase + numbers + hyphens
- `gstin`: Required, unique, must match pattern `[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}`
- `pan`: Required, must match pattern `[A-Z]{5}[0-9]{4}[A-Z]{1}`
- `address`: Required, 1-200 characters
- `city`: Required, 1-50 characters
- `state`: Required, 1-50 characters
- `pincode`: Required, 6 digits
- `phone`: Required, 10 digits starting with 6-9
- `email`: Required, valid email format
- `website`: Optional, valid URL
- `bankName`: Required, 1-100 characters
- `accountNumber`: Required, 8-20 characters
- `ifscCode`: Required, must match pattern `[A-Z]{4}0[A-Z0-9]{6}`
- `branch`: Required, 1-100 characters
- `isActive`: Required, boolean

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "RNRL Delhi Office",
    // ... all fields
  },
  "message": "Organization created successfully"
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Organization with this code or GSTIN already exists"
}
```

#### PUT /api/settings/organizations/:id

Update an organization.

**Request Body:** Same as POST (all fields)

**Response (200 OK):** Same as POST

#### DELETE /api/settings/organizations/:id

Delete an organization.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Organization deleted successfully"
}
```

---

### 2. Master Data (Generic Pattern)

**Supported Types:**
- `trade-types`
- `bargain-types`
- `varieties`
- `dispute-reasons`
- `weightment-terms`
- `passing-terms`
- `financial-years`

#### GET /api/settings/master-data/:type

List items of specified type.

**Example:** `GET /api/settings/master-data/trade-types`

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Domestic", "createdAt": "2024-01-01T00:00:00Z" },
    { "id": 2, "name": "Export", "createdAt": "2024-01-01T00:00:00Z" }
  ]
}
```

#### POST /api/settings/master-data/:type

Create a new item.

**Request Body:**
```json
{
  "name": "New Trade Type"
}
```

**Validation:**
- `name`: Required, 1-100 characters, unique (case-insensitive)

**Response (201 Created):**
```json
{
  "success": true,
  "data": { "id": 3, "name": "New Trade Type", "createdAt": "..." },
  "message": "Item created successfully"
}
```

#### PUT /api/settings/master-data/:type/:id

Update an item.

**Request Body:** Same as POST

**Response (200 OK):** Same as POST

#### DELETE /api/settings/master-data/:type/:id

Delete an item.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

### 3. GST Rates

#### GET /api/settings/gst-rates

List all GST rates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "description": "Cotton Bales",
      "hsnCode": "5201",
      "rate": 5.0,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/settings/gst-rates

Create a new GST rate.

**Request Body:**
```json
{
  "description": "Cotton Yarn",
  "hsnCode": "5205",
  "rate": 5.0
}
```

**Validation:**
- `description`: Required, 1-200 characters
- `hsnCode`: Required, 4, 6, or 8 digits
- `rate`: Required, number 0-100

**Response (201 Created):** Similar to master data

#### PUT /api/settings/gst-rates/:id

Update a GST rate.

#### DELETE /api/settings/gst-rates/:id

Delete a GST rate.

---

### 4. Locations

#### GET /api/settings/locations

List all locations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "country": "India",
      "state": "Maharashtra",
      "city": "Mumbai",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/settings/locations

Create a new location.

**Request Body:**
```json
{
  "country": "India",
  "state": "Delhi",
  "city": "New Delhi"
}
```

**Validation:**
- `country`: Required, 1-50 characters
- `state`: Required, 1-50 characters
- `city`: Required, 1-50 characters
- Combination of country+state+city must be unique

**Response (201 Created):** Similar to master data

#### DELETE /api/settings/locations/:id

Delete a location.

Note: No PUT endpoint needed for locations (recreate if needed)

---

### 5. Commissions

#### GET /api/settings/commissions

List all commission structures.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Standard Commission",
      "type": "PERCENTAGE",
      "value": 2.0,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Fixed Per Bale",
      "type": "PER_BALE",
      "value": 50.0,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/settings/commissions

Create a new commission structure.

**Request Body:**
```json
{
  "name": "Premium Commission",
  "type": "PERCENTAGE",
  "value": 3.5
}
```

**Validation:**
- `name`: Required, 1-100 characters, unique
- `type`: Required, enum: `PERCENTAGE` or `PER_BALE`
- `value`: Required, positive number
- If type is `PERCENTAGE`, value must be <= 100

**Response (201 Created):** Similar to master data

#### PUT /api/settings/commissions/:id

Update a commission structure.

#### DELETE /api/settings/commissions/:id

Delete a commission structure.

---

### 6. CCI Terms

#### GET /api/settings/cci-terms

List all CCI terms.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "CCI Mumbai 2024-25",
      "effectiveFrom": "2024-04-01",
      "effectiveTo": null,
      "version": 1,
      "isActive": true,
      "candy_factor": 0.2812,
      "gst_rate": 5.0,
      "emd_payment_days": 15,
      "emd_interest_percent": 5.0,
      // ... other CCI-specific fields
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/settings/cci-terms

Create a new CCI term.

**Request Body:** (All CCI term fields as defined in frontend types)

**Validation:** See `cciTermSchema` in `src/schemas/settingsSchemas.ts`

#### PUT /api/settings/cci-terms/:id

Update a CCI term.

#### DELETE /api/settings/cci-terms/:id

Delete a CCI term.

---

### 7. Delivery Terms

#### GET /api/settings/delivery-terms

List all delivery terms.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ex-Godown",
      "days": 0,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "FOR Destination",
      "days": 7,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/settings/delivery-terms

Create a new delivery term.

**Request Body:**
```json
{
  "name": "FOB Port",
  "days": 14
}
```

**Validation:**
- `name`: Required, 1-100 characters, unique
- `days`: Required, non-negative integer

**Response (201 Created):** Similar to master data

#### PUT /api/settings/delivery-terms/:id

Update a delivery term.

#### DELETE /api/settings/delivery-terms/:id

Delete a delivery term.

---

### 8. Payment Terms

Same structure as Delivery Terms but with different endpoint: `/api/settings/payment-terms`

---

## 🗄️ Database Schema

### Recommended Schema (PostgreSQL)

```sql
-- Enable UUID extension if using UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  gstin VARCHAR(15) NOT NULL UNIQUE,
  pan VARCHAR(10) NOT NULL,
  address VARCHAR(200) NOT NULL,
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  phone VARCHAR(10) NOT NULL,
  email VARCHAR(100) NOT NULL,
  website VARCHAR(200),
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  ifsc_code VARCHAR(11) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT org_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT org_phone_valid CHECK (phone ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT org_pincode_valid CHECK (pincode ~ '^[0-9]{6}$'),
  CONSTRAINT org_gstin_valid CHECK (gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
  CONSTRAINT org_pan_valid CHECK (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
  CONSTRAINT org_ifsc_valid CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$')
);

-- Indexes for performance
CREATE INDEX idx_org_code ON organizations(code);
CREATE INDEX idx_org_gstin ON organizations(gstin);
CREATE INDEX idx_org_active ON organizations(is_active);

-- Master Data Tables (generic pattern for all types)
CREATE TABLE trade_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bargain_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE varieties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_reasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weightment_terms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE passing_terms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_years (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GST Rates Table
CREATE TABLE gst_rates (
  id SERIAL PRIMARY KEY,
  description VARCHAR(200) NOT NULL,
  hsn_code VARCHAR(8) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT gst_rate_valid CHECK (rate >= 0 AND rate <= 100),
  CONSTRAINT gst_hsn_valid CHECK (hsn_code ~ '^[0-9]{4}([0-9]{2})?([0-9]{2})?$')
);

-- Locations Table
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  country VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT location_unique UNIQUE(country, state, city)
);

-- Commissions Table
CREATE TABLE commissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT commission_type_valid CHECK (type IN ('PERCENTAGE', 'PER_BALE')),
  CONSTRAINT commission_value_positive CHECK (value > 0)
);

-- Delivery Terms Table
CREATE TABLE delivery_terms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  days INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT delivery_days_valid CHECK (days >= 0)
);

-- Payment Terms Table
CREATE TABLE payment_terms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  days INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT payment_days_valid CHECK (days >= 0)
);

-- CCI Terms Table (simplified - add more fields as needed)
CREATE TABLE cci_terms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  version INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  candy_factor DECIMAL(10,6) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  emd_payment_days INTEGER,
  emd_interest_percent DECIMAL(5,2),
  -- Add other CCI-specific fields here
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT cci_version_positive CHECK (version > 0),
  CONSTRAINT cci_candy_factor_positive CHECK (candy_factor > 0),
  CONSTRAINT cci_gst_rate_valid CHECK (gst_rate >= 0 AND gst_rate <= 100)
);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to organizations table
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

## 🔒 Security Considerations

### Input Validation

1. **Server-side validation is mandatory** - Never trust client input
2. Use validation library (Zod/Joi) to validate all request bodies
3. Sanitize inputs to prevent SQL injection
4. Use parameterized queries (never string concatenation)

### SQL Injection Prevention

```javascript
// ✅ CORRECT - Parameterized query
db.query('SELECT * FROM organizations WHERE id = $1', [id]);

// ❌ WRONG - Vulnerable to SQL injection
db.query(`SELECT * FROM organizations WHERE id = ${id}`);
```

### CORS Configuration

```javascript
// Allow frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📊 Performance Considerations

### Database Indexes

Create indexes on frequently queried columns:
- organization code, GSTIN
- All name fields (for search/unique checks)
- isActive fields (for filtered queries)

### Caching

Consider caching master data that rarely changes:
- Trade types, bargain types, varieties
- GST rates
- Terms

Use Redis or similar for caching.

### Pagination

For large datasets, implement pagination:

```javascript
GET /api/settings/organizations?page=1&limit=50
```

## 🧪 Testing

### Example Test Cases

```javascript
describe('Organizations API', () => {
  it('should create organization with valid data', async () => {
    const response = await request(app)
      .post('/api/settings/organizations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validOrganizationData);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(validOrganizationData.name);
  });

  it('should reject duplicate GSTIN', async () => {
    await createOrganization(validOrganizationData);
    
    const response = await request(app)
      .post('/api/settings/organizations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validOrganizationData);
    
    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('should reject non-admin users', async () => {
    const response = await request(app)
      .get('/api/settings/organizations')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

## 📦 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] SSL/TLS enabled (HTTPS)
- [ ] CORS configured for frontend domain
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Database backups enabled
- [ ] Health check endpoint implemented
- [ ] API documentation generated (Swagger/OpenAPI)
- [ ] Load balancer configured (if needed)

## 📄 Example .env File

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rnrltradehub
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rnrltradehub
DB_USER=dbuser
DB_PASSWORD=securepassword

# JWT
JWT_SECRET=your-secret-key-min-32-characters-long
JWT_EXPIRATION=24h

# CORS
FRONTEND_URL=https://app.yourdomain.com

# Logging
LOG_LEVEL=info
```

## 🎯 Summary

**To implement the backend API:**

1. Set up Node.js/Express server
2. Configure PostgreSQL database
3. Implement authentication middleware
4. Create 8 resource groups with CRUD endpoints
5. Add input validation
6. Implement error handling
7. Add database constraints
8. Test all endpoints
9. Deploy to production

**Estimated Development Time:** 8-12 hours

**Priority:** High - Required for data persistence

---

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Ready for Backend Development
