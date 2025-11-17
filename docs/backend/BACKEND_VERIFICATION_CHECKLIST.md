# Backend Integration Verification Checklist

## Overview

This document provides a comprehensive checklist to verify that the backend API is complete and ready for integration with the frontend.

## Backend API Verification

### 1. Server Setup ✓

**Check if backend server is running:**
```bash
# Test if server is accessible
curl http://localhost:3000/api/health
# or
curl https://your-backend-url.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 2. Authentication Endpoints

#### POST /api/auth/login
**Test:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "role": "Admin",
      "name": "Admin User"
    }
  }
}
```

### 3. Organizations Endpoints

#### ✓ GET /api/settings/organizations
```bash
curl http://localhost:3000/api/settings/organizations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### ✓ POST /api/settings/organizations
```bash
curl -X POST http://localhost:3000/api/settings/organizations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Org",
    "code": "TEST01",
    "gstin": "27AABCU9603R1ZM",
    "pan": "AABCU9603R",
    "address": "123 Test St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "phone": "9876543210",
    "email": "test@test.com",
    "website": "https://test.com",
    "bankName": "Test Bank",
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234",
    "branch": "Main Branch",
    "isActive": true
  }'
```

#### ✓ PUT /api/settings/organizations/:id
```bash
curl -X PUT http://localhost:3000/api/settings/organizations/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Org"}'
```

#### ✓ DELETE /api/settings/organizations/:id
```bash
curl -X DELETE http://localhost:3000/api/settings/organizations/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Master Data Endpoints

For each type: `trade-types`, `bargain-types`, `varieties`, `dispute-reasons`, `weightment-terms`, `passing-terms`, `financial-years`

#### ✓ GET /api/settings/master-data/:type
```bash
curl http://localhost:3000/api/settings/master-data/trade-types \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### ✓ POST /api/settings/master-data/:type
```bash
curl -X POST http://localhost:3000/api/settings/master-data/trade-types \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Trade Type"}'
```

#### ✓ PUT /api/settings/master-data/:type/:id
```bash
curl -X PUT http://localhost:3000/api/settings/master-data/trade-types/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Trade Type"}'
```

#### ✓ DELETE /api/settings/master-data/:type/:id
```bash
curl -X DELETE http://localhost:3000/api/settings/master-data/trade-types/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. GST Rates Endpoints

#### ✓ GET /api/settings/gst-rates
#### ✓ POST /api/settings/gst-rates
```bash
curl -X POST http://localhost:3000/api/settings/gst-rates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Cotton Bales",
    "hsnCode": "5201",
    "rate": 5.0
  }'
```
#### ✓ PUT /api/settings/gst-rates/:id
#### ✓ DELETE /api/settings/gst-rates/:id

### 6. Locations Endpoints

#### ✓ GET /api/settings/locations
#### ✓ POST /api/settings/locations
```bash
curl -X POST http://localhost:3000/api/settings/locations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "India",
    "state": "Maharashtra",
    "city": "Mumbai"
  }'
```
#### ✓ DELETE /api/settings/locations/:id

### 7. Commissions Endpoints

#### ✓ GET /api/settings/commissions
#### ✓ POST /api/settings/commissions
```bash
curl -X POST http://localhost:3000/api/settings/commissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard Commission",
    "type": "PERCENTAGE",
    "value": 2.0
  }'
```
#### ✓ PUT /api/settings/commissions/:id
#### ✓ DELETE /api/settings/commissions/:id

### 8. Delivery Terms Endpoints

#### ✓ GET /api/settings/delivery-terms
#### ✓ POST /api/settings/delivery-terms
```bash
curl -X POST http://localhost:3000/api/settings/delivery-terms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ex-Godown",
    "days": 0
  }'
```
#### ✓ PUT /api/settings/delivery-terms/:id
#### ✓ DELETE /api/settings/delivery-terms/:id

### 9. Payment Terms Endpoints

#### ✓ GET /api/settings/payment-terms
#### ✓ POST /api/settings/payment-terms
#### ✓ PUT /api/settings/payment-terms/:id
#### ✓ DELETE /api/settings/payment-terms/:id

### 10. CCI Terms Endpoints

#### ✓ GET /api/settings/cci-terms
#### ✓ POST /api/settings/cci-terms
#### ✓ PUT /api/settings/cci-terms/:id
#### ✓ DELETE /api/settings/cci-terms/:id

## Backend Verification Checklist

### Critical Requirements

- [ ] **Server Running**: Backend server is accessible
- [ ] **Database Connected**: Database is up and migrations are run
- [ ] **Authentication Working**: JWT tokens are generated and validated
- [ ] **CORS Configured**: Frontend domain is allowed
- [ ] **All Endpoints Implemented**: 32+ endpoints are working
- [ ] **Validation Working**: Server-side validation rejects invalid data
- [ ] **Error Handling**: Proper error responses (400, 401, 403, 404, 500)
- [ ] **Duplicate Prevention**: Database constraints prevent duplicates

### Test Each Endpoint

For each endpoint, verify:
- [ ] Returns correct status code
- [ ] Returns data in expected format
- [ ] Handles errors gracefully
- [ ] Validates input properly
- [ ] Prevents duplicates
- [ ] Requires authentication
- [ ] Requires admin role

