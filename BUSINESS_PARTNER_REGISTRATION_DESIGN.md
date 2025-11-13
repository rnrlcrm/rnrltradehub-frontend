# Business Partner Registration System - Comprehensive Design Document

## 📋 Executive Summary

This document outlines the complete design for the Business Partner Registration System for RNRL TradeHub. The system supports six types of business partners (Buyer, Seller, Trader, Controller, Transporter, Sub-Broker) with varying compliance requirements, multi-branch structure, document management, user onboarding, approval workflows, and annual KYC requirements.

**Status:** 🔴 Design Phase - Awaiting Review and Approval  
**Last Updated:** November 13, 2025  
**Version:** 1.1

---

## 🎯 Problem Statement Summary

### Business Requirements

1. **Partner Types & GST Requirements**
   - **Buyer, Seller, Trader**: GST mandatory
   - **Controller**: GST not mandatory
   - **Transporter**: Optional GST; if no GST, declaration required
   - **Sub-Broker**: Optional GST (can be GST or non-GST)

2. **Core Registration Fields**
   - Legal Name, Business Type, Contact Person/Email/Phone
   - Registered Address
   - Ship-to-Address (multiple or same as registered) - For Buyer/Seller/Trader only
   - PAN Number (mandatory), GST Number (conditional)
   - Bank Name, Account Number, IFSC Code
   - Aadhar Number (for individuals)

3. **Multi-Branch Structure**
   - Each branch has its own: GST Number, Address, Contact Person, Banking Details
   - All branches linked to main business partner record

4. **Document Requirements**
   - **Mandatory for all**: PAN card, Cancelled check
   - **Buyer/Seller/Trader with GST**: GST certificate
   - **Transporter without GST**: Declaration document
   - **Individuals**: Aadhar card

5. **User Management**
   - Primary user from contact email
   - Option to add 2 additional sub-users
   - Sub-users with defined permissions

6. **Multi-Organization Support**
   - Business partner reflects across all organizations
   - Reduces back-office manual work

7. **Approval Workflow**
   - Registration → Pending Approval → Approved/Rejected
   - Welcome email with login credentials on approval
   - Annual KYC requirement
   - Amendment requests require re-approval
   - Ongoing contracts not affected by amendments

8. **Registration Entry Points** ⭐ NEW
   - **Self-Service**: User can onboard from main page by clicking "Become a Partner"
   - **Back Office**: Back office staff can also perform registration

9. **Security & Compliance**
   - IT policies, Security policies, Data protection act compliance

---

## 🔄 Registration Entry Points

### 1. Self-Service via Main Page (Public Access)

**User Journey:**
```
User visits main page (no login required)
  ↓
Sees "Become a Partner" button/link
  ↓
Clicks "Become a Partner"
  ↓
Navigates to /register or /become-partner
  ↓
Multi-step registration wizard
  ↓
Submits application
  ↓
Status: PENDING_APPROVAL
  ↓
Confirmation page with partner code
```

**UI Placement Options for "Become a Partner":**
- **Option A (Recommended)**: Prominent button in hero section + link in navigation
- **Option B**: Only in navigation bar
- **Option C**: Hero section + footer
- **Option D**: Multiple placements (hero, nav, footer)

### 2. Back Office Registration (Authenticated Access)

**User Journey:**
```
Back office user logs in
  ↓
Navigate to Business Partner Management
  ↓
Click "+ Add New Partner"
  ↓
Same registration form as self-service
  ↓
Can save as DRAFT or submit for approval
  ↓
Status: DRAFT or PENDING_APPROVAL
```

**Key Differences:**
| Feature | Self-Service | Back Office |
|---------|-------------|-------------|
| Authentication | Not required | Required |
| Save as Draft | No | Yes |
| Registration Source | `SELF_SERVICE` | `BACK_OFFICE` |
| Created By | `system` or `self` | User ID of staff |

---

## 📊 Core Data Model

### Business Partner

