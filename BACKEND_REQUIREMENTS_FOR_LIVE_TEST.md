# ⚠️ BACKEND REQUIREMENTS FOR LIVE TEST - WHAT'S NEEDED

**Date:** November 16, 2025  
**Status:** 🔴 **BACKEND NOT READY - CRITICAL ITEMS MISSING**

---

## 🚨 CRITICAL FINDING: BACKEND SERVER IS NOT RUNNING

### Test Results:
```
✗ Production Backend: https://erp-nonprod-backend-502095789065.us-central1.run.app - NOT RESPONDING
✗ Local Backend (8080): http://localhost:8080 - NOT RESPONDING  
✗ Local Backend (3000): http://localhost:3000 - NOT RESPONDING
```

---

## ❌ WHAT'S MISSING (CRITICAL)

### 1. 🚨 BACKEND SERVER NOT RUNNING
**Priority: CRITICAL - MUST FIX FIRST**

**Issue:** Backend server is not accessible at any URL

**What You Need:**
- [ ] Start the backend server
- [ ] Deploy to: https://erp-nonprod-backend-502095789065.us-central1.run.app
- [ ] OR run locally on: http://localhost:8080 or http://localhost:3000

**How to Fix:**
```bash
# In your backend repository
cd rnrltradehub-backend

# Install dependencies
npm install

# Start server
npm run dev
# OR
npm start
```

**Verify it's running:**
```bash
# Should return 200 OK
curl http://localhost:8080/health
# OR
curl http://localhost:8080/api/health
```

---

## 📋 WHAT BACKEND MUST IMPLEMENT (MINIMUM FOR TESTING)

### 2. 🔐 AUTHENTICATION (2 ENDPOINTS) - REQUIRED

**These are MANDATORY before any testing can begin:**

#### A. Health Check Endpoint
```
GET /health OR GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

#### B. Login Endpoint
```
POST /api/auth/login
```
**Request:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "Admin"
    }
  }
}
```

---

### 3. 📊 SETTINGS MODULE (39 ENDPOINTS) - REQUIRED

#### A. Organizations (4 endpoints)
```
GET    /api/settings/organizations
POST   /api/settings/organizations
PUT    /api/settings/organizations/:id
DELETE /api/settings/organizations/:id
```

**Example Response for GET:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "RNRL Traders Ltd",
      "code": "RNRL001",
      "gstin": "27AABCU9603R1ZM",
      "pan": "AABCU9603R",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "phone": "9876543210",
      "email": "info@rnrl.com",
      "isActive": true
    }
  ]
}
```

#### B. Master Data (28 endpoints - 7 types × 4 operations)

**For EACH of these types:**
- `trade-types`
- `bargain-types`
- `varieties`
- `dispute-reasons`
- `weightment-terms`
- `passing-terms`
- `financial-years`

**Implement:**
```
GET    /api/settings/master-data/:type
POST   /api/settings/master-data/:type
PUT    /api/settings/master-data/:type/:id
DELETE /api/settings/master-data/:type/:id
```

**Example Response for GET /api/settings/master-data/trade-types:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Purchase",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Sale",
      "isActive": true
    }
  ]
}
```

#### C. GST Rates (4 endpoints)
```
GET    /api/settings/gst-rates
POST   /api/settings/gst-rates
PUT    /api/settings/gst-rates/:id
DELETE /api/settings/gst-rates/:id
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "description": "Cotton - Raw",
      "hsnCode": "5201",
      "rate": 5.0
    }
  ]
}
```

#### D. Locations (3 endpoints)
```
GET    /api/settings/locations
POST   /api/settings/locations
DELETE /api/settings/locations/:id
```

#### E. Commissions (4 endpoints)
```
GET    /api/settings/commissions
POST   /api/settings/commissions
PUT    /api/settings/commissions/:id
DELETE /api/settings/commissions/:id
```

#### F. Delivery Terms (4 endpoints)
```
GET    /api/settings/delivery-terms
POST   /api/settings/delivery-terms
PUT    /api/settings/delivery-terms/:id
DELETE /api/settings/delivery-terms/:id
```

#### G. Payment Terms (4 endpoints)
```
GET    /api/settings/payment-terms
POST   /api/settings/payment-terms
PUT    /api/settings/payment-terms/:id
DELETE /api/settings/payment-terms/:id
```

#### H. CCI Terms (4 endpoints)
```
GET    /api/settings/cci-terms
POST   /api/settings/cci-terms
PUT    /api/settings/cci-terms/:id
DELETE /api/settings/cci-terms/:id
```

---

### 4. 🔒 SECURITY REQUIREMENTS - REQUIRED

#### A. CORS Configuration
```javascript
// Express.js example
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.com'
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### B. JWT Token Validation
- All endpoints except `/health` and `/api/auth/login` must require authentication
- Check for `Authorization: Bearer <token>` header
- Validate JWT token
- Return 401 if token is missing/invalid

#### C. Input Validation
- Validate all POST/PUT request bodies
- Return 400 with error message for invalid data
- Prevent SQL injection
- Sanitize inputs

---

### 5. 🗄️ DATABASE - REQUIRED

#### Minimum Tables Needed:
```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'User'
);

-- Organizations table
CREATE TABLE organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  gstin VARCHAR(15),
  pan VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  bank_name VARCHAR(255),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(11),
  branch VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master data tables (example for trade_types)
CREATE TABLE trade_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repeat for: bargain_types, varieties, dispute_reasons,
-- weightment_terms, passing_terms, financial_years

-- GST Rates
CREATE TABLE gst_rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  description VARCHAR(255),
  hsn_code VARCHAR(10),
  rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations
