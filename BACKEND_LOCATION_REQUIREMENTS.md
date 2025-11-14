# Backend Location Hierarchy Implementation Requirements

## Overview
This document outlines the backend requirements for implementing the location hierarchy feature with proper cascading location mapping: Country → State → Region → Station/City.

## 1. Database Schema

### Location Master Table

```sql
CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    state VARCHAR(100) NOT NULL,
    region VARCHAR(100), -- Optional regional division (e.g., Vidarbha, Marathwada)
    city VARCHAR(100) NOT NULL, -- Also referred to as Station
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure unique combination
    CONSTRAINT unique_location UNIQUE(country, state, region, city)
);

-- Indexes for efficient querying
CREATE INDEX idx_locations_country_state ON locations(country, state);
CREATE INDEX idx_locations_state_region ON locations(state, region);
CREATE INDEX idx_locations_city ON locations(city);
```

### Update Address Fields

All tables with address fields need to include the `region` column:

```sql
-- Business Partners table
ALTER TABLE business_partners 
ADD COLUMN registered_address_region VARCHAR(100);

-- Branches table  
ALTER TABLE business_branches
ADD COLUMN address_region VARCHAR(100);

-- Ship-to Addresses table
ALTER TABLE ship_to_addresses
ADD COLUMN region VARCHAR(100);

-- Organizations table
ALTER TABLE organizations
ADD COLUMN address_region VARCHAR(100);
```

## 2. API Endpoints

### 2.1 Location Master Endpoints

#### GET /api/locations
Get all locations from master data

**Response:**
```json
[
  {
    "id": 1,
    "country": "India",
    "state": "Maharashtra",
    "region": "Vidarbha",
    "city": "Nagpur"
  },
  {
    "id": 2,
    "country": "India", 
    "state": "Maharashtra",
    "region": "Marathwada",
    "city": "Aurangabad"
  }
]
```

#### GET /api/locations/states?country=India
Get unique states for a country

**Response:**
```json
[
  "Maharashtra",
  "Gujarat",
  "Karnataka",
  "Tamil Nadu"
]
```

#### GET /api/locations/regions?country=India&state=Maharashtra
Get unique regions for a state

**Response:**
```json
[
  "Vidarbha",
  "Marathwada",
  "Western Maharashtra",
  "Konkan"
]
```

#### GET /api/locations/cities?country=India&state=Maharashtra&region=Vidarbha
Get cities for a state (optionally filtered by region)

**Response:**
```json
[
  "Nagpur",
  "Wardha",
  "Amravati",
  "Akola"
]
```

#### POST /api/locations
Add new location

**Request:**
```json
{
  "country": "India",
  "state": "Maharashtra",
  "region": "Vidarbha",
  "city": "Nagpur"
}
```

**Response:**
```json
{
  "id": 123,
  "country": "India",
  "state": "Maharashtra", 
  "region": "Vidarbha",
  "city": "Nagpur",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### POST /api/locations/bulk
Bulk upload locations from CSV

**Request:**
```json
{
  "locations": [
    {
      "country": "India",
      "state": "Maharashtra",
      "region": "Vidarbha", 
      "city": "Nagpur"
    },
    {
      "country": "India",
      "state": "Gujarat",
      "region": null,
      "city": "Ahmedabad"
    }
  ]
}
```

**Response:**
```json
{
  "success": 150,
  "failed": 2,
  "errors": [
    "Line 23: Duplicate location - Nagpur, Vidarbha, Maharashtra, India",
    "Line 45: Missing required field - city"
  ]
}
```

#### DELETE /api/locations/{id}
Delete a location from master data

### 2.2 Business Partner Endpoints

Existing endpoints need to be updated to support the `region` field:

#### POST /api/partners/register/start
Updated to accept region in registered address

**Request:**
```json
{
  "registrationSource": "SELF_SERVICE",
  "legalName": "ABC Cotton Mills",
  "businessType": "BUYER",
  "registeredAddress": {
    "addressLine1": "123 Main Street",
    "country": "India",
    "state": "Maharashtra",
    "region": "Vidarbha",
    "city": "Nagpur",
    "pincode": "440001"
  }
}
```

#### POST /api/partners/{partnerId}/branches
Updated to accept region in branch address

**Request:**
```json
{
  "branchName": "Mumbai Branch",
  "branchCode": "MUM-001",
  "address": {
    "addressLine1": "456 Branch Road",
    "country": "India",
    "state": "Maharashtra", 
    "region": "Western Maharashtra",
    "city": "Mumbai",
    "pincode": "400001"
  }
}
```

## 3. Data Migration

### 3.1 Migrate Existing Data

For existing addresses without region:

```sql
-- Set region to NULL for existing records
UPDATE business_partners 
SET registered_address_region = NULL
WHERE registered_address_region IS NULL;

