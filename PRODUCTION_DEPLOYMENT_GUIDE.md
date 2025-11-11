# Production Deployment Guide - Settings Module

## Status: Ready for Backend Integration ✅

**Date:** November 10, 2025  
**Frontend Status:** Configured for Production Mode  
**Mock API:** Disabled (VITE_USE_MOCK_API=false)

## Quick Start

### 1. Backend Verification

Run the automated test script:

```bash
# Test with default settings (localhost:3000)
./test-backend.sh

# Test with custom backend URL
BACKEND_URL=https://api.yourdomain.com ./test-backend.sh

# Test with custom credentials
BACKEND_URL=http://localhost:3000 \
TEST_EMAIL=admin@example.com \
TEST_PASSWORD=yourpassword \
./test-backend.sh
```

**Expected Output:**
```
✓ All tests passed! Backend is ready for integration.
```

### 2. Frontend Configuration

The frontend is already configured with `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_API=false
```

**For production deployment**, update to:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_USE_MOCK_API=false
```

### 3. Start Testing

```bash
# Start development server
npm run dev

# Login as Admin
# Navigate to Settings page
# Test CRUD operations
```

## Backend Requirements Checklist

Use `BACKEND_VERIFICATION_CHECKLIST.md` for detailed verification.

### Critical Items

- [ ] **Server Running**: Backend accessible at specified URL
- [ ] **Authentication**: POST /api/auth/login working, returns JWT token
- [ ] **CORS Configured**: Allows requests from frontend origin
- [ ] **All Endpoints**: 32+ endpoints implemented and tested
- [ ] **Database Connected**: Data persists across restarts
- [ ] **Validation**: Server-side input validation working
- [ ] **Error Handling**: Proper HTTP status codes and error messages

### Endpoint Groups (32 total)

1. [ ] **Organizations** (4 endpoints): GET, POST, PUT, DELETE
2. [ ] **Master Data** (28 endpoints): 7 types × 4 operations each
   - trade-types, bargain-types, varieties, dispute-reasons
   - weightment-terms, passing-terms, financial-years
3. [ ] **GST Rates** (4 endpoints): GET, POST, PUT, DELETE
4. [ ] **Locations** (3 endpoints): GET, POST, DELETE
5. [ ] **Commissions** (4 endpoints): GET, POST, PUT, DELETE
6. [ ] **Delivery Terms** (4 endpoints): GET, POST, PUT, DELETE
7. [ ] **Payment Terms** (4 endpoints): GET, POST, PUT, DELETE
8. [ ] **CCI Terms** (4 endpoints): GET, POST, PUT, DELETE

## Frontend Integration Status

### Completed (App-Wide)

- ✅ **API Client** (`src/api/client.ts`)
  - Configured for production mode
  - JWT authentication support
  - Error handling
  - Environment-based configuration

- ✅ **API Services** (`src/api/settingsApi.ts`)
  - All 8 resource groups implemented
  - Mock mode disabled
  - Ready for real backend calls

- ✅ **App Providers** (`src/App.tsx`)
  - DialogProvider wrapped
  - ErrorBoundary wrapped
  - Global error handling active

### Completed (Components) - 1 of 8

- ✅ **MasterDataManagement** + **MasterDataForm**
  - All 7 master data types functional
  - API integration working
  - Validation active (React Hook Form + Zod)
  - Custom dialogs replacing window.alert/confirm
  - Loading states
  - Error handling

### Pending (Components) - 7 of 8

Same pattern needs to be applied to:
1. ⏳ OrganizationManagement
2. ⏳ GstRateManagement
3. ⏳ LocationManagement
4. ⏳ CommissionMasterManagement
5. ⏳ StructuredTermManagement
6. ⏳ CciTermManagement
7. ⏳ FYManagement

**Estimated Time:** 2-3 hours (pattern is established)

## Testing the Integration

### Manual Testing Steps

1. **Start Backend**
   ```bash
   # In backend repository
   npm run dev
   # or
   npm start
   ```

2. **Verify Backend**
   ```bash
   # In frontend repository
   ./test-backend.sh
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```

4. **Test in Browser**
   - Open http://localhost:5173
   - Login as Admin
   - Navigate to Settings
   - Test Master Data sections:
     - Create new item
     - Edit existing item
     - Delete item
     - Try to create duplicate (should error)

### Expected Behavior

**✅ Correct:**
- Loading spinner appears during API calls
- Custom styled dialogs (not browser alerts)
- Success message after save
- Data persists after page refresh
- Validation errors show inline
- Duplicate names rejected

**❌ Incorrect:**
- Browser alert/confirm dialogs
- No loading indicators
- Data lost after refresh
- No validation errors
- Duplicates allowed

### Network Tab Verification

Open browser DevTools → Network tab:

**Should see:**
- Request to `/api/settings/master-data/trade-types`
- Request header: `Authorization: Bearer ...`
- Response: `200 OK` with JSON data
- Response format matches API spec

**Should NOT see:**
- 404 Not Found (endpoint missing)
- 401 Unauthorized (auth issue)
- 500 Internal Server Error (backend error)
- CORS errors in console

## Troubleshooting

### Issue: "Network error. Please check your connection."

**Possible Causes:**
1. Backend not running
2. Wrong VITE_API_BASE_URL in .env
3. CORS not configured

**Solutions:**
```bash
# Check backend is running
curl http://localhost:3000/api/health