```typescript
interface BusinessPartner {
  id: string;                           // UUID
  partnerCode: string;                  // Auto: BP-YYYY-NNNN
  
  // Registration Source ⭐ NEW
  registrationSource: 'SELF_SERVICE' | 'BACK_OFFICE';
  registeredBy?: string;                // User ID if back office
  
  // Basic Information
  legalName: string;
  tradeName?: string;
  businessType: PartnerType;
  registrationType: 'COMPANY' | 'INDIVIDUAL';
  
  // Contact
  contactPerson: string;
  contactEmail: string;                 // Becomes login email
  contactPhone: string;
  
  // Address
  registeredAddress: Address;
  shipToAddresses: ShipToAddress[];     // For Buyer/Seller/Trader
  
  // Compliance
  pan: string;                          // Mandatory
  gstNumber?: string;                   // Conditional
  hasGST: boolean;
  cin?: string;
  tan?: string;
  aadharNumber?: string;                // For individuals
  
  // Banking
  bankDetails: BankDetails;
  
  // Branches
  branches: BusinessBranch[];
  
  // Status
  status: PartnerStatus;
  approvalStatus: ApprovalStatus;
  
  // KYC
  lastKYCDate?: string;
  nextKYCDate?: string;
  kycStatus: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  
  // Users
  primaryUserId?: string;
  subUsers: SubUser[];
  
  // Documents
  documents: DocumentRecord[];
  
  // Multi-Organization
  organizationIds: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

---

## 🎨 UI/UX Specifications

### Main Page - "Become a Partner" Button

**Recommended Layout:**

```
┌────────────────────────────────────────────────┐
│  RNRL TradeHub        [About] [Contact] [Login]│
│                        👥 [Become a Partner]   │
├────────────────────────────────────────────────┤
│                                                │
│         Welcome to RNRL TradeHub               │
│     The Leading Cotton Trading Platform        │
│                                                │
│   ┌──────────────────────────────────────┐    │
│   │                                      │    │
│   │     [Become a Partner] 🎯           │    │
│   │                                      │    │
│   │  Join our network of cotton traders │    │
│   │  • Easy online registration          │    │
│   │  • Quick approval (2-3 days)         │    │
│   │  • Multi-branch support              │    │
│   │  • Secure & compliant                │    │
│   │                                      │    │
│   └──────────────────────────────────────┘    │
│                                                │
│   [View Benefits] [Success Stories] [FAQ]     │
│                                                │
└────────────────────────────────────────────────┘
```

**Button Styling:**
- Primary color (blue/green)
- Large, prominent size
- Icon (handshake/users)
- Call-to-action text: "Become a Partner" or "Register as Partner"

### Registration Wizard (Same for Both Entry Points)

```
┌────────────────────────────────────────────────┐
│      Business Partner Registration             │
│      Join RNRL TradeHub Network                │
└────────────────────────────────────────────────┘

Progress: [1]━━[2]━━[3]━━[4]━━[5]━━[6]━━[7]
         Company → Contact → Compliance → ...

┌────────────────────────────────────────────────┐
│  Step 1: Company Information                   │
│                                                │
│  Legal Name: [_________________________]       │
│  Trade Name: [_________________________]       │
│  Business Type: [Select ▾]                     │
│  ○ Company  ○ Individual                       │
│                                                │
│            [Cancel]  [Next →]                  │
└────────────────────────────────────────────────┘
```

### Back Office - Partner Management

```
┌────────────────────────────────────────────────┐
│  Business Partners          [+ Add New Partner]│
├────────────────────────────────────────────────┤
│  Filters: Type [All ▾] Status [All ▾]         │
│           Source [All ▾] GST [All ▾]           │
│                                                │
│  Code     | Name | Type | Source | Status     │
│  ─────────────────────────────────────────────│
│  BP-2025-001 | ABC | BUYER | 🌐 Self | Active│
│  BP-2025-002 | XYZ | SELLER| 👤 BO  | Pending│
│                                                │
└────────────────────────────────────────────────┘

Legend: 🌐 Self-Service | 👤 Back Office
```

---

## 🔌 API Endpoints

### Public Endpoints (No Auth Required)

```
POST   /api/partners/register              # Self-service registration
GET    /api/partners/register/check-email  # Check if email exists
```

### Protected Endpoints (Auth Required)

```
POST   /api/partners                       # Back office creation
GET    /api/partners                       # List all partners
GET    /api/partners/:id                   # Get partner details
PUT    /api/partners/:id                   # Update partner
DELETE /api/partners/:id                   # Soft delete