UPDATE business_branches
SET address_region = NULL  
WHERE address_region IS NULL;
```

### 3.2 Initial Location Data

Seed the location master with common Indian locations. Example seed data:

```sql
-- Maharashtra
INSERT INTO locations (country, state, region, city) VALUES
('India', 'Maharashtra', 'Vidarbha', 'Nagpur'),
('India', 'Maharashtra', 'Vidarbha', 'Wardha'),
('India', 'Maharashtra', 'Vidarbha', 'Amravati'),
('India', 'Maharashtra', 'Marathwada', 'Aurangabad'),
('India', 'Maharashtra', 'Marathwada', 'Nanded'),
('India', 'Maharashtra', 'Western Maharashtra', 'Pune'),
('India', 'Maharashtra', 'Konkan', 'Mumbai'),
('India', 'Maharashtra', 'Konkan', 'Thane');

-- Gujarat
INSERT INTO locations (country, state, region, city) VALUES
('India', 'Gujarat', NULL, 'Ahmedabad'),
('India', 'Gujarat', NULL, 'Surat'),
('India', 'Gujarat', NULL, 'Rajkot'),
('India', 'Gujarat', NULL, 'Vadodara');

-- Karnataka  
INSERT INTO locations (country, state, region, city) VALUES
('India', 'Karnataka', NULL, 'Bangalore'),
('India', 'Karnataka', NULL, 'Mysore'),
('India', 'Karnataka', NULL, 'Hubli');
```

## 4. Validation Rules

### 4.1 Location Master Validation
- `country` is required (default: India)
- `state` is required
- `region` is optional
- `city` is required
- Combination of (country, state, region, city) must be unique
- All text fields should be trimmed and normalized

### 4.2 Address Validation in Registration
- Must provide valid state and city
- Region is optional
- If region is provided, validate it exists for the given state (or allow manual entry)
- City must be provided

### 4.3 Cascading Validation
When user selects:
1. Country → Show states for that country
2. State → Show regions for that state (if any)
3. Region (optional) → Show cities for that state/region
4. If no region selected → Show all cities for that state

## 5. Business Logic

### 5.1 Location Search
- Frontend will call location APIs to populate dropdowns
- Backend should return data sorted alphabetically
- Support case-insensitive search
- Handle special characters in location names

### 5.2 Manual Entry Fallback
- If API fails or location not in master, allow manual text entry
- Backend should accept and store manually entered locations
- Consider adding a flag `is_custom` to track manually entered locations

### 5.3 Location Usage Tracking
Consider adding usage tracking to identify popular locations:

```sql
ALTER TABLE locations 
ADD COLUMN usage_count INTEGER DEFAULT 0,
ADD COLUMN last_used_at TIMESTAMP;
```

## 6. Error Handling

### 6.1 Duplicate Detection
Return clear error when duplicate location is added:
```json
{
  "error": "Duplicate location",
  "message": "Location 'Nagpur, Vidarbha, Maharashtra, India' already exists",
  "existingId": 123
}
```

### 6.2 Invalid State/City
When invalid combination is provided:
```json
{
  "error": "Invalid location",
  "message": "City 'Nagpur' does not exist in state 'Gujarat'",
  "suggestions": ["Ahmedabad", "Surat", "Rajkot"]
}
```

## 7. Performance Considerations

### 7.1 Caching
- Cache location master data on backend
- Implement Redis/Memcached for frequently accessed location queries
- Cache expiry: 24 hours
- Invalidate cache on location master updates

### 7.2 Query Optimization
- Use database indexes on frequently queried columns
- Implement pagination for large location lists
- Consider materialized views for complex location queries

## 8. Testing Requirements

### 8.1 Unit Tests
- Test location CRUD operations
- Test cascading filters (state → region → city)
- Test duplicate detection
- Test bulk upload with various CSV formats

### 8.2 Integration Tests  
- Test complete registration flow with location selection
- Test branch creation with location data
- Test location data migration

### 8.3 Test Data
Provide comprehensive test data covering:
- Multiple states with regions
- States without regions  
- Special characters in location names
- Very long location names
- Edge cases (empty strings, null values)

## 9. Documentation

### 9.1 API Documentation
Update API documentation with:
- New location endpoints
- Updated request/response schemas
- Example requests with region field

### 9.2 User Guide
Document for users:
- How to use location selector
- When region is required vs optional
- How to add custom locations

## 10. Security Considerations

- Validate all input to prevent SQL injection
- Implement rate limiting on location APIs
- Sanitize location names to prevent XSS
- Implement proper authorization for location management endpoints

## Summary

The location hierarchy implementation requires:
1. ✅ Database schema updates with `region` column
2. ✅ Location master table creation
3. ✅ REST API endpoints for location hierarchy
4. ✅ Updated business partner endpoints to support region
5. ✅ Data migration for existing records
6. ✅ Seed data for common locations
7. ✅ Comprehensive validation and error handling
8. ✅ Performance optimization with caching
9. ✅ Complete testing coverage
10. ✅ Security measures

This implementation will provide a robust, scalable location management system that supports the hierarchical Country → State → Region → City structure required for business partner registration and branch management.
