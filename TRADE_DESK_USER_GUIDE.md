# Trade Desk Module - User Guide

## Overview

Trade Desk is an AI-powered commodity trading platform that enables buyers and sellers to create and respond to trade requirements in real-time through an intuitive chat interface.

## Key Features

### For Buyers
- **AI Chat Interface**: Simply type what you need (e.g., "Need 500 bales organic cotton with staple 28-30")
- **Smart Matching**: Automatically matches with sellers based on quality parameters, location, and certifications
- **Ranked Offers**: See all offers sorted by match score with detailed breakdowns
- **Real-Time Updates**: Get instant notifications when sellers submit offers
- **Easy Negotiation**: Accept, counter, or reject offers with one click

### For Sellers
- **Match Notifications**: Get notified immediately when trades match your location and certifications
- **Quick Offer Submission**: Fill in your price, quantity, and quality parameters
- **Test Report Upload**: Link your test reports to offers for credibility
- **Offer Tracking**: View all your submitted offers and their status

### For Back-Office (Admin/Sales)
- **Live Dashboard**: Real-time statistics of all trades (Posted, Negotiating, Completed)
- **Trade Oversight**: View all active trades with filtering
- **Seller Performance**: Track seller acceptance rates and match scores
- **Manual Interventions**: Force-match trades or invite specific sellers

## How to Use

### Accessing Trade Desk

1. Log in to the RNRL ERP system
2. Click **"Trade Desk"** in the left sidebar
3. Choose your view:
   - **Buy / Create Demand** (for buyers)
   - **Sell / Submit Offers** (for sellers)
   - **Back Office Dashboard** (for admin/sales)

### Creating a Trade (Buyer)

1. Click on the **chat panel** on the left
2. Type your requirement naturally, for example:
   - "Need 500 bales organic cotton"
   - "Buying 1000 quintal wheat with protein 12-14%"
   - "I want 300 bales NPOP cotton, mic 3.8-4.2"
3. The AI will parse your message and show what it understood
4. Confirm or adjust the details
5. Fill in any missing information (location, payment terms, delivery)
6. Click **"Submit Requirement"**
7. Your trade is posted and matched sellers are notified!

### Viewing & Managing Offers (Buyer)

1. Click on a trade from the **"My Trades"** list
2. View all received offers, sorted by match score
3. Each offer shows:
   - **Match Score** (0-100%)
   - **Match Breakdown** (Parameters, Price, Location, Payment scores)
   - **Seller Details** (Name, rating, completed trades)
   - **Quality Parameters** (actual values from test reports)
   - **Price & Quantity**
   - **Test Report** (if available)
4. Actions available:
   - **Accept**: Finalize the offer and create a contract
   - **Counter**: Propose new terms (price, quantity, validity)
   - **Reject**: Decline the offer with a reason

### Submitting an Offer (Seller)

1. Go to **"Matched Trades"** tab
2. Click on a trade that matches your capabilities
3. Fill in the offer form:
   - **Price** (per unit)
   - **Quantity** (available to sell)
   - **Quality Parameters** (staple, mic, strength, etc.)
   - **Test Report** (optional PDF link)
   - **Validity** (how long the offer is valid)
   - **Notes** (any additional information)
4. Click **"Submit Offer"**
5. Buyer will be notified immediately!

### Tracking Your Offers (Seller)

1. Go to **"My Offers"** tab
2. View all your submitted offers with status:
   - **PENDING**: Waiting for buyer response
   - **COUNTERED**: Buyer proposed new terms
   - **ACCEPTED**: Offer accepted, contract in progress
   - **REJECTED**: Offer declined
   - **EXPIRED**: Validity period elapsed
3. Click on an offer to view negotiation history

## Understanding Match Scores

Match scores (0-100%) help buyers identify the best offers. The score is calculated as:

- **45%**: Parameter Match (how closely quality specs match requirements)
- **35%**: Price Competitiveness (compared to target price or other offers)
- **10%**: Location Proximity (exact station > region > state)
- **10%**: Payment/Delivery Compatibility (terms match)

