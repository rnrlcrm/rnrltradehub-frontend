# Backend Integration Requirements

## Overview
This document outlines all the backend API endpoints and database schema requirements for the enhanced Login, Access Control, and Business Partner modules with multi-branch support.

## Table of Contents
1. [Authentication & Session Management](#authentication--session-management)
2. [Access Control & User Management](#access-control--user-management)
3. [Business Partner with Multi-Branch](#business-partner-with-multi-branch)
4. [Email Notifications](#email-notifications)
5. [Database Schema](#database-schema)
6. [Security Requirements](#security-requirements)

---

## 1. Authentication & Session Management

### 1.1 Login Flow

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Admin",
    "userType": "back_office",
    "businessPartnerId": null,
    "branchIds": [],
    "permissions": ["sales:read", "sales:write", ...],
    "isFirstLogin": false,
    "lastLoginAt": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 1800,
    "tokenType": "Bearer"
  },
  "requiresPasswordReset": false
}
```

**Response (First Login):**
```json
{
  "user": { ... },
  "tokens": { ... },
  "requiresPasswordReset": true
}
```

**Response (Failed - Invalid Credentials):**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "code": "401"
}
```

**Response (Failed - Account Locked):**
```json
{
  "success": false,
  "message": "Account is locked due to too many failed login attempts",
  "code": "423",
  "details": {
    "lockedUntil": "2024-01-15T11:00:00Z"
  }
}
```

### 1.2 Session Management

**Endpoint:** `POST /api/auth/session/activity`
- Called every time user performs an action
- Resets inactivity timer
- Returns 200 OK

**Endpoint:** `GET /api/auth/session/validate`
- Validates if session is still active
- Returns session info

**Response:**
```json
{
  "userId": "user_123",
  "startTime": 1705318200000,
  "lastActivity": 1705319000000,
  "expiresAt": 1705361400000,
  "isActive": true
}
```

### 1.3 Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "accessToken": "new_jwt_access_token",
  "refreshToken": "new_jwt_refresh_token",
  "expiresIn": 1800,
  "tokenType": "Bearer"
}
```

### 1.4 Password Management

**Endpoint:** `POST /api/auth/password-reset/request`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Endpoint:** `POST /api/auth/password-reset/confirm`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePassword123!"
}
```

**Endpoint:** `POST /api/auth/password/first-login`

**Request Body:**
```json
{
  "newPassword": "NewSecurePassword123!"
}
```
- Requires user to be in first-login state
- Sets `isFirstLogin` to false

**Endpoint:** `POST /api/auth/password/change`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

### 1.5 Password Policy Configuration

**Endpoint:** `GET /api/settings/password-policy`

**Response:**
```json
{
  "minLength": 8,
  "maxLength": 128,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireNumbers": true,
  "requireSpecialChars": true,
  "specialChars": "!@#$%^&*()_+-=[]{}|;:,.<>?",
  "preventReuse": 5,
  "expiryDays": 90,
  "maxAttempts": 5,
  "lockoutDurationMinutes": 30
}
```

**Endpoint:** `PUT /api/settings/password-policy`
- Admin only
- Updates password policy

### 1.6 Session Configuration

**Endpoint:** `GET /api/settings/session-config`

**Response:**
```json
{
  "timeoutMinutes": 30,
  "warningMinutes": 5,
  "maxDurationHours": 12,
  "allowConcurrentSessions": false,
  "refreshTokenExpiryDays": 7
}
```

**Endpoint:** `PUT /api/settings/session-config`
- Admin only

---

## 2. Access Control & User Management

### 2.1 User CRUD Operations

**Endpoint:** `GET /api/users`

**Query Parameters:**
- `userType`: back_office | business_partner | sub_user
- `status`: active | inactive | suspended | pending_approval
- `businessPartnerId`: filter by business partner
- `search`: search by name or email

**Response:**
```json
[
  {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "business_partner",
    "businessPartnerId": "bp_456",
    "businessPartnerName": "ABC Corp",
    "businessPartnerType": "BUYER",
    "branchIds": ["branch_1", "branch_2"],
    "isSubUser": false,
    "parentUserId": null,
    "subUserLimit": 2,
    "subUserCount": 1,
    "roleId": "role_789",
    "roleName": "Partner User",
    "permissions": [...],
    "status": "active",
    "approvalStatus": "approved",
    "isFirstLogin": false,
    "requiresPasswordReset": false,
    "creationSource": "BUSINESS_PARTNER",
    "autoCreatedFromPartner": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "lastLoginAt": "2024-01-20T09:30:00Z"
  }
]
```

**Endpoint:** `POST /api/users`
- Manual user creation (back office only)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "userType": "back_office",
  "roleId": "role_123",
  "branchIds": [],
  "status": "active"
}
```

**Response:**
- Returns created user object
- Sends welcome email with temporary password

**Endpoint:** `PUT /api/users/:userId`
**Endpoint:** `DELETE /api/users/:userId`

### 2.2 Sub-User Management

**Endpoint:** `GET /api/users/me/sub-users`
- Returns sub-users for current logged-in user

**Endpoint:** `POST /api/users/me/sub-users/invite`

**Request Body:**
```json
{
  "email": "subuser@example.com",
  "name": "Sub User Name",
  "branchIds": ["branch_1"],
  "permissions": ["sales:read", "invoices:read"]
}
```

**Response:**
```json
{
  "id": "invite_123",
  "parentUserId": "user_456",
  "email": "subuser@example.com",
  "name": "Sub User Name",
  "branchIds": ["branch_1"],
  "permissions": [...],
  "status": "pending",
  "inviteToken": "token_abc123",
  "expiresAt": "2024-01-22T10:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z"
}
```
- Sends invitation email

**Endpoint:** `POST /api/users/sub-users/accept`

**Request Body:**
```json
{
  "token": "invite_token",
  "password": "SecurePassword123!"
}
```
- Creates sub-user account
- Returns user object and tokens

**Endpoint:** `PUT /api/users/me/sub-users/:subUserId`
**Endpoint:** `DELETE /api/users/me/sub-users/:subUserId`

### 2.3 Role Management

**Endpoint:** `GET /api/roles`
**Endpoint:** `POST /api/roles`
**Endpoint:** `PUT /api/roles/:roleId`
**Endpoint:** `DELETE /api/roles/:roleId`

**Role Object:**
```json
{
  "id": "role_123",
  "name": "Sales Manager",
  "description": "Manages sales operations",
  "userType": "back_office",
  "permissions": [
    {
      "moduleId": "sales",
      "moduleName": "Sales Contracts",
      "actions": ["create", "read", "update", "delete"]
    }
  ],
  "isSystemRole": false,
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### 2.4 Approval Workflows

**Endpoint:** `GET /api/approvals/pending`
- Returns pending approval requests

**Response:**
```json
[
  {
    "id": "approval_123",
    "requestType": "user_creation",
    "requesterId": "system",
    "requesterName": "Auto-generated from Business Partner",
    "targetUserId": null,
    "targetUserEmail": "newuser@businesspartner.com",
    "details": {
      "businessPartnerId": "bp_456",
      "businessPartnerName": "ABC Corp",
      "name": "John Doe"
    },
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

**Endpoint:** `POST /api/approvals/:approvalId/approve`

**Request Body:**
```json
{
  "notes": "All documents verified"
}
```

**Response:**
- Returns updated approval object
- Creates/activates user
- Generates temporary password
- Sends welcome email

**Endpoint:** `POST /api/approvals/:approvalId/reject`

**Request Body:**
```json
{
  "reason": "Incomplete documentation"
}
```

### 2.5 Data Isolation

**Endpoint:** `GET /api/users/:userId/data-isolation`

**Response:**
```json
{
  "userId": "user_123",
  "branchIds": ["branch_1", "branch_2"],
  "canViewAllBranches": false,
  "canViewConsolidated": false
}
```

**Endpoint:** `PUT /api/users/:userId/data-isolation`

**Endpoint:** `GET /api/branches/:branchId/users`
- Returns all users with access to specific branch

---

## 3. Business Partner with Multi-Branch

### 3.1 Business Partner CRUD

**Endpoint:** `GET /api/business-partners`

**Query Parameters:**
- `businessType`: BUYER | SELLER | TRADER | SUB_BROKER | TRANSPORTER | CONTROLLER
- `status`: DRAFT | PENDING_APPROVAL | ACTIVE | INACTIVE | SUSPENDED | BLACKLISTED
- `search`: search by name

**Response:**
```json
[
  {
    "id": "bp_123",
    "partnerCode": "BP-2024-0001",
    "legalName": "ABC Corporation Ltd",
    "tradeName": "ABC Corp",
    "businessType": "TRADER",
    "status": "ACTIVE",
    "primaryContactPerson": "John Doe",
    "primaryContactEmail": "john@abccorp.com",
    "primaryContactPhone": "+91-9876543210",
    "registeredAddress": {
      "addressLine1": "123 Main Street",
      "addressLine2": "Suite 100",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "branches": [
      {
        "id": "branch_1",
        "partnerId": "bp_123",
        "branchName": "Mumbai HO",
        "branchCode": "MUM-HO",
        "addressLine1": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "country": "India",
        "gstNumber": "27AAAAA0000A1Z5",
        "panNumber": "AAAAA0000A",
        "contactPerson": "Branch Manager",
        "contactEmail": "mumbai@abccorp.com",
        "contactPhone": "+91-9876543210",
        "bankName": "HDFC Bank",
        "accountNumber": "1234567890",
        "ifscCode": "HDFC0001234",
        "branchName": "Main Branch",
        "isActive": true,
        "isHeadOffice": true,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z",
        "createdBy": "admin_user"
      }
    ],
    "pan": "AAAAA0000A",
    "cin": "U12345MH2020PTC123456",
    "tan": "MUMA12345A",
    "primaryBank": {
      "bankName": "HDFC Bank",
      "accountNumber": "1234567890",
      "ifscCode": "HDFC0001234"
    },
    "documents": {
      "panCard": "documents/bp_123/pan_card.pdf",
      "incorporationCert": "documents/bp_123/incorporation.pdf",
      "addressProof": "documents/bp_123/address_proof.pdf",
      "cancelledCheque": "documents/bp_123/cheque.pdf"
    },
    "primaryUserId": "user_456",
    "primaryUserApprovalStatus": "APPROVED",
    "primaryUserApprovedBy": "admin_123",
    "primaryUserApprovedAt": "2024-01-15T11:00:00Z",
    "approvalStatus": "APPROVED",
    "approvedBy": "admin_123",
    "approvedAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "createdBy": "sales_user",
    "complianceNotes": "All documents verified and compliant"
  }
]
```

**Endpoint:** `POST /api/business-partners`
- Creates new business partner
- Sets status to PENDING_APPROVAL
- Creates pending user approval workflow

**Request Body:**
```json
{
  "legalName": "ABC Corporation Ltd",
  "tradeName": "ABC Corp",
  "businessType": "TRADER",
  "primaryContactPerson": "John Doe",
  "primaryContactEmail": "john@abccorp.com",
  "primaryContactPhone": "+91-9876543210",
  "registeredAddress": {
    "addressLine1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "pan": "AAAAA0000A",
  "cin": "U12345MH2020PTC123456"
}
```

**Response:**
```json
{
  "partner": { /* partner object */ },
  "primaryUser": {
    "businessPartnerId": "bp_123",
    "email": "john@abccorp.com",
    "name": "John Doe",
    "role": "Partner User",
    "branchIds": [],
    "isSubUser": false,
    "parentUserId": null
  }
}
```

**Endpoint:** `PUT /api/business-partners/:partnerId`
**Endpoint:** `GET /api/business-partners/:partnerId`

### 3.2 Partner Approval

**Endpoint:** `POST /api/business-partners/:partnerId/approve`

**Request Body:**
```json
{
  "notes": "All documents verified"
}
```

**Response:**
- Updates partner status to ACTIVE
- Creates user account with primary contact email
- Generates temporary password
- Sends welcome email to user
- Returns updated partner object

**Endpoint:** `POST /api/business-partners/:partnerId/reject`

**Request Body:**
```json
{
  "reason": "Incomplete documentation"
}
```

### 3.3 Branch Management

**Endpoint:** `GET /api/business-partners/:partnerId/branches`
**Endpoint:** `POST /api/business-partners/:partnerId/branches`
**Endpoint:** `PUT /api/business-partners/:partnerId/branches/:branchId`
**Endpoint:** `DELETE /api/business-partners/:partnerId/branches/:branchId`
**Endpoint:** `GET /api/business-partners/:partnerId/branches/:branchId`

**Endpoint:** `GET /api/branches`
- Returns all branches (for selection dropdowns)

**Endpoint:** `GET /api/branches/search`

**Query Parameters:**
- `q`: search query
- `state`: filter by state
- `partnerId`: filter by partner

### 3.4 Primary User Approval

**Endpoint:** `POST /api/business-partners/:partnerId/approve-user`

**Response:**
```json
{
  "user": {
    "id": "user_456",
    "email": "john@abccorp.com",
    "name": "John Doe",
    "businessPartnerId": "bp_123",
    "branchIds": ["branch_1", "branch_2"],
    "roleId": "role_partner",
    "status": "active"
  },
  "temporaryPassword": "Auto@Gen3rated!Pass"
}
```
- Sends welcome email with temporary password

**Endpoint:** `POST /api/business-partners/:partnerId/reject-user`

---

## 4. Email Notifications

### 4.1 Email Configuration

**Endpoint:** `GET /api/settings/email-config`
**Endpoint:** `PUT /api/settings/email-config`

```json
{
  "provider": "gmail",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  },
  "auth": {
    "user": "noreply@rnrltradehub.com",
    "pass": "app_specific_password"
  },
  "from": {
    "name": "RNRL TradeHub",
    "email": "noreply@rnrltradehub.com"
  }
}
```

### 4.2 Email Templates

Backend should implement the following email templates (see `src/config/security.ts` for HTML templates):

1. **WELCOME_USER**: Sent when user is created and approved
   - Variables: `{{userName}}`, `{{userEmail}}`, `{{temporaryPassword}}`, `{{businessPartnerName}}`, `{{loginUrl}}`

2. **PASSWORD_RESET**: Sent for password reset requests
   - Variables: `{{userName}}`, `{{resetUrl}}`

3. **SUB_USER_INVITE**: Sent when sub-user is invited
   - Variables: `{{inviteeName}}`, `{{inviterName}}`, `{{businessPartnerName}}`, `{{accessDescription}}`, `{{acceptUrl}}`

4. **APPROVAL_PENDING**: Sent to admin when approval is needed
   - Variables: `{{userName}}`, `{{userEmail}}`, `{{businessPartnerName}}`, `{{roleName}}`, `{{approvalUrl}}`

---

## 5. Database Schema

### 5.1 Users Table

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- User Type
  user_type ENUM('back_office', 'business_partner', 'sub_user') NOT NULL,
  
  -- Business Partner Link
  business_partner_id VARCHAR(36),
  business_partner_name VARCHAR(255),
  business_partner_type VARCHAR(50),
  
  -- Sub-User
  is_sub_user BOOLEAN DEFAULT FALSE,
  parent_user_id VARCHAR(36),
  sub_user_limit INT DEFAULT 2,
  sub_user_count INT DEFAULT 0,
  
  -- Role
  role_id VARCHAR(36) NOT NULL,
  role_name VARCHAR(100),
  
  -- Status
  status ENUM('active', 'inactive', 'suspended', 'pending_approval') DEFAULT 'pending_approval',
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by VARCHAR(36),
  approved_at TIMESTAMP,
  
  -- Password Security
  is_first_login BOOLEAN DEFAULT TRUE,
  requires_password_reset BOOLEAN DEFAULT FALSE,
  password_last_changed TIMESTAMP,
  password_expires_at TIMESTAMP,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  password_history TEXT, -- JSON array of hashed passwords
  
  -- Creation Source
  creation_source ENUM('MANUAL', 'BUSINESS_PARTNER', 'SUB_USER_INVITE') NOT NULL,
  auto_created_from_partner BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  last_login_at TIMESTAMP,
  deactivated_at TIMESTAMP,
  
  FOREIGN KEY (business_partner_id) REFERENCES business_partners(id),
  FOREIGN KEY (parent_user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_email (email),
  INDEX idx_business_partner (business_partner_id),
  INDEX idx_status (status),
  INDEX idx_user_type (user_type)
);
```

### 5.2 User Branch Access Table

```sql
CREATE TABLE user_branch_access (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  branch_id VARCHAR(36) NOT NULL,
  can_view_all_branches BOOLEAN DEFAULT FALSE,
  can_view_consolidated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES business_branches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_branch (user_id, branch_id),
  INDEX idx_user (user_id),
  INDEX idx_branch (branch_id)
);
```

### 5.3 Business Partners Table

```sql
CREATE TABLE business_partners (
  id VARCHAR(36) PRIMARY KEY,
  partner_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Basic Info
  legal_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  business_type ENUM('BUYER', 'SELLER', 'TRADER', 'SUB_BROKER', 'TRANSPORTER', 'CONTROLLER') NOT NULL,
  status ENUM('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED') DEFAULT 'DRAFT',
  
  -- Primary Contact
  primary_contact_person VARCHAR(255) NOT NULL,
  primary_contact_email VARCHAR(255) NOT NULL,
  primary_contact_phone VARCHAR(50) NOT NULL,
  
  -- Registered Address
  registered_address JSON NOT NULL,
  
  -- Compliance
  pan VARCHAR(10) NOT NULL,
  cin VARCHAR(21),
  tan VARCHAR(10),
  
  -- Primary Bank
  primary_bank JSON,
  
  -- Documents
  documents JSON,
  
  -- User Management
  primary_user_id VARCHAR(36),
  primary_user_approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  primary_user_approved_by VARCHAR(36),
  primary_user_approved_at TIMESTAMP,
  
  -- Workflow
  approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  approved_by VARCHAR(36),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  compliance_notes TEXT,
  
  FOREIGN KEY (primary_user_id) REFERENCES users(id),
  INDEX idx_partner_code (partner_code),
  INDEX idx_status (status),
  INDEX idx_business_type (business_type),
  INDEX idx_primary_email (primary_contact_email)
);
```

### 5.4 Business Branches Table

```sql
CREATE TABLE business_branches (
  id VARCHAR(36) PRIMARY KEY,
  partner_id VARCHAR(36) NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  branch_code VARCHAR(50) NOT NULL,
  
  -- Address
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  
  -- GST & Tax
  gst_number VARCHAR(15) NOT NULL,
  pan_number VARCHAR(10),
  
  -- Contact
  contact_person VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  
  -- Banking
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(11) NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_head_office BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  
  FOREIGN KEY (partner_id) REFERENCES business_partners(id) ON DELETE CASCADE,
  UNIQUE KEY unique_branch_code (partner_id, branch_code),
  INDEX idx_partner (partner_id),
  INDEX idx_gst (gst_number),
  INDEX idx_state (state),
  INDEX idx_is_head_office (is_head_office)
);
```

### 5.5 Add branch_id to existing tables

For proper branch-wise data isolation and reporting, add `branch_id` column to:

1. **sales_contracts**
2. **delivery_orders**
3. **invoices**
4. **payments**
5. **ledger_entries**
6. **accounting_transactions**

Example:
```sql
ALTER TABLE sales_contracts
ADD COLUMN branch_id VARCHAR(36),
ADD FOREIGN KEY (branch_id) REFERENCES business_branches(id),
ADD INDEX idx_branch (branch_id);
```

### 5.6 Other Required Tables

```sql
-- Roles
CREATE TABLE roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  user_type ENUM('back_office', 'business_partner') NOT NULL,
  permissions JSON NOT NULL,
  is_system_role BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Permissions (for custom permissions)
CREATE TABLE user_permissions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  actions JSON NOT NULL, -- ['create', 'read', 'update', 'delete']
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- Sub-User Invitations
CREATE TABLE sub_user_invites (
  id VARCHAR(36) PRIMARY KEY,
  parent_user_id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  branch_ids JSON NOT NULL,
  permissions JSON NOT NULL,
  status ENUM('pending', 'accepted', 'expired', 'cancelled') DEFAULT 'pending',
  invite_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_parent (parent_user_id),
  INDEX idx_token (invite_token),
  INDEX idx_status (status)
);

-- Approval Workflows
CREATE TABLE approval_workflows (
  id VARCHAR(36) PRIMARY KEY,
  request_type ENUM('user_creation', 'user_modification', 'role_assignment') NOT NULL,
  requester_id VARCHAR(36),
  requester_name VARCHAR(255) NOT NULL,
  target_user_id VARCHAR(36),
  target_user_email VARCHAR(255) NOT NULL,
  details JSON NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by VARCHAR(36),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_requester (requester_id),
  INDEX idx_target (target_user_id)
);

-- Session Management
CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  start_time TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_refresh_token (refresh_token),
  INDEX idx_expires_at (expires_at)
);

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user (user_id)
);
```

---

## 6. Security Requirements

### 6.1 Password Hashing
- Use bcrypt with at least 10 rounds
- Store hashed passwords only
- Never log or transmit plain-text passwords

### 6.2 JWT Tokens
- **Access Token**: 30-minute expiry
- **Refresh Token**: 7-day expiry
- Include user ID, email, role, permissions in JWT payload
- Sign with HS256 or RS256

### 6.3 Session Security
- Track failed login attempts
- Lock account for 30 minutes after 5 failed attempts
- Invalidate sessions on password change
- Support single session per user (optional based on config)

### 6.4 Data Isolation
- Apply branch-based filtering on all queries
- Users see only data from their assigned branches
- Super Admin and HO staff can view all branches
- Enforce at database query level, not just UI

### 6.5 Audit Logging
- Log all authentication events (login, logout, password changes)
- Log all user management operations (create, update, delete, approve, reject)
- Log all business partner operations
- Log all branch operations
- Include: timestamp, user ID, action, resource, IP address

### 6.6 Email Security
- Use app-specific passwords for Gmail SMTP
- Rate limit email sending
- Validate email addresses before sending
- Include unsubscribe links where applicable

---

## 7. Implementation Priority

### Phase 1: Core Authentication (Week 1)
1. Login/Logout endpoints
2. JWT token generation and validation
3. Password reset flow
4. Session management

### Phase 2: User Management (Week 2)
1. User CRUD operations
2. Role management
3. Password policy configuration
4. First-login password reset

### Phase 3: Business Partner (Week 3)
1. Business partner CRUD
2. Multi-branch management
3. Auto user creation workflow
4. Approval workflows

### Phase 4: Sub-Users & Data Isolation (Week 4)
1. Sub-user invitation and acceptance
2. Branch-based data isolation
3. Consolidated reporting support

### Phase 5: Email & Polish (Week 5)
1. Email notification service
2. Email templates
3. Audit logging
4. Testing and bug fixes

---

## 8. Testing Requirements

### 8.1 Unit Tests
- Password validation
- JWT token generation/validation
- Session timeout logic
- Data isolation filters

### 8.2 Integration Tests
- Complete login flow
- User creation from business partner
- Sub-user invitation flow
- Branch-based data access

### 8.3 Security Tests
- SQL injection attempts
- XSS attempts
- CSRF protection
- Rate limiting
- Password brute-force protection

---

## 9. Configuration

### 9.1 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rnrl_tradehub
DB_USER=root
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_EXPIRY=1800  # 30 minutes in seconds
JWT_REFRESH_EXPIRY=604800  # 7 days in seconds

# Session
SESSION_TIMEOUT_MINUTES=30
SESSION_MAX_DURATION_HOURS=12
SESSION_WARNING_MINUTES=5

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_PREVENT_REUSE=5
PASSWORD_EXPIRY_DAYS=90
PASSWORD_MAX_ATTEMPTS=5
PASSWORD_LOCKOUT_MINUTES=30

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@rnrltradehub.com
SMTP_PASS=app_specific_password
EMAIL_FROM_NAME=RNRL TradeHub
EMAIL_FROM_ADDRESS=noreply@rnrltradehub.com

# Application
APP_URL=https://tradehub.rnrl.com
FRONTEND_URL=https://app.tradehub.rnrl.com
```

---

## 10. API Rate Limiting

Apply rate limits to prevent abuse:

- **Login**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 requests per hour per email
- **Email Sending**: 10 emails per hour per user
- **API Calls**: 100 requests per minute per user

---

## 11. Monitoring & Alerts

### 11.1 Metrics to Track
- Failed login attempts
- Active sessions count
- Password reset requests
- User creation requests
- Email delivery success/failure

### 11.2 Alerts
- Alert on >10 failed logins from same IP in 5 minutes
- Alert on password reset token generation spike
- Alert on email delivery failures
- Alert on database connection issues

---

This document should serve as a comprehensive guide for backend implementation. All frontend components are built to work with these API specifications.
