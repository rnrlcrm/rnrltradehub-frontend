# Backend Requirements Update

## Overview
This document provides an updated assessment of backend requirements based on the existing system infrastructure. PostgreSQL database is already set up and the system has existing modules operational.

## Current System Status

### ✅ Already Implemented (Existing Modules)
Based on the frontend code analysis, the following backend infrastructure exists:

1. **PostgreSQL Database** - ✅ Already setup
2. **Backend API Server** - ✅ Running at: `https://erp-nonprod-backend-502095789065.us-central1.run.app`
3. **Authentication System** - ✅ Token-based auth exists
4. **Organizations Management** - ✅ Multi-tenant support exists
5. **Settings Module** - ✅ Comprehensive settings API exists:
   - Master data (trade types, bargain types, varieties, etc.)
   - GST rates
   - Locations
   - Commissions
   - Delivery terms
   - Payment terms
   - CCI terms

### 🆕 New Modules Required (This PR)
This PR adds NEW modules for enhanced access control and business partner management:

1. **Enhanced Access Control**
2. **Business Partner with Multi-Branch**
3. **Self-Service Onboarding**
4. **User Profile & KYC Management**
5. **Amendment System with Version Control**
6. **Dynamic RBAC System**
7. **Automation Services**
8. **Security Services**

---

## Backend Implementation Required

### Phase 1: Database Schema Extensions (Week 1-2)

#### 1.1 Enhanced User Management Tables

```sql
-- Extend existing users table or create enhanced_users
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_partner_id UUID REFERENCES business_partners(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'back_office';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_expiry_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- User branch assignments
CREATE TABLE IF NOT EXISTS user_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES business_branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, branch_id)
);

-- Sub-users (max 2 per parent)
CREATE TABLE IF NOT EXISTS sub_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sub_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(sub_user_id),
  CHECK (parent_user_id != sub_user_id)
);

-- Enforce max 2 sub-users per parent
CREATE OR REPLACE FUNCTION check_max_sub_users()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM sub_users 
      WHERE parent_user_id = NEW.parent_user_id AND is_active = true) >= 2 THEN
    RAISE EXCEPTION 'Maximum 2 sub-users allowed per parent user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_sub_users
  BEFORE INSERT ON sub_users
  FOR EACH ROW
  EXECUTE FUNCTION check_max_sub_users();
```

#### 1.2 Business Partners with Multi-Branch

```sql
-- Enhanced business partners
CREATE TABLE IF NOT EXISTS business_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(50) NOT NULL, -- BUYER, SELLER, TRADER, SUB_BROKER, TRANSPORTER, CONTROLLER
  legal_name VARCHAR(255) NOT NULL,
  pan VARCHAR(10) NOT NULL,
  cin VARCHAR(21),
  registered_address JSONB NOT NULL,
  contact_person JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE
  approval_status VARCHAR(50) DEFAULT 'PENDING',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id)
);

-- Business branches (multi-branch support)
CREATE TABLE IF NOT EXISTS business_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES business_partners(id) ON DELETE CASCADE,
  branch_code VARCHAR(50) NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  state VARCHAR(100) NOT NULL,
  gst_number VARCHAR(15) UNIQUE NOT NULL,
  address JSONB NOT NULL,
  contact_person JSONB,
  bank_details JSONB,
  is_head_office BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(partner_id, branch_code)
);

-- Ensure only one head office per partner
CREATE UNIQUE INDEX idx_one_head_office_per_partner 
  ON business_branches(partner_id) 
  WHERE is_head_office = true;
```

#### 1.3 Amendment System with Version Control