CREATE TABLE locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Similar tables for: commissions, delivery_terms, payment_terms, cci_terms
```

#### Seed Data Needed:
```sql
-- Create admin user
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@example.com', '$2b$10$...', 'Admin User', 'Admin');

-- Add some initial master data
INSERT INTO trade_types (name) VALUES ('Purchase'), ('Sale'), ('Transfer');
INSERT INTO bargain_types (name) VALUES ('Direct'), ('Broker'), ('Online');
```

---

## 🎯 MINIMUM VIABLE BACKEND (MVP)

### To Start Testing TODAY, Backend Must Have:

✅ **CRITICAL (MUST HAVE):**
1. Server running and accessible
2. Health check endpoint
3. Login endpoint (with at least 1 admin user)
4. Database connected
5. CORS configured

✅ **HIGH PRIORITY (NEEDED FOR SETTINGS PAGE):**
6. All Master Data endpoints (28 endpoints)
7. Organizations endpoints (4 endpoints)
8. GST Rates endpoints (4 endpoints)

✅ **MEDIUM PRIORITY (CAN ADD LATER):**
9. Locations, Commissions, Terms endpoints (20 endpoints)
10. Full validation and error handling

✅ **LOW PRIORITY (FUTURE):**
11. Business Partner module (50+ endpoints)
12. Email notifications
13. File uploads
14. Advanced features

---

## 🚀 QUICK START GUIDE FOR BACKEND

### Step 1: Set Up Server (30 minutes)

```bash
# 1. Create basic Express server
npm init -y
npm install express cors bcryptjs jsonwebtoken dotenv

# 2. Create server.js
```

```javascript
// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // TODO: Verify password against database
  if (email === 'admin@example.com' && password === 'admin123') {
    const token = 'dummy-jwt-token'; // TODO: Generate real JWT
    res.json({
      success: true,
      data: {
        token,
        user: { id: 1, email, name: 'Admin', role: 'Admin' }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Step 2: Test It Works
```bash
# Start server
node server.js

# In another terminal, test it
curl http://localhost:8080/health
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Step 3: Add Database (1 hour)
```bash
npm install mysql2 sequelize
# OR
npm install pg sequelize
# OR
npm install mongoose (for MongoDB)
```

### Step 4: Add Master Data Endpoints (2 hours)
See `BACKEND_API_REQUIREMENTS.md` for detailed specifications

### Step 5: Deploy (30 minutes)
```bash
# Deploy to Google Cloud Run
gcloud run deploy backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 📞 WHAT TO TELL ME

### Once You Start the Backend, Tell Me:

1. **Server URL:**
   - Local: `http://localhost:XXXX`
   - Production: `https://your-backend-url.com`

2. **Test Results:**
   ```bash
   # Run this and share output
   BACKEND_URL="your-backend-url" ./test-backend.sh
   ```

3. **Admin Credentials:**
   - Email: ?
   - Password: ?

4. **What's Implemented:**
   - [ ] Health check?
   - [ ] Login?
   - [ ] Master Data?
   - [ ] Organizations?
   - [ ] Other endpoints?

---

## 📊 TESTING CHECKLIST

Once backend is running, we'll test:

### Phase 1: Basic Connectivity
- [ ] Server responds to health check
- [ ] Login works and returns token
- [ ] Token validates on protected endpoints

### Phase 2: Settings Module
- [ ] Can fetch master data (GET)
- [ ] Can create new items (POST)
- [ ] Can update items (PUT)
- [ ] Can delete items (DELETE)
- [ ] Duplicates are prevented
- [ ] Data persists after refresh

### Phase 3: Integration
- [ ] Frontend can login
- [ ] Frontend can CRUD settings data
- [ ] No CORS errors
- [ ] No 401/403 errors
- [ ] Error messages display properly

---

## 📄 REFERENCE DOCUMENTS

**In This Repository:**
- `BACKEND_INTEGRATION_REQUIREMENTS.md` - Full API specification
- `BACKEND_VERIFICATION_CHECKLIST.md` - Detailed endpoint specs
- `BACKEND_API_ENDPOINTS.md` - Endpoint listing
- `test-backend.sh` - Automated test script

**Example API Responses:**
See the documents above for complete examples of request/response formats.

---

## 🎯 SUMMARY

### ❌ Current Status:
**BACKEND IS NOT RUNNING - CANNOT TEST**

### ✅ What You Need to Do:

**IMMEDIATE (Do This First):**
1. ✅ Start backend server
2. ✅ Make it accessible (local or production URL)
3. ✅ Implement health check endpoint
4. ✅ Implement login endpoint
5. ✅ Tell me the URL and credentials

**NEXT (For Settings Page Testing):**
6. ✅ Implement master data endpoints (28 endpoints)
7. ✅ Implement organizations endpoints (4 endpoints)
8. ✅ Set up database with tables
9. ✅ Configure CORS

**LATER (Advanced Features):**
10. ✅ Add remaining Settings endpoints
11. ✅ Implement Business Partner module
12. ✅ Add email/SMS services
13. ✅ File upload functionality

---

## 🚀 NEXT STEPS

**Right Now:**
1. Start your backend server
2. Share the URL with me
3. Share admin credentials
4. I'll run the test script
5. I'll tell you what's working/missing
6. We fix issues together
7. Start real testing

**Need Help?**
- I can guide you step-by-step
- I can review your backend code
- I can help debug issues
- I can create sample implementations

---

**STATUS:** 🔴 BACKEND NOT RUNNING - WAITING FOR YOU TO START IT

**Let me know when backend is running and I'll test it immediately!**