GET    /api/partners/pending-approvals     # Approval queue
POST   /api/partners/:id/approve           # Approve
POST   /api/partners/:id/reject            # Reject
```

---

## 📝 Validation Rules

### GST Requirements by Partner Type

| Partner Type | GST | Declaration if No GST |
|--------------|-----|----------------------|
| BUYER        | ✅ Mandatory | ❌ |
| SELLER       | ✅ Mandatory | ❌ |
| TRADER       | ✅ Mandatory | ❌ |
| CONTROLLER   | ❌ Optional  | ❌ |
| TRANSPORTER  | ⚠️ Optional  | ✅ If no GST |
| SUB_BROKER   | ⚠️ Optional  | ❌ |

### Document Requirements

| Document | All Partners | Buyer/Seller/Trader (GST) | Transporter (No GST) | Individual |
|----------|-------------|---------------------------|---------------------|-----------|
| PAN Card | ✅ | ✅ | ✅ | ✅ |
| Cancelled Check | ✅ | ✅ | ✅ | ✅ |
| GST Certificate | ❌ | ✅ | ❌ | ❌ |
| Declaration | ❌ | ❌ | ✅ | ❌ |
| Aadhar | ❌ | ❌ | ❌ | ✅ |

---

## 🔄 Process Flows

### Self-Service Registration Flow

```
Main Page
  ↓
Click "Become a Partner"
  ↓
Step 1-7: Complete Registration Form
  - Company Info
  - Contact Details
  - Compliance & Address
  - Ship-to Addresses (conditional)
  - Banking Details
  - Document Upload
  - Review & Submit
  ↓
Submit Application
  ↓
Registration Source: SELF_SERVICE
Status: PENDING_APPROVAL
  ↓
Confirmation Page
  - Partner Code: BP-2025-XXXX
  - "Application under review"
  - "Email notification in 2-3 days"
```

### Back Office Registration Flow

```
Login to Back Office
  ↓
Navigate to Partner Management
  ↓
Click "+ Add New Partner"
  ↓
Same Registration Form
  ↓
Options:
  ├─ Save as Draft → Status: DRAFT
  └─ Submit for Approval → Status: PENDING_APPROVAL
  ↓
Registration Source: BACK_OFFICE
Created By: [User ID]
```

### Approval Workflow

```
Pending Approvals Queue
  ↓
Review Application
  - View all details
  - Check documents
  - Verify compliance
  - See registration source (Self/BO)
  ↓
Decision:
  ├─ APPROVE
  │   ↓
  │   Partner Status → ACTIVE
  │   Create User Account
  │   Send Welcome Email
  │   Sync to All Organizations
  │   Set KYC Dates
  │
  └─ REJECT
      ↓
      Enter Rejection Reason
      Send Rejection Email