```sql
-- Amendment requests
CREATE TABLE IF NOT EXISTS amendment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- business_partner, branch, user
  entity_id UUID NOT NULL,
  request_type VARCHAR(50) NOT NULL, -- UPDATE, DELETE
  reason TEXT NOT NULL,
  justification TEXT,
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  changes JSONB NOT NULL, -- old_values and new_values
  impact_assessment JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Version history for business partners
CREATE TABLE IF NOT EXISTS business_partner_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES business_partners(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data JSONB NOT NULL, -- Complete partner data at this version
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  amendment_request_id UUID REFERENCES amendment_requests(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_to TIMESTAMP,
  UNIQUE(partner_id, version)
);
```

#### 1.4 Self-Service Onboarding

```sql
-- Self-onboarding applications
CREATE TABLE IF NOT EXISTS onboarding_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number VARCHAR(50) UNIQUE NOT NULL,
  company_info JSONB NOT NULL,
  contact_info JSONB NOT NULL,
  compliance_info JSONB NOT NULL,
  branch_info JSONB,
  documents JSONB,
  status VARCHAR(50) DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.5 User Profile & KYC Management

```sql
-- User profile update requests
CREATE TABLE IF NOT EXISTS profile_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  partner_id UUID REFERENCES business_partners(id),
  update_type VARCHAR(50) NOT NULL, -- CONTACT, ADDRESS, COMPLIANCE, DOCUMENT, BRANCH
  old_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KYC verification records
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES business_partners(id),
  verification_date DATE NOT NULL,
  verified_by UUID NOT NULL REFERENCES users(id),
  documents_checked JSONB NOT NULL, -- List of documents verified
  status VARCHAR(50) NOT NULL, -- CURRENT, DUE_SOON, OVERDUE
  next_due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KYC reminder logs
CREATE TABLE IF NOT EXISTS kyc_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES business_partners(id),
  reminder_type VARCHAR(50) NOT NULL, -- 30_DAYS, 15_DAYS, 7_DAYS, 1_DAY, OVERDUE
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recipient_email VARCHAR(255) NOT NULL
);
```

#### 1.6 Dynamic RBAC System

```sql
-- Custom modules (extensible)
CREATE TABLE IF NOT EXISTS custom_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom permissions
CREATE TABLE IF NOT EXISTS custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES custom_modules(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, READ, UPDATE, DELETE, EXECUTE, APPROVE
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id, permission_key, action)
);

-- Role permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES custom_permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- User-specific permission overrides
CREATE TABLE IF NOT EXISTS user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES custom_permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL,
  reason TEXT,
  granted_by UUID REFERENCES users(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission_id)
);
```

#### 1.7 Audit Trail & Activity Monitoring

```sql
-- Comprehensive audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB, -- country, city, coordinates
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255)
);

-- Create index for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Activity monitoring for suspicious behavior
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL, -- RAPID_FIRE, GEO_ANOMALY, AFTER_HOURS, UNUSUAL_ACTION
  details JSONB NOT NULL,
  risk_score INTEGER NOT NULL, -- 0-100
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  action_taken TEXT
);
```

---

### Phase 2: API Endpoints (Week 3-5)

All API endpoints are documented in `BACKEND_INTEGRATION_REQUIREMENTS.md`. Key endpoints needed:

#### 2.1 Authentication & Session Management
- `POST /api/auth/login` - Login with JWT
- `POST /api/auth/logout` - Logout and invalidate session
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/password-reset` - Reset password (first login)
- `POST /api/auth/session/activity` - Track user activity
- `GET /api/auth/session/validate` - Validate session

