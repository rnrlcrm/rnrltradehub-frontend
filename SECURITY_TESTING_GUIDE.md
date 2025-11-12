# Security & Access Control Testing Guide

## Test Environment Setup

### Prerequisites
1. Backend API running at configured URL
2. Test admin account credentials
3. Test business partner accounts
4. Test sub-user accounts
5. Multiple test branches configured

### Environment Variables
```bash
VITE_API_BASE_URL=https://erp-nonprod-backend-502095789065.us-central1.run.app
VITE_USE_MOCK_API=false
```

## Authentication Tests

### Test 1: Login with Valid Credentials
**Steps:**
1. Navigate to login page
2. Enter valid email and password
3. Click "Sign In"

**Expected Result:**
- Successful login
- Redirect to dashboard
- JWT token stored in localStorage
- Session started with 30-minute timeout

**Validation:**
```javascript
localStorage.getItem('access_token') !== null
localStorage.getItem('current_user') !== null
```

### Test 2: Login with Invalid Credentials
**Steps:**
1. Navigate to login page
2. Enter invalid password
3. Click "Sign In"

**Expected Result:**
- Error message displayed
- No redirect
- No token stored
- Failed attempt logged

### Test 3: Account Lockout After Failed Attempts
**Steps:**
1. Attempt login with wrong password 5 times
2. Try 6th login attempt

**Expected Result:**
- Account locked after 5th attempt
- Error message: "Account locked for 30 minutes"
- User cannot login even with correct password
- Lock expires after 30 minutes

### Test 4: Session Timeout
**Steps:**
1. Login successfully
2. Wait 25 minutes (inactive)
3. Observe warning at 25 minutes
4. Wait 5 more minutes

**Expected Result:**
- Warning shown at 25 minutes (5 min before timeout)
- Auto-logout after 30 minutes
- Redirect to login page
- Session cleared from storage

### Test 5: Password Reset on First Login
**Steps:**
1. Login with newly created user (isFirstLogin=true)
2. Observe forced password change

**Expected Result:**
- Redirect to password reset page
- Cannot access other pages
- Must set new password
- Password validation enforced

## Authorization Tests

### Test 6: Admin Access to All Modules
**Steps:**
1. Login as Admin user
2. Navigate to each module

**Expected Result:**
- All modules visible in sidebar
- Can access all pages
- All actions available (CRUD)

### Test 7: Sales Role Restrictions
**Steps:**
1. Login as Sales user
2. Try to access User Management
3. Try to access Settings

**Expected Result:**
- User Management not visible in sidebar
- Settings not accessible
- "Access Denied" message if direct URL attempted

### Test 8: Business Partner Data Isolation
**Steps:**
1. Login as Business Partner user (Partner A)
2. View contracts list
3. View invoices list

**Expected Result:**
- Only Partner A's contracts visible
- Only Partner A's invoices visible
- Cannot see other partners' data
- API returns filtered results

### Test 9: Multi-Branch Access Control
**Steps:**
1. Create user with access to Branch 1 only
2. Login as that user
3. View transactions

**Expected Result:**
- Only Branch 1 transactions visible
- Branch filter shows only Branch 1
- Cannot switch to other branches
- API filters by branch automatically

## User Management Tests

### Test 10: Create New Back Office User
**Steps:**
1. Login as Admin
2. Navigate to Access Control Dashboard
3. Click "Create User"
4. Fill form with valid data
5. Save

**Expected Result:**
- User created successfully
- Appears in users list
- Status = "pending_approval"
- Approval request created
- Email sent to new user

### Test 11: Approve Pending User
**Steps:**
1. Login as Admin
2. Navigate to "Pending Approvals" tab
3. Click "Approve" on pending user

**Expected Result:**
- User status changes to "active"
- Approval record updated
- User can now login
- Welcome email sent

### Test 12: Reject Pending User
**Steps:**
1. Login as Admin
2. Navigate to "Pending Approvals" tab
3. Click "Reject" on pending user
4. Enter rejection reason

**Expected Result:**
- User status changes to "rejected"
- Rejection reason saved
- User notified via email
- Audit log entry created

### Test 13: Suspend Active User
**Steps:**
1. Login as Admin
2. Navigate to Users tab
3. Click "Suspend" on active user
4. Enter suspension reason

**Expected Result:**
- User status changes to "suspended"
- User cannot login
- Current sessions terminated
- Audit log entry created

### Test 14: Activate Suspended User
**Steps:**
1. Login as Admin
2. Navigate to Users tab
3. Click "Activate" on suspended user

**Expected Result:**
- User status changes to "active"
- User can login again
- Audit log entry created

## Sub-User Tests

### Test 15: Invite Sub-User
**Steps:**
1. Login as Business Partner user
2. Navigate to "My Team" section
3. Click "Invite Sub-User"
4. Enter email and permissions
5. Send invitation

**Expected Result:**
- Invitation created
- Email sent to invitee
- Unique token generated
- Expiry set to 7 days

### Test 16: Accept Sub-User Invitation
**Steps:**
1. Open invitation email
2. Click invitation link
3. Set password
4. Complete registration

**Expected Result:**
- Sub-user account created
- Password validated against policy
- Branch access inherited from parent
- Can login successfully

### Test 17: Sub-User Permission Restrictions
**Steps:**
1. Login as sub-user with limited permissions
2. Try to access restricted modules

**Expected Result:**
- Only permitted modules visible
- Access denied to restricted modules
- API enforces permission checks

### Test 18: Sub-User Limit Enforcement
**Steps:**
1. Login as Business Partner with 2 sub-users
2. Try to invite 3rd sub-user