### Database Verification

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Expected tables:
-- organizations
-- trade_types
-- bargain_types
-- varieties
-- dispute_reasons
-- weightment_terms
-- passing_terms
-- financial_years
-- gst_rates
-- locations
-- commissions
-- delivery_terms
-- payment_terms
-- cci_terms
```

### CORS Configuration

Verify CORS headers allow frontend:
```bash
curl -I http://localhost:3000/api/settings/organizations \
  -H "Origin: http://localhost:5173"

# Should include:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Credentials: true
```

## Frontend Configuration

### 1. Environment Variables

Create `.env` file in frontend root:

```env
# Production API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_API=false

# For production deployment:
# VITE_API_BASE_URL=https://api.yourdomain.com/api
# VITE_USE_MOCK_API=false
```

### 2. Verify API Client Configuration

Check that `src/api/client.ts` reads from environment:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
```

### 3. Test Frontend Connection

1. Start frontend: `npm run dev`
2. Login as Admin
3. Go to Settings page
4. Try to create/edit/delete an item
5. Check browser Network tab for API calls
6. Verify data persists after page refresh

## Integration Testing Script

```bash
#!/bin/bash

echo "=== Backend Integration Test ==="
echo ""

# 1. Test server health
echo "1. Testing server health..."
curl -s http://localhost:3000/api/health

# 2. Test authentication
echo -e "\n\n2. Testing authentication..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.data.token')

echo "Token: ${TOKEN:0:20}..."

# 3. Test organizations endpoint
echo -e "\n\n3. Testing organizations..."
curl -s http://localhost:3000/api/settings/organizations \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Test master data
echo -e "\n\n4. Testing trade-types..."
curl -s http://localhost:3000/api/settings/master-data/trade-types \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Create new item
echo -e "\n\n5. Creating new trade type..."
curl -s -X POST http://localhost:3000/api/settings/master-data/trade-types \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Trade Type"}' | jq

echo -e "\n\n=== Test Complete ==="
```

## Common Issues & Solutions

### Issue: CORS Error
**Symptom:** `Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution:** Configure CORS in backend:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Issue: 401 Unauthorized
**Symptom:** All API calls return 401

**Solution:** 
- Check JWT token is being sent in Authorization header
- Verify JWT_SECRET matches between frontend and backend
- Check token hasn't expired

### Issue: 404 Not Found
**Symptom:** Endpoints return 404

**Solution:**
- Verify backend routes are registered
- Check API_BASE_URL in frontend `.env`
- Ensure backend is running on correct port

### Issue: 500 Internal Server Error
**Symptom:** API calls return 500

**Solution:**
- Check backend logs for error details
- Verify database connection
- Check all required fields are provided

### Issue: Data doesn't persist
**Symptom:** Data is lost after page refresh

**Solution:**
- Verify `VITE_USE_MOCK_API=false` in `.env`
- Check backend is saving to database
- Verify database transactions are committing

## Backend Checklist Summary

Before declaring backend "ready":

**Infrastructure:**
- [ ] Server is running and accessible
- [ ] Database is configured and migrated
- [ ] Environment variables are set
- [ ] CORS is configured correctly
- [ ] SSL/HTTPS (for production)

**Authentication:**
- [ ] Login endpoint works
- [ ] JWT tokens are generated
- [ ] Token validation works
- [ ] Admin role check works

**API Endpoints (32 total):**
- [ ] Organizations (4 endpoints)
- [ ] Master Data - 7 types (28 endpoints total)
- [ ] GST Rates (4 endpoints)
- [ ] Locations (3 endpoints)
- [ ] Commissions (4 endpoints)
- [ ] Delivery Terms (4 endpoints)
- [ ] Payment Terms (4 endpoints)
- [ ] CCI Terms (4 endpoints)

**Data Quality:**
- [ ] Input validation working
- [ ] Duplicate prevention working
- [ ] Error messages are clear
- [ ] Success responses include data

**Security:**
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Authentication required
- [ ] Authorization (Admin only)

## Frontend Readiness

**Configuration:**
- [ ] `.env` file created
- [ ] `VITE_USE_MOCK_API=false` set
- [ ] `VITE_API_BASE_URL` points to backend
- [ ] Build succeeds with real API config

**Components:**
- [ ] MasterDataManagement integrated (✅ Done)
- [ ] OrganizationManagement integrated (⏳ Pending)
- [ ] GstRateManagement integrated (⏳ Pending)
- [ ] LocationManagement integrated (⏳ Pending)
- [ ] CommissionManagement integrated (⏳ Pending)
- [ ] StructuredTermManagement integrated (⏳ Pending)
- [ ] CciTermManagement integrated (⏳ Pending)
- [ ] FYManagement integrated (⏳ Pending)

## Next Steps

1. **Backend Team:** Run through this checklist and mark completed items
2. **Share Results:** Provide test results (curl outputs or Postman collection)
3. **Frontend Team:** Configure `.env` with backend URL
4. **Integration Test:** Test end-to-end with real backend
5. **Fix Issues:** Address any integration problems
6. **Complete Integration:** Finish remaining 7 components
7. **Production Deploy:** Deploy both frontend and backend

---

**Document Version:** 1.0  
**Date:** November 10, 2025  
**Status:** Ready for Backend Verification