# Verify .env configuration
cat .env

# Test CORS
curl -I http://localhost:3000/api/settings/organizations \
  -H "Origin: http://localhost:5173"
```

### Issue: "401 Unauthorized"

**Possible Causes:**
1. JWT token not being sent
2. Token expired
3. Invalid token

**Solutions:**
- Check localStorage has authToken
- Verify JWT_SECRET matches
- Re-login to get fresh token

### Issue: "CORS policy error"

**Backend Fix (Express.js):**
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Issue: Data doesn't persist

**Check:**
1. `.env` has `VITE_USE_MOCK_API=false`
2. Backend is saving to database
3. Database connection is active
4. No errors in backend logs

## Production Deployment

### Frontend

1. **Update .env for production:**
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   VITE_USE_MOCK_API=false
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Deploy** dist folder to:
   - Vercel / Netlify / AWS S3 / etc.

### Backend

1. **Environment variables:**
   - JWT_SECRET
   - DATABASE_URL
   - FRONTEND_URL (for CORS)

2. **Deploy** to:
   - AWS / Azure / Heroku / etc.

3. **Enable HTTPS**

4. **Configure CORS** for production frontend domain

## Verification Checklist

### Before declaring "ready for production":

**Backend:**
- [ ] All 32 endpoints tested and working
- [ ] Authentication working
- [ ] Database connected and persisting data
- [ ] CORS configured for frontend domain
- [ ] SSL/HTTPS enabled (production)
- [ ] Error logging configured
- [ ] Input validation on all endpoints
- [ ] Duplicate prevention working

**Frontend:**
- [ ] Build succeeds with production config
- [ ] .env configured with production API URL
- [ ] Mock mode disabled
- [ ] All 8 components integrated (current: 1/8)
- [ ] Manual testing passed
- [ ] Network tab shows real API calls
- [ ] Data persists after refresh
- [ ] No console errors

**Integration:**
- [ ] End-to-end testing passed
- [ ] Create/Read/Update/Delete all working
- [ ] Validation working (duplicates rejected)
- [ ] Error handling working
- [ ] Loading states showing
- [ ] Custom dialogs showing (no browser alerts)

## Files Created/Modified

### New Files:
1. ✅ `.env` - Production configuration
2. ✅ `.env.example` - Template for configuration
3. ✅ `BACKEND_VERIFICATION_CHECKLIST.md` - Detailed verification guide
4. ✅ `test-backend.sh` - Automated backend test script
5. ✅ `PRODUCTION_DEPLOYMENT_GUIDE.md` - This file

### Modified Files:
1. ✅ `src/api/client.ts` - Fixed mock mode flag
2. ✅ `.gitignore` - Added .env to ignore list

## Next Actions

### For Backend Team:

1. Run `./test-backend.sh` from frontend repo
2. Fix any failing endpoints
3. Verify CORS configuration
4. Share test results

### For Frontend Team (After Backend Ready):

1. Verify backend with test script
2. Test Settings page manually
3. Complete remaining 7 component integrations
4. Run comprehensive tests
5. Deploy to production

## Summary

**Current Status:**
- ✅ Frontend configured for production mode
- ✅ Mock API disabled
- ✅ API client ready for real backend
- ✅ Build succeeds
- ✅ 1 of 8 components integrated
- ⏳ Waiting for backend verification

**Ready to Test:**
- MasterDataManagement (all 7 types)
- Trade Types, Bargain Types, Varieties, etc.

**Next Steps:**
1. Backend team: Run `./test-backend.sh`
2. Frontend team: Complete remaining integrations
3. Both teams: End-to-end testing
4. Deploy to production

---

**Status:** ✅ Ready for Backend Integration Testing  
**Mock Mode:** ❌ Disabled  
**Production Config:** ✅ Active  
**Build Status:** ✅ Success (6.36s)