### Score Labels:
- **90-100%**: 🏆 Best Match (green)
- **75-89%**: Good Match (blue)
- **60-74%**: Average Match (yellow)
- **<60%**: Poor Match (red) - usually hidden

## Tips for Success

### For Buyers:
1. **Be Specific**: Include quality parameters in your initial message
2. **Use Certificates**: Specify required certifications (NPOP, Organic, BCI)
3. **Set Realistic Prices**: Target prices help match better offers
4. **Respond Quickly**: Offers have validity periods; don't miss good deals
5. **Use Counter-Offers**: Negotiate price or quantity before accepting

### For Sellers:
1. **Upload Test Reports**: Offers with test reports get higher trust
2. **Be Competitive**: Check match scores to understand your position
3. **Set Reasonable Validity**: Give buyers time to respond (48-72 hours typical)
4. **Add Notes**: Explain delivery timelines or special conditions
5. **Respond to Counters**: Engage in negotiations for better deals

### For Back-Office:
1. **Monitor Posted Trades**: Ensure they're getting seller responses
2. **Force-Match When Needed**: Manually send urgent trades to specific sellers
3. **Track Seller Performance**: Identify reliable vs unreliable sellers
4. **Intervene Early**: Help resolve stuck negotiations

## Common Scenarios

### Scenario 1: Urgent Requirement
1. Mark trade as **URGENT** when creating
2. System prioritizes notification to sellers
3. Back-office can force-match to top sellers immediately

### Scenario 2: Multiple Good Offers
1. Compare top 3 offers side-by-side
2. Use **"Split Quantity"** feature to accept multiple offers
3. Allocate quantities to different sellers

### Scenario 3: No Offers Received
1. Check **"Matched Sellers"** to see if any were notified
2. Relax requirements (expand location or parameter ranges)
3. Ask back-office to invite specific sellers manually

### Scenario 4: Test Report Verification
1. Click on test report link in offer
2. Verify parameters match what seller claimed
3. Download for records before accepting

## Real-Time Features

The Trade Desk uses WebSocket for instant updates:
- **Live Indicator**: Green dot in header shows connection status
- **Instant Notifications**: New offers appear immediately
- **Chat Updates**: AI responses show typing indicator
- **Dashboard Stats**: Numbers update in real-time

## Mobile Access

Trade Desk is fully mobile-responsive:
- **Chat/Trade Toggle**: Switch between views on small screens
- **Touch-Friendly**: All buttons and cards optimized for touch
- **Vertical Layout**: Stacks components for easy scrolling

## Role Permissions

| Role | Create Trades | Submit Offers | View Dashboard |
|------|---------------|---------------|----------------|
| Buyer Partner | ✅ Own | ❌ | ❌ |
| Seller Partner | ❌ | ✅ Own | ❌ |
| Trader | ✅ Proxy | ✅ Proxy | ❌ |
| Sales (Internal) | ✅ All | ❌ | ✅ Limited |
| Admin | ✅ All | ❌ | ✅ Full |

## Troubleshooting

### AI Not Understanding My Message
- Use specific terms: "cotton" not "kapas", "bales" not "units"
- Include quantity with unit: "500 bales" not just "500"
- Try examples: Click quick action buttons for templates

### No Sellers Matched
- Expand location: Try region instead of specific station
- Remove optional certificates: Keep only mandatory ones
- Adjust parameters: Widen min/max ranges slightly

### Offers Not Appearing
- Check WebSocket status: Green dot should be lit
- Refresh page to reconnect
- Check trade status: Must be "POSTED" or "OFFERS_RECEIVED"

### Can't Submit Offer
- Verify all required fields are filled
- Check parameters are within commodity min/max
- Ensure validity period is in future

## Support

For technical issues or questions:
- Contact: support@rnrltradehub.com
- Phone: [Support Number]
- Chat: Use AI Assistant for general queries

---

**Trade Desk - Making commodity trading simple, transparent, and efficient!** 🚀
