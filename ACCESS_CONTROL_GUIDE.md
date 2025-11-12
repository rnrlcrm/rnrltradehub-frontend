# Access Control & Security Features - User Guide

## Overview

The RNRL TradeHub system includes a comprehensive access control framework with automated user management, role-based permissions, multi-branch access control, and approval workflows.

## Key Features

### 1. Multi-Level User Types

The system supports three types of users:

#### Back Office Users
- Internal company staff
- Full system access based on assigned role
- Can manage business partners and external users
- Examples: Admin, Sales, Accounts, Dispute Manager

#### Business Partner Users
- External companies (clients, vendors, traders)
- Auto-created when business partner is approved
- Access limited to their own data and transactions
- Can invite sub-users (up to 2 employees)

#### Sub-Users
- Employees of business partners
- Invited by their parent user
- Inherit branch access from parent
- Can have custom permission restrictions

### 2. Role-Based Access Control (RBAC)

#### Pre-defined Roles
- **Super Admin** - Full system access
- **Admin** - All modules except super admin functions
- **Sales** - Sales contracts, vendors/clients, reports
- **Accounts** - Invoicing, payments, commissions, financial reports
- **Dispute Manager** - Contract disputes and resolutions
- **Vendor/Client** - Read-only access to own transactions

#### Custom Roles
- Admins can create custom roles
- Assign specific module permissions
- Control create, read, update, delete actions per module

### 3. Multi-Branch Access Control

#### Branch-Level Isolation
- Users can be restricted to specific branches
- Empty branchIds array = access to all branches
- Users only see data from their assigned branches
- Automatic data filtering in all queries

#### Use Cases
- Regional offices with separate data
- Multi-location business partners
- Parent companies with subsidiary access
- Data privacy and compliance requirements

### 4. Approval Workflows

#### User Creation Approvals
- New user accounts require admin approval
- Auto-created users from business partners need verification
- Approval includes user details review
- Rejection requires reason documentation

#### User Modification Approvals
- Role changes require approval
- Permission changes require approval
- Branch access changes require approval
- Maintains audit trail of all changes

### 5. Sub-User Management

#### Invitation Process
1. Parent user creates invite with email and permissions
2. System sends invitation email with unique token
3. Invited user accepts and sets password
4. Sub-user account activated with specified permissions

#### Limitations
- Maximum 2 sub-users per business partner
- Sub-users inherit parent's branch access
- Cannot invite additional sub-users
- Can have custom permission restrictions

### 6. Automated Features

#### Auto-User Creation
When a business partner is approved:
- User account automatically created
- Email sent with temporary password
- Forced password reset on first login
- Branch access automatically assigned

#### Password Management
- Minimum 8 characters
- Must include: uppercase, lowercase, numbers, special characters
- Passwords expire after 90 days
- Cannot reuse last 5 passwords
- Account locks after 5 failed attempts (30-minute lockout)

#### Session Management
- 30-minute inactivity timeout
- Warning shown 5 minutes before expiration
- 12-hour absolute maximum session duration
- Automatic logout on session expiry

### 7. Security Features

#### Authentication
- JWT token-based authentication
- Token refresh mechanism
- Secure password hashing (bcrypt)
- Failed login attempt tracking

#### Data Isolation
- Automatic filtering by branch access
- Business partner users see only their data
- Sub-users restricted to parent's scope
- API-level access control validation

#### Audit Trail
- All user actions logged
- Login/logout tracking with IP address
- Permission changes tracked
- Data modifications recorded
- Approval decisions logged

## Access Control Dashboard

### Navigation
Admin users can access the Access Control Dashboard from the sidebar menu.

### Users Tab

**Features:**
- View all system users
- Filter by user type (Back Office, Business Partner, Sub-User)
- Filter by status (Active, Inactive, Suspended, Pending Approval)
- Search by name or email
- Suspend/activate user accounts
- View branch assignments

**Actions:**
- **Suspend User** - Temporarily disable account with reason
- **Activate User** - Re-enable suspended account
- **View Details** - See full user information

### Roles & Permissions Tab

**Features:**
- View all system roles
- See role descriptions
- View permission count per role
- System roles marked clearly
- Role type indicated (Back Office, Business Partner)

**Note:** Role creation and editing will be available in future updates.

### Pending Approvals Tab

**Features:**
- View all pending approval requests
- See request details and context
- Approve with optional notes
- Reject with mandatory reason
- Badge shows count of pending items

**Request Types:**
- User creation
- User modification
- Role assignment
- Permission changes

### Branch Access Tab

**Features:**
- View users with branch restrictions
- See number of branches per user
- Identify users with full access
- Understand data isolation setup

## Best Practices

### User Management
1. Always verify business partner details before approving
2. Use descriptive rejection reasons for audit trail
3. Review pending approvals regularly
4. Suspend users instead of deleting when possible
5. Document permission changes in approval notes

### Role Assignment
1. Use least privilege principle
2. Create custom roles for specific needs
3. Review role permissions quarterly
4. Document role purposes clearly
5. Test role permissions before assigning

### Branch Access
1. Document branch assignment rationale
2. Review branch access quarterly
3. Update when organizational structure changes
4. Test data isolation after changes
5. Maintain separation between regions

### Security
1. Enforce strong password policies
2. Review audit logs regularly
3. Investigate failed login attempts
4. Monitor for suspicious activity
5. Update security policies as needed

## Troubleshooting

### User Cannot Login
- Check if user status is "Active"
- Verify password hasn't expired
- Check if account is locked (5 failed attempts)
- Confirm user email is correct
- Check if approval is pending

### User Missing Data
- Verify branch assignments
- Check role permissions
- Confirm data isolation rules
- Review filter settings
- Check if parent user has access (for sub-users)

### Approval Not Received
- Check spam/junk folder for emails
- Verify email address is correct
- Check approval workflow status
- Contact admin for manual approval
- Check system logs for errors

## Support

For technical support or questions about access control:
- Contact: admin@rnrl.com
- Phone: +91-XXXXXXXXXX
- Support Portal: https://support.rnrl.com

## API Integration

For developers integrating with the access control API, see:
- [Backend API Requirements](BACKEND_API_REQUIREMENTS.md)
- [Access Control API Documentation](docs/ACCESS_CONTROL_API.md)
- [Multi-Tenant Implementation Guide](MULTI_TENANT_IMPLEMENTATION.md)

---

**Document Version:** 1.0  
**Last Updated:** November 12, 2024  
**Prepared By:** RNRL TradeHub Development Team