#### 2.2 Access Control & User Management
- `GET /api/users` - List users (with data isolation)
- `POST /api/users` - Create user (manual by admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user
- `POST /api/users/:id/sub-users` - Add sub-user
- `GET /api/users/:id/permissions` - Get user permissions
- `POST /api/users/approve/:id` - Approve user

#### 2.3 Business Partners
- `GET /api/business-partners` - List partners (filtered by org)
- `POST /api/business-partners` - Create partner
- `PUT /api/business-partners/:id` - Update partner (requires approval)
- `DELETE /api/business-partners/:id` - Soft delete
- `POST /api/business-partners/:id/approve` - Approve partner
- `GET /api/business-partners/:id/branches` - List branches
- `POST /api/business-partners/:id/branches` - Add branch
- `PUT /api/business-partners/:id/branches/:branchId` - Update branch

#### 2.4 Self-Service Onboarding
- `POST /api/onboarding/apply` - Submit application
- `GET /api/onboarding/status/:applicationNumber` - Check status
- `GET /api/onboarding/applications` - List all applications (admin)
- `POST /api/onboarding/applications/:id/review` - Review application

#### 2.5 User Profile & KYC
- `GET /api/profile` - Get current user profile
- `POST /api/profile/update-request` - Request profile update
- `GET /api/profile/update-requests` - List pending requests (admin)
- `POST /api/profile/update-requests/:id/review` - Review request
- `GET /api/kyc/due` - List partners with KYC due
- `POST /api/kyc/verify/:partnerId` - Verify KYC
- `GET /api/kyc/history/:partnerId` - KYC history

#### 2.6 Amendment System
- `POST /api/amendments/request` - Request amendment
- `GET /api/amendments` - List amendment requests
- `POST /api/amendments/:id/review` - Approve/reject amendment
- `GET /api/amendments/impact/:entityId` - Get impact assessment

#### 2.7 Dynamic RBAC
- `GET /api/rbac/modules` - List all modules
- `POST /api/rbac/modules` - Add custom module
- `GET /api/rbac/permissions` - List all permissions
- `POST /api/rbac/permissions` - Add custom permission
- `GET /api/rbac/roles/:roleId/permissions` - Get role permissions
- `PUT /api/rbac/roles/:roleId/permissions` - Update role permissions

---

### Phase 3: Automation Services (Week 6)

#### 3.1 User Auto-Creation Service
```typescript
// When business partner is approved, automatically:
// 1. Create user account
// 2. Generate secure password
// 3. Assign to all partner branches
// 4. Send welcome email with credentials
// 5. Log audit trail
```

#### 3.2 KYC Reminder Scheduler
```typescript
// Daily job (9 AM):
// 1. Check all partners for KYC due dates
// 2. Send reminders (30/15/7/1 days before)
// 3. Escalate overdue to admin
// 4. Lock accounts if severely overdue (>30 days)
// 5. Log all reminders
```

#### 3.3 Data Validation Service
```typescript
// Real-time validation:
// - PAN format and checksum
// - GST format and state extraction
// - Phone number format
// - Email format and domain
```

#### 3.4 Auto-Approval Service
```typescript
// For low-risk requests:
// - Calculate risk score (0-100)
// - Auto-approve if score < 20
// - Require manual review if score >= 20
// - Complete audit trail
```

---

### Phase 4: Email Integration (Week 7)

#### 4.1 Gmail SMTP Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_APP_PASSWORD=your-app-password
```

#### 4.2 Email Templates Required
1. Welcome email (new user with credentials)
2. Password reset email
3. KYC reminder email
4. Approval notification email
5. Rejection notification email
6. Sub-user invitation email
7. KYC due soon alert
8. KYC overdue alert

---

### Phase 5: Security Implementation (Week 8)

#### 5.1 Rate Limiting
```typescript
// Implement using Redis:
// - 100 requests per minute per user
// - Sliding window algorithm
// - Different limits for different endpoints
```

#### 5.2 Activity Monitoring
```typescript
// Real-time monitoring:
// - Detect geo-location anomalies
// - Detect after-hours access
// - Detect rapid-fire requests
// - Auto-alert admin for suspicious activity
```

#### 5.3 Data Encryption
```typescript
// Encrypt sensitive fields at rest:
// - Bank account numbers
// - PAN numbers
// - Phone numbers
// - Email addresses (optional)
// Use AES-256-GCM
```

---

### Phase 6: Testing & Deployment (Week 9)

#### 6.1 API Testing
- Unit tests for all endpoints
- Integration tests for workflows
- Load testing (1000 concurrent users)
- Security testing (OWASP Top 10)

#### 6.2 Database Migration
- Create migration scripts
- Test on staging database
- Backup production database
- Run migration with rollback plan

#### 6.3 Deployment
- Deploy to non-prod environment
- Run integration tests
- Deploy to production
- Monitor for issues

---

## Integration with Existing System

### DO NOT TOUCH (Existing Modules)
These modules are already working and should remain unchanged:
- Organizations management
- Master data (trade types, varieties, etc.)
- GST rates
- Locations
- Commissions
- Delivery terms
- Payment terms
- CCI terms
- Existing user management (if any)

### EXTEND (Add to Existing)
These areas need to be extended:
- Users table (add new columns)
- Authentication (add session management)
- Roles (add custom permissions)

### CREATE NEW (This PR)
These are completely new:
- Business partners with multi-branch
- Amendment system
- Self-service onboarding
- Profile update requests
- KYC verification
- Dynamic RBAC
- Automation services
- Enhanced security services

---

## Environment Variables Required

```env
# Database (already configured)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=1800
JWT_REFRESH_EXPIRY=604800

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_APP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@rnrltradehub.com
SMTP_FROM_NAME=RNRL Trade Hub

# Redis (for caching and rate limiting)
REDIS_URL=redis://localhost:6379

# Security
SESSION_TIMEOUT=1800000
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION=3600000

# API Configuration
API_BASE_URL=https://erp-nonprod-backend-502095789065.us-central1.run.app
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# Monitoring
ENABLE_ACTIVITY_MONITORING=true
ENABLE_AUDIT_LOGGING=true
```

---

## Timeline Summary

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | Week 1-2 | Database schema extensions |
| Phase 2 | Week 3-5 | API endpoints implementation |
| Phase 3 | Week 6 | Automation services |
| Phase 4 | Week 7 | Email integration |
| Phase 5 | Week 8 | Security implementation |
| Phase 6 | Week 9 | Testing & deployment |

**Total: 9 weeks**

---

## Testing Requirements

### Unit Tests (Target: 80% coverage)
- All API endpoints
- All service functions
- All validation functions

### Integration Tests
- Complete user onboarding flow
- Partner creation → User creation → Email sent
- KYC verification workflow
- Amendment approval workflow

### E2E Tests
- User self-registration → Approval → Login → Password change
- Business partner CRUD operations
- Multi-branch operations
- Deal access control verification

---

## Success Criteria

### Functional Requirements
✅ Users can self-register (frontend complete, backend needed)
✅ Business partners auto-create users (frontend complete, backend needed)
✅ Multi-branch support working (frontend complete, backend needed)
✅ Amendment system with version control (frontend complete, backend needed)
✅ KYC reminders sent automatically (frontend complete, backend needed)
✅ Data isolation enforced (frontend complete, backend needed)
✅ All security features operational (frontend complete, backend needed)

### Performance Requirements
✅ Login < 1 second
✅ API response < 500ms
✅ Session management working with 30-min timeout
✅ Email delivery < 5 seconds
✅ Background jobs running on schedule

### Security Requirements
✅ Zero unauthorized access
✅ Complete audit trail
✅ Data encryption at rest
✅ Rate limiting operational
✅ Activity monitoring active
✅ Security score > 90/100

---

## Contact & Support

For questions or clarifications on backend implementation:
1. Review `BACKEND_INTEGRATION_REQUIREMENTS.md` for complete API specs
2. Review `AUTOMATION_GUIDE.md` for automation workflows
3. Review `COMPREHENSIVE_REVIEW_AND_RECOMMENDATIONS.md` for security guidelines
4. Use the test script `test-backend.sh` to verify API implementation

---

**Note:** This is a comprehensive NEW module implementation that builds ON TOP of the existing system. The existing modules (organizations, master data, settings) remain unchanged. This PR focuses on access control, business partners, and automation - which are separate concerns from the existing trading and inventory management features.
