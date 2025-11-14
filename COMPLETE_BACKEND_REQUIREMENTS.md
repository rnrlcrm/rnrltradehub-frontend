# Complete Backend API Requirements for RNRL TradeHub Frontend

> **Last Updated:** November 14, 2025  
> **Version:** 1.0  
> **Status:** Ready for Backend Development

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Modules Summary](#api-modules-summary)
5. [Detailed API Endpoints](#detailed-api-endpoints)
6. [Database Schema](#database-schema)
7. [Security Requirements](#security-requirements)
8. [Deployment & Configuration](#deployment--configuration)

---

## Overview

This document consolidates **ALL** backend API requirements for the RNRL TradeHub frontend application. The frontend is **100% complete** and ready for integration with the backend API.

### Quick Stats
- **Total API Modules:** 10
- **Total Endpoints:** ~180+
- **Total Database Tables:** ~40+
- **Frontend Files:** Complete and tested with mock data
- **API Client:** axios-based with TypeScript

### Base URL
```
Production: https://api.rnrltradehub.com/v1
Development: http://localhost:8000/api/v1
Staging: https://staging-api.rnrltradehub.com/v1
```

---

## Technology Stack

### Frontend (Already Built)
- **Framework:** React 18 with TypeScript
- **Routing:** React Router v6
- **State Management:** React Context + Hooks
- **UI Library:** Custom design system with Radix UI
- **HTTP Client:** Axios
- **Form Management:** React Hook Form + Zod validation
- **Build Tool:** Vite

### Backend Requirements
- **Framework:** Node.js/Express OR Python/FastAPI OR Go/Gin (your choice)
- **Database:** PostgreSQL 14+ OR MySQL 8+
- **Authentication:** JWT (JSON Web Tokens)
- **File Storage:** AWS S3 OR Azure Blob Storage OR local filesystem
- **Email:** SMTP (Gmail/SendGrid/AWS SES)
- **Cache (optional):** Redis

---

## Authentication & Authorization

### Standard Authentication Header
All API requests (except login/register) require:
```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
```

### JWT Token Structure
```json
{
  "userId": "string",
  "email": "string",
  "name": "string",
  "role": "Admin" | "User" | "Partner User",
  "userType": "back_office" | "business_partner" | "sub_user",
  "businessPartnerId": "string | null",
  "permissions": ["array", "of", "permissions"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token Expiry
- **Access Token:** 30 minutes
- **Refresh Token:** 7 days

### Standard Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

### Standard Error Format
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message",
    "details": {}
  }
}
```

### HTTP Status Codes
- `200` OK - Success
- `201` Created - Resource created
- `400` Bad Request - Validation failed
- `401` Unauthorized - Authentication required
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `409` Conflict - Duplicate resource
- `422` Unprocessable Entity - Business rule violation
- `500` Internal Server Error - Server error

---

## API Modules Summary

| # | Module | Base Path | Endpoints | Description |
|---|--------|-----------|-----------|-------------|
| 1 | Authentication | `/api/auth` | 8 | Login, logout, password management, session |
| 2 | Settings | `/api/settings` | 15 | Organizations, locations, CCI terms |
| 3 | Commodities | `/api/commodities` | 7 | Commodity master with trading parameters |
| 4 | Business Partners | `/api/partners` | 30+ | Partner registration, branches, KYC, documents |
| 5 | Trade Desk | `/api/trades`, `/api/offers` | 20+ | NLP, trades, offers, tested lots, dashboard |
| 6 | Financial Years | `/api/settings/financial-years` | 8 | FY management, split, closing |
| 7 | User Profile | `/api/profile`, `/api/admin` | 15+ | Profile updates, KYC, approvals |
| 8 | Multi-Tenant | `/api/settings/users` | 10+ | User management, sub-users, portals |
| 9 | Amendments | `/api/amendments` | 12 | Partner amendments, versioning, locks |
| 10 | Dynamic RBAC | `/api/rbac`, `/api/deals` | 35+ | Modules, permissions, access control |

---

## Detailed API Endpoints

## 1. Authentication Module (`/api/auth`)

### 1.1 Login
```http
POST /api/auth/login
```
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Admin",
    "userType": "back_office",
    "businessPartnerId": null,
    "permissions": ["sales:read", "sales:write"],
    "isFirstLogin": false
  },
  "tokens": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresIn": 1800
  }
}
```

### 1.2 Logout
```http
POST /api/auth/logout
```

### 1.3 Refresh Token
```http
POST /api/auth/refresh
```

### 1.4 Password Reset Request
```http
POST /api/auth/password-reset/request
```

### 1.5 Password Reset Confirm
```http
POST /api/auth/password-reset/confirm
```

### 1.6 Change Password
```http
POST /api/auth/password/change
```

### 1.7 First Login Password
```http
POST /api/auth/password/first-login
```

### 1.8 Session Validate
```http
GET /api/auth/session/validate
```

### 1.9 Session Activity
```http
POST /api/auth/session/activity
```

### 1.10 Get Current User
```http
GET /api/auth/me
```

---

## 2. Settings Module (`/api/settings`)

### 2.1 Organizations

```http
GET    /api/settings/organizations       # Get all
GET    /api/settings/organizations/:id   # Get by ID
POST   /api/settings/organizations       # Create
PUT    /api/settings/organizations/:id   # Update
DELETE /api/settings/organizations/:id   # Delete
```

**Organization Object:**
```json
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
  "bankName": "State Bank of India",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "branch": "Mumbai Main",
  "isActive": true
}
```

### 2.2 Locations

```http
GET    /api/settings/locations            # Get all
POST   /api/settings/locations            # Create
POST   /api/settings/locations/bulk       # Bulk upload
DELETE /api/settings/locations/:id        # Delete
```

**Location Object:**
```json
{
  "id": 1,
  "country": "India",
  "state": "Maharashtra",
  "city": "Mumbai"
}
```

### 2.3 CCI Terms

```http
GET    /api/settings/cci-terms      # Get all
POST   /api/settings/cci-terms      # Create
PUT    /api/settings/cci-terms/:id  # Update
DELETE /api/settings/cci-terms/:id  # Delete
```

---

## 3. Commodities Module (`/api/commodities`)

```http
GET    /api/commodities                    # Get all (with pagination)
GET    /api/commodities/:id                # Get by ID
POST   /api/commodities                    # Create
PUT    /api/commodities/:id                # Update
DELETE /api/commodities/:id                # Delete
PATCH  /api/commodities/:id/deactivate     # Deactivate
POST   /api/commodities/auto-gst           # Auto-determine GST
```

**Commodity Object:**
```json
{
  "id": 1,
  "name": "Cotton",
  "symbol": "CTN",
  "unit": "Bales",
  "hsnCode": "5201",
  "gstRate": 5,
  "gstCategory": "Agricultural",
  "isActive": true,
  "tradeTypes": [{"id": 1, "name": "Normal"}],
  "bargainTypes": [{"id": 1, "name": "Pucca Sauda"}],
  "varieties": [{"id": 1, "name": "MCU-5"}],
  "deliveryTerms": [{"id": 1, "name": "Ex-Gin", "days": 0}],
  "paymentTerms": [{"id": 1, "name": "Advance", "days": 0}],
  "commissions": [{"id": 1, "name": "Standard", "type": "PERCENTAGE", "value": 1.0}],
  "supportsCciTerms": true
}
```

**Business Rules:**
- Auto-determine HSN and GST based on commodity name
- Lock critical fields if active contracts exist
- Cannot delete if last active or has contracts
- Commission GST always 18% (SAC 9983)

---

## 4. Business Partner Module (`/api/partners`)

### 4.1 Registration Flow

```http
POST /api/partners/register/start             # Start registration
POST /api/partners/verification/send-otp      # Send OTP
POST /api/partners/verification/verify-otp    # Verify OTP
POST /api/partners/:partnerId/complete        # Complete registration
```

### 4.2 CRUD Operations

```http
GET    /api/partners/back-office              # Get all (back office)
POST   /api/partners/back-office/create       # Create (back office)
GET    /api/partners/:partnerId               # Get details
PUT    /api/partners/:partnerId               # Update
DELETE /api/partners/:partnerId               # Delete
```

### 4.3 Branch Management

```http
GET    /api/partners/:partnerId/branches           # Get branches
POST   /api/partners/:partnerId/branches           # Add branch
PUT    /api/partners/:partnerId/branches/:branchId # Update branch
DELETE /api/partners/:partnerId/branches/:branchId # Delete branch
```

**Branch Object:**
```json
{
  "id": "branch_1",
  "branchName": "Mumbai HO",
  "branchCode": "MUM-HO",
  "city": "Mumbai",
  "state": "Maharashtra",
  "gstNumber": "27AAAAA0000A1Z5",
  "panNumber": "AAAAA0000A",
  "bankName": "HDFC Bank",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234",
  "isHeadOffice": true
}
```

### 4.4 Document Management

```http
GET    /api/partners/:partnerId/documents                      # Get all
POST   /api/partners/:partnerId/documents/upload               # Upload
DELETE /api/partners/:partnerId/documents/:documentId          # Delete
POST   /api/partners/:partnerId/documents/:documentId/verify   # Verify
```

### 4.5 KYC Management

```http
GET  /api/partners/:partnerId/kyc/current            # Current KYC
GET  /api/partners/:partnerId/kyc/history            # KYC history
POST /api/partners/:partnerId/kyc/renew              # Renew KYC
GET  /api/partners/kyc/expiring?days=30              # Expiring KYC
POST /api/partners/:partnerId/kyc/:kycId/verify      # Verify KYC
```

### 4.6 Sub-Users

```http
GET    /api/partners/:partnerId/sub-users                       # Get all
POST   /api/partners/:partnerId/sub-users                       # Add
PUT    /api/partners/:partnerId/sub-users/:subUserId            # Update
DELETE /api/partners/:partnerId/sub-users/:subUserId            # Delete
POST   /api/partners/:partnerId/sub-users/:subUserId/approve    # Approve
```

### 4.7 Certifications

```http
GET    /api/partners/:partnerId/certifications                             # Get all
POST   /api/partners/:partnerId/certifications                             # Add
PUT    /api/partners/:partnerId/certifications/:certId                     # Update
DELETE /api/partners/:partnerId/certifications/:certId                     # Delete
GET    /api/partners/certifications/pending                                # Pending (admin)
POST   /api/partners/:partnerId/certifications/:certId/verify              # Verify
POST   /api/partners/:partnerId/certifications/:certId/reject              # Reject
```

### 4.8 Sub-Broker Specific

```http
POST /api/partners/sub-broker/register-user      # Register user
GET  /api/partners/:subBrokerId/registered-users # Get registered users
```

---

## 5. Trade Desk Module

### 5.1 NLP & Commodity (`/api`)

```http
POST /api/nlp/parse                                 # Parse natural language
GET  /api/commodity/:commodityId/parameters         # Get commodity parameters
```

### 5.2 Trades (`/api/trades`)

```http
POST /api/trades                    # Create trade
GET  /api/trades/:tradeId           # Get trade
GET  /api/trades/my-trades          # Get my trades
GET  /api/trades/:tradeId/matches   # Get matched sellers
GET  /api/trades/:tradeId/offers    # Get trade offers
```

### 5.3 Offers (`/api/offers`)

```http
POST /api/offers                      # Create offer
GET  /api/offers/my-offers            # Get my offers
POST /api/offers/:offerId/counter     # Counter offer
POST /api/offers/:offerId/accept      # Accept offer
POST /api/offers/:offerId/reject      # Reject offer
```

### 5.4 Tested Lots (`/api/tested-lots`)

```http
POST /api/tested-lots    # Create tested lot
GET  /api/tested-lots    # Get tested lots
```

### 5.5 Dashboard (`/api/dashboard`)

```http
GET  /api/dashboard/trades-summary            # Summary
GET  /api/dashboard/trades                    # Trades
GET  /api/dashboard/seller-performance        # Performance
POST /api/dashboard/trade/:tradeId/force-match    # Force match
POST /api/dashboard/trade/:tradeId/invite-seller  # Invite seller
```

---

## 6. Financial Year Module (`/api/settings/financial-years`)

```http
GET  /api/settings/financial-years                 # Get all
GET  /api/settings/financial-years/active          # Get active
GET  /api/settings/financial-years/:id             # Get by ID
POST /api/settings/financial-years                 # Create
PUT  /api/settings/financial-years/:id             # Update
GET  /api/settings/financial-years/:id/pending-items   # Pending items
POST /api/settings/financial-years/:id/split       # Perform split
POST /api/settings/financial-years/:id/close       # Close FY
```

**Financial Year Object:**
```json
{
  "id": 1,
  "fyCode": "2024-2025",
  "startDate": "2024-04-01",
  "endDate": "2025-03-31",
  "status": "ACTIVE"
}
```

**Business Rules:**
- Only one active FY at a time
- Start date must be April 1
- End date must be March 31 of next year
- Cannot close if pending items exist

---

## 7. User Profile Module

### 7.1 User APIs (`/api/profile`)

```http
GET    /api/profile/me                          # Get my profile
GET    /api/profile/me/dashboard                # Get dashboard
POST   /api/profile/me/update-request           # Request update
GET    /api/profile/me/pending-updates          # Pending updates
DELETE /api/profile/me/update-request/:id       # Cancel request
GET    /api/profile/me/kyc                      # Get KYC status
POST   /api/profile/me/documents                # Upload documents
```

### 7.2 Admin APIs (`/api/admin`)

```http
GET  /api/admin/profile-updates/pending                     # Pending updates
POST /api/admin/profile-updates/:id/approve                 # Approve
POST /api/admin/profile-updates/:id/reject                  # Reject
GET  /api/admin/kyc/due-list                                # KYC due list
POST /api/admin/kyc/:partnerId/verify                       # Verify KYC
POST /api/admin/kyc/:partnerId/send-reminder                # Send reminder
GET  /api/admin/kyc/reminder-config                         # Get config
PUT  /api/admin/kyc/reminder-config                         # Update config
GET  /api/admin/kyc/:partnerId/history                      # KYC history
```

---

## 8. Multi-Tenant Module (`/api/settings`)

### 8.1 User Management

```http
GET    /api/settings/users              # Get all users
POST   /api/settings/users              # Create user
PUT    /api/settings/users/:userId      # Update user
DELETE /api/settings/users/:userId      # Delete user
GET    /api/settings/users/me           # Current user
```

### 8.2 Sub-User Management (My Team)

```http
GET    /api/settings/users/my-team                        # Get my team
POST   /api/settings/users/my-team                        # Add sub-user
PUT    /api/settings/users/my-team/:subUserId             # Update
DELETE /api/settings/users/my-team/:subUserId             # Delete
GET    /api/settings/users/my-team/:subUserId/activity    # Activity log
```

### 8.3 Portals

```http
GET /api/settings/portals/:portalType/modules   # Get portal modules
```

Portal types: `back_office`, `client`, `vendor`

---

## 9. Amendment Module (`/api/amendments`)

```http
POST   /api/amendments                              # Create amendment
POST   /api/amendments/impact-assessment            # Impact assessment
GET    /api/amendments/pending                      # Pending amendments
GET    /api/amendments/:amendmentId                 # Get amendment
POST   /api/amendments/:amendmentId/approve         # Approve
POST   /api/amendments/:amendmentId/reject          # Reject
DELETE /api/amendments/:amendmentId                 # Delete
GET    /api/amendments/history/:partnerId           # History
GET    /api/partners/:partnerId/versions            # Get versions
GET    /api/partners/:partnerId/versions/:version   # Get specific version
GET    /api/partners/:partnerId/as-of/:date         # Partner as of date
GET    /api/partners/:partnerId/locks               # Transaction locks
POST   /api/amendments/check-allowed                # Check if allowed
GET    /api/partners/:partnerId/compare             # Compare versions
```

**Amendment Object:**
```json
{
  "id": "amd_123",
  "partnerId": "bp_456",
  "amendmentType": "CONTACT_UPDATE",
  "proposedChanges": {
    "field": "email",
    "oldValue": "old@email.com",
    "newValue": "new@email.com"
  },
  "status": "PENDING",
  "effectiveDate": "2024-12-01"
}
```

---

## 10. Dynamic RBAC Module (`/api/rbac`)

### 10.1 Modules

```http
GET    /api/rbac/modules                    # Get all modules
GET    /api/rbac/modules/:moduleId          # Get module
POST   /api/rbac/modules                    # Create module
PUT    /api/rbac/modules/:moduleId          # Update module
DELETE /api/rbac/modules/:moduleId          # Delete module
POST   /api/rbac/modules/:moduleId/reactivate   # Reactivate
GET    /api/rbac/modules/all                # All modules (simple)
```

### 10.2 Permissions

```http
GET  /api/rbac/modules/:moduleId/permissions    # Get permissions
POST /api/rbac/permissions                      # Create permission
PUT  /api/rbac/permissions/:permissionId        # Update permission
GET  /api/rbac/users/:userId/permissions        # User permissions
```

### 10.3 Deals/Contracts

```http
GET    /api/deals/:dealId/access-check              # Check access
GET    /api/deals/my-deals                          # My deals
GET    /api/deals/:dealId                           # Get deal
GET    /api/deals/interaction-network               # Network
POST   /api/deals/check-initiation                  # Check initiation
POST   /api/deals/:dealId/participants              # Add participant
DELETE /api/deals/:dealId/participants/:participantId   # Remove participant
PUT    /api/deals/:dealId/participants/:participantId/permissions   # Update permissions
GET    /api/deals/:dealId/participants              # Get participants
POST   /api/deals/search                            # Search deals
POST   /api/deals/bulk-get                          # Bulk get
POST   /api/deals/bulk-update                       # Bulk update
GET    /api/deals/:dealId/access-history            # Access history
GET    /api/users/:userId/access-history            # User history
```

### 10.4 Business Types

```http
GET    /api/rbac/business-types                             # Get all
POST   /api/rbac/business-types                             # Create
PUT    /api/rbac/business-types/:typeId                     # Update
POST   /api/rbac/modules/:moduleId/assign                   # Assign module
DELETE /api/rbac/modules/:moduleId/assign                   # Unassign module
GET    /api/rbac/modules/:moduleId/business-types           # Get business types
```

### 10.5 Permission Checks

```http
GET  /api/rbac/check-permission         # Check permission
POST /api/rbac/bulk-check-permissions   # Bulk check
```

### 10.6 Configuration

```http
GET  /api/rbac/export   # Export configuration
POST /api/rbac/import   # Import configuration
```

---

## Database Schema

### Key Tables

1. **users** - User accounts
2. **business_partners** - Business partner records
3. **business_branches** - Partner branches
4. **organizations** - Company organizations
5. **commodities** - Commodity master
6. **financial_years** - Financial year records
7. **locations** - Geographic locations
8. **cci_terms** - CCI terms for cotton
9. **sessions** - Active sessions
10. **password_reset_tokens** - Password reset tokens
11. **roles** - Role definitions
12. **permissions** - Permission definitions
13. **modules** - RBAC modules
14. **trades** - Trade desk trades
15. **offers** - Trade offers
16. **tested_lots** - Quality test results
17. **amendments** - Amendment requests
18. **amendment_history** - Amendment audit trail
19. **profile_update_requests** - Profile change requests
20. **kyc_verifications** - KYC records
21. **documents** - Document metadata
22. **audit_logs** - System audit trail

### Sample Schema (users table)

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type ENUM('back_office', 'business_partner', 'sub_user') NOT NULL,
  business_partner_id VARCHAR(36),
  role_id VARCHAR(36) NOT NULL,
  status ENUM('active', 'inactive', 'suspended', 'pending_approval') DEFAULT 'pending_approval',
  is_first_login BOOLEAN DEFAULT TRUE,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  
  FOREIGN KEY (business_partner_id) REFERENCES business_partners(id),
  INDEX idx_email (email),
  INDEX idx_business_partner (business_partner_id)
);
```

For complete database schema, see existing documentation:
- `BACKEND_API_REQUIREMENTS.md` (Settings schema)
- `BACKEND_INTEGRATION_REQUIREMENTS.md` (Auth & users schema)
- `BACKEND_API_SPECIFICATION.md` (Commodity schema)

---

## Security Requirements

### 1. Password Policy
- Min length: 8, Max: 128
- Require: uppercase, lowercase, numbers, special chars
- Prevent reuse: last 5 passwords
- Expiry: 90 days
- Max attempts: 5, Lockout: 30 min

### 2. JWT
- Algorithm: HS256 or RS256
- Access: 30 min, Refresh: 7 days
- Invalidate on password change

### 3. Data Validation
- Server-side validation mandatory
- Use validation libraries
- Sanitize all inputs
- Parameterized queries only
- Validate file uploads

### 4. CORS
```javascript
{
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}
```

### 5. Rate Limiting
- Login: 5/15min/IP
- Password reset: 3/hour/email
- Email: 10/hour/user
- API: 100/min/user

### 6. Audit Logging
Log: timestamp, user, action, resource, IP, user agent

---

## Deployment & Configuration

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=8000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rnrltradehub
DB_USER=dbuser
DB_PASSWORD=securepassword

# JWT
JWT_SECRET=your-secret-key-min-32-characters-long
JWT_ACCESS_EXPIRY=1800
JWT_REFRESH_EXPIRY=604800

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@rnrltradehub.com
SMTP_PASS=app_specific_password

# Frontend
FRONTEND_URL=https://app.rnrltradehub.com

# Storage
STORAGE_TYPE=s3
AWS_S3_BUCKET=rnrltradehub-documents
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Implementation Priority

**Phase 1 (Weeks 1-2):** Authentication, Users, Organizations  
**Phase 2 (Week 3):** Commodities, Locations, Settings  
**Phase 3 (Weeks 4-5):** Business Partners, Branches, KYC  
**Phase 4 (Weeks 6-7):** Trade Desk, Amendments, RBAC  
**Phase 5 (Week 8):** Testing, Polish, Documentation

**Total:** 8-10 weeks with 2-3 developers

---

## Additional Resources

- **Existing Documentation:** See 9 BACKEND_*.md files in repository
- **API Client Code:** `src/api/*.ts` files
- **Type Definitions:** `src/types/*.ts` files
- **Mock Data:** `src/data/mockData.ts`

---

**Document Version:** 1.0  
**Created:** November 14, 2025  
**Status:** Complete & Ready for Backend Development  
**Maintained By:** RNRL TradeHub Team
