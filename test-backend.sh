#!/bin/bash

# Backend Integration Readiness Test Script
# This script tests if the backend API is ready for integration

set -e

echo "======================================"
echo "Backend Integration Readiness Test"
echo "======================================"
echo ""

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
API_BASE="${BACKEND_URL}/api"
TEST_EMAIL="${TEST_EMAIL:-admin@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-admin123}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Helper function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing: $name... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "${API_BASE}${endpoint}" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "${API_BASE}${endpoint}" \
            -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")
    fi
    
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "$expected_status" ] || [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status, expected $expected_status)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. Test server health
echo "1. Testing Server Health"
echo "------------------------"
if curl -s -f "${BACKEND_URL}/api/health" > /dev/null 2>&1 || \
   curl -s -f "${BACKEND_URL}/" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is reachable${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Server is NOT reachable at ${BACKEND_URL}${NC}"
    echo ""
    echo "Please ensure:"
    echo "  1. Backend server is running"
    echo "  2. BACKEND_URL environment variable is set correctly"
    echo "  3. No firewall blocking the connection"
    echo ""
    exit 1
fi
TOTAL=$((TOTAL + 1))
echo ""

# 2. Test authentication
echo "2. Testing Authentication"
echo "-------------------------"
echo "Attempting login with ${TEST_EMAIL}..."

login_response=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" 2>/dev/null)

TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ Authentication failed or endpoint not implemented${NC}"
    echo "Response: $login_response"
    echo ""
    echo "Proceeding without authentication token..."
    echo "Note: API endpoints may fail if authentication is required"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))
echo ""

# 3. Test Organizations endpoints
echo "3. Testing Organizations Endpoints"
echo "----------------------------------"
test_endpoint "GET organizations" "GET" "/settings/organizations" "" "200"
test_endpoint "POST organization" "POST" "/settings/organizations" \
    '{"name":"Test Org","code":"TEST01","gstin":"27AABCU9603R1ZM","pan":"AABCU9603R","address":"123 Test","city":"Mumbai","state":"Maharashtra","pincode":"400001","phone":"9876543210","email":"test@test.com","website":"https://test.com","bankName":"Test Bank","accountNumber":"1234567890","ifscCode":"SBIN0001234","branch":"Main","isActive":true}' \
    "201"
echo ""

# 4. Test Master Data endpoints
echo "4. Testing Master Data Endpoints"
echo "---------------------------------"
for type in trade-types bargain-types varieties dispute-reasons weightment-terms passing-terms financial-years; do
    test_endpoint "GET $type" "GET" "/settings/master-data/$type" "" "200"
done
test_endpoint "POST trade-type" "POST" "/settings/master-data/trade-types" \
    '{"name":"Test Trade Type"}' "201"
echo ""

# 5. Test GST Rates endpoints
echo "5. Testing GST Rates Endpoints"
echo "-------------------------------"
test_endpoint "GET gst-rates" "GET" "/settings/gst-rates" "" "200"
test_endpoint "POST gst-rate" "POST" "/settings/gst-rates" \
    '{"description":"Test GST","hsnCode":"5201","rate":5.0}' "201"
echo ""

# 6. Test Locations endpoints
echo "6. Testing Locations Endpoints"
echo "-------------------------------"
test_endpoint "GET locations" "GET" "/settings/locations" "" "200"
test_endpoint "POST location" "POST" "/settings/locations" \
    '{"country":"India","state":"Maharashtra","city":"Mumbai"}' "201"
echo ""

# 7. Test Commissions endpoints
echo "7. Testing Commissions Endpoints"
echo "---------------------------------"
test_endpoint "GET commissions" "GET" "/settings/commissions" "" "200"
test_endpoint "POST commission" "POST" "/settings/commissions" \
    '{"name":"Test Commission","type":"PERCENTAGE","value":2.0}' "201"
echo ""

# 8. Test Delivery Terms endpoints
echo "8. Testing Delivery Terms Endpoints"
echo "------------------------------------"
test_endpoint "GET delivery-terms" "GET" "/settings/delivery-terms" "" "200"
test_endpoint "POST delivery-term" "POST" "/settings/delivery-terms" \
    '{"name":"Test Delivery","days":7}' "201"
echo ""

# 9. Test Payment Terms endpoints
echo "9. Testing Payment Terms Endpoints"
echo "-----------------------------------"
test_endpoint "GET payment-terms" "GET" "/settings/payment-terms" "" "200"
test_endpoint "POST payment-term" "POST" "/settings/payment-terms" \
    '{"name":"Test Payment","days":30}' "201"
echo ""

# 10. Test CCI Terms endpoints
echo "10. Testing CCI Terms Endpoints"
echo "--------------------------------"
test_endpoint "GET cci-terms" "GET" "/settings/cci-terms" "" "200"
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Total Tests: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed! Backend is ready for integration.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Update frontend .env file:"
    echo "     VITE_API_BASE_URL=${API_BASE}"
    echo "     VITE_USE_MOCK_API=false"
    echo "  2. Restart frontend dev server"
    echo "  3. Test Settings page functionality"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠ Some tests failed. Please review the output above.${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Endpoints not implemented yet"
    echo "  - Authentication not configured"
    echo "  - CORS not configured"
    echo "  - Database not connected"
    echo ""
    echo "See BACKEND_VERIFICATION_CHECKLIST.md for detailed requirements"
    exit 1
fi