**Expected Result:**
- Error message: "Sub-user limit reached"
- Cannot create more invitations
- Existing sub-users must be deleted first

## Role & Permission Tests

### Test 19: View All Roles
**Steps:**
1. Login as Admin
2. Navigate to "Roles & Permissions" tab

**Expected Result:**
- All system roles displayed
- Role descriptions visible
- Permission count shown
- System roles marked

### Test 20: Custom Role Creation
**Steps:**
1. Login as Admin
2. Create new custom role
3. Select specific permissions
4. Save role

**Expected Result:**
- Custom role created
- Permissions saved correctly
- Role appears in role list
- Can be assigned to users

### Test 21: Role Permission Enforcement
**Steps:**
1. Create role with only "read" permission
2. Assign to test user
3. Login as test user
4. Try to create/edit/delete data

**Expected Result:**
- Can view data
- Cannot create new records
- Cannot edit existing records
- Cannot delete records

## Branch Access Tests

### Test 22: Branch Filter in Data Queries
**Steps:**
1. Create user with Branch 1 access only
2. Login as that user
3. Query contracts API

**Expected Result:**
- API response contains only Branch 1 data
- No Branch 2 or 3 data visible
- Filter applied automatically
- Cannot override filter

### Test 23: Cross-Branch Data Access Prevention
**Steps:**
1. Login as Branch 1 user
2. Try to access Branch 2 data via API
3. Try direct URL with Branch 2 ID

**Expected Result:**
- API returns 403 Forbidden
- "Access Denied" error message
- No data leaked
- Attempt logged in audit trail

## Security Tests

### Test 24: Password Policy Enforcement
**Steps:**
1. Try to set password: "password"
2. Try to set password: "12345678"
3. Try to set password: "Password1!"

**Expected Result:**
- First two rejected (too weak)
- Third one accepted (meets policy)
- Clear error messages shown
- All requirements explained

### Test 25: Password Reuse Prevention
**Steps:**
1. Change password to "NewPass123!"
2. Try to change back to previous password

**Expected Result:**
- Error: "Cannot reuse recent passwords"
- Last 5 passwords blocked
- Must use different password

### Test 26: Session Hijacking Prevention
**Steps:**
1. Login and copy access token
2. Logout
3. Try to use copied token in API request

**Expected Result:**
- Token invalidated on logout
- API returns 401 Unauthorized
- Must login again to get new token

### Test 27: CSRF Protection
**Steps:**
1. Create malicious form on external site
2. Try to submit to API endpoint

**Expected Result:**
- Request rejected
- CSRF token mismatch
- No action performed

## Audit Trail Tests

### Test 28: Login Audit Logging
**Steps:**
1. Login successfully
2. Check audit logs

**Expected Result:**
- Login event logged
- Timestamp recorded
- IP address captured
- User agent recorded

### Test 29: User Action Audit Logging
**Steps:**
1. Create/edit/delete record
2. Check audit logs

**Expected Result:**
- Action logged with details
- Before/after values captured
- User ID and name recorded
- Timestamp and reason saved

### Test 30: Approval Decision Audit Logging
**Steps:**
1. Approve/reject approval request
2. Check audit logs

**Expected Result:**
- Decision logged
- Approver details recorded
- Reason/notes saved
- Full context preserved

## Performance Tests

### Test 31: Large User List Loading
**Steps:**
1. Navigate to Users tab with 1000+ users
2. Observe load time

**Expected Result:**
- Page loads in < 3 seconds
- Pagination working
- Filtering responsive
- No UI freezing

### Test 32: Concurrent User Sessions
**Steps:**
1. Login with 50 different users simultaneously
2. Perform actions concurrently

**Expected Result:**
- All sessions maintained
- No conflicts or race conditions
- Data isolation preserved
- No performance degradation

## Integration Tests

### Test 33: Backend API Integration
**Steps:**
1. Run `npm run build`
2. Check for errors
3. Start dev server
4. Test all API endpoints

**Expected Result:**
- Build successful
- No TypeScript errors
- All API calls work
- Proper error handling

### Test 34: End-to-End User Flow
**Steps:**
1. Admin creates business partner
2. System auto-creates user
3. User receives email
4. User logs in (first login)
5. User resets password
6. User invites sub-user
7. Sub-user accepts invitation
8. Both access their data

**Expected Result:**
- Complete flow works end-to-end
- All emails delivered
- All access controls enforced
- Data properly isolated

## Automated Testing

### Running Unit Tests
```bash
npm run test:run
```

**Expected: All tests pass (12/12)**

### Running Build
```bash
npm run build
```

**Expected: Build successful, no errors**

### Running Linter
```bash
npm run lint
```

**Expected: No linting errors**

## Test Reporting

### Test Results Format
```
Test ID: TEST-XX
Test Name: [Name]
Status: ✅ PASS / ❌ FAIL
Date: YYYY-MM-DD
Tester: [Name]
Notes: [Any observations]
```

### Critical Issues Checklist
- [ ] Authentication bypass possible?
- [ ] Unauthorized data access possible?
- [ ] Session hijacking possible?
- [ ] Data leakage between branches?
- [ ] Permission checks working?
- [ ] Audit trail complete?

## Test Coverage Goals

- Authentication: 100%
- Authorization: 100%
- User Management: 95%
- Role Management: 95%
- Branch Access: 100%
- Audit Trail: 100%
- API Security: 100%

## Next Steps After Testing

1. Document all test results
2. Log any bugs found
3. Fix critical security issues immediately
4. Plan fixes for non-critical issues
5. Re-test after fixes
6. Get security review approval
7. Deploy to production

---

**Document Version:** 1.0  
**Last Updated:** November 12, 2024  
**Status:** Ready for Testing