```

---

## 🔒 Security Considerations

### Self-Service Registration Security

1. **Rate Limiting**
   - Max 5 registration attempts per IP per hour
   - Prevents spam/abuse

2. **Email Verification**
   - Send verification code to email before registration
   - Or verify after submission before approval

3. **CAPTCHA**
   - Add CAPTCHA on registration form
   - Prevents bots

4. **Data Validation**
   - Server-side validation of all inputs
   - Sanitize all user inputs
   - Prevent SQL injection/XSS

5. **Document Upload Security**
   - File type validation
   - File size limits
   - Virus scanning
   - Signed URLs for access

### Back Office Security

1. **Authentication**
   - JWT token-based auth
   - Session timeout

2. **Authorization**
   - Role-based access control
   - Only admin/staff can create partners

3. **Audit Trail**
   - Log all create/update/delete operations
   - Track who registered which partner

---

## 🧪 Testing Checklist

### Self-Service Registration Tests

- [ ] "Become a Partner" button visible on main page
- [ ] Button navigates to registration form
- [ ] All 7 steps complete successfully
- [ ] GST validation per partner type
- [ ] Document upload works
- [ ] Email uniqueness validation
- [ ] Terms & conditions acceptance required
- [ ] Confirmation page displays partner code
- [ ] No authentication required

### Back Office Registration Tests

- [ ] Authentication required to access
- [ ] "+ Add New Partner" button visible
- [ ] Can save as draft
- [ ] Can submit for approval
- [ ] Registration source = BACK_OFFICE
- [ ] Created by = current user ID
- [ ] Same form as self-service

### Approval Tests

- [ ] Both sources visible in approval queue
- [ ] Registration source badge displays correctly
- [ ] Can approve self-service registrations
- [ ] Can approve back office registrations
- [ ] Welcome email sent on approval
- [ ] User account created correctly

---

## 📈 Success Metrics

1. **Registration Funnel**
   - Main page visits
   - "Become a Partner" clicks
   - Registration starts
   - Registration completions
   - Conversion rate

2. **Source Distribution**
   - % Self-service vs % Back office
   - Completion rate by source
   - Approval rate by source

3. **Time Metrics**
   - Average time to complete registration
   - Average approval turnaround time
   - Time from registration to first transaction

4. **Quality Metrics**
   - Rejection rate by source
   - Document verification success rate
   - Data accuracy rate

---

## ❓ Open Questions for Review

### 1. "Become a Partner" Button Placement

**Question:** Where should we place the button on the main page?

**Options:**
- A) Hero section only (most prominent)
- B) Navigation bar only (always visible)
- C) Both hero and navigation (recommended)
- D) Hero, navigation, and footer

**Recommendation:** Option C - Maximum visibility without being intrusive

---

### 2. Email Verification

**Question:** Should we verify email before or after registration?

**Options:**
- A) Before registration (send OTP, then allow form)
- B) After submission, before approval
- C) No verification (rely on approval process)

**Recommendation:** Option B - Balance between security and UX

---

### 3. Registration Source Badge

**Question:** How to visually differentiate sources in the UI?

**Options:**
- A) Icon only (🌐 vs 👤)
- B) Color coding (blue vs orange)
- C) Text label only
- D) Icon + color + text

**Recommendation:** Option A or D depending on space

---

### 4. Draft Capability for Self-Service

**Question:** Should self-service users be able to save drafts?

**Options:**
- A) Yes (requires session management)
- B) No (complete in one session)
- C) Yes, but with email verification first

**Recommendation:** Option B initially, add A in Phase 2

---

### 5. CAPTCHA Implementation

**Question:** Should we add CAPTCHA to registration form?

**Options:**
- A) Yes, on first step
- B) Yes, on last step (before submit)
- C) No CAPTCHA initially
- D) Use invisible CAPTCHA (reCAPTCHA v3)

**Recommendation:** Option D - Best security with minimal UX impact

---

## 🚀 Implementation Plan

### Phase 1: Design & Setup (Week 1)
- [x] Design document with new requirements
- [ ] Review and approval of design
- [ ] Database schema finalization
- [ ] API contract definition

### Phase 2: Core Registration (Week 2-3)
- [ ] Main page updates
  - [ ] Add "Become a Partner" button to hero
  - [ ] Add link to navigation
  - [ ] Style and positioning
- [ ] Registration wizard (7 steps)
- [ ] Validation logic
- [ ] Document upload
- [ ] Registration source tracking

### Phase 3: Back Office (Week 4)
- [ ] Partner management interface
- [ ] "+ Add New Partner" functionality
- [ ] Draft capability
- [ ] Source filtering

### Phase 4: Approval & Users (Week 5)
- [ ] Approval workflow UI
- [ ] Source badges/indicators
- [ ] Welcome email with credentials
- [ ] User account creation

### Phase 5: Testing & Launch (Week 6)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Security testing
- [ ] UAT
- [ ] Production deployment

---

## ✅ Review Checklist

Before implementation:

- [ ] "Become a Partner" button placement approved
- [ ] Registration wizard flow approved
- [ ] GST requirements per type confirmed
- [ ] Document requirements finalized
- [ ] Security measures approved
- [ ] API contracts finalized
- [ ] Database schema approved
- [ ] UI/UX mockups created and approved
- [ ] Testing strategy approved
- [ ] Success metrics defined

---

## 📞 Contact

**Document Owner:** Development Team  
**Version:** 1.1  
**Last Updated:** November 13, 2025  
**Status:** 🔴 Awaiting Review & Approval

**For Questions:** Please create a review comment or contact the team.

---

**END OF DOCUMENT**
