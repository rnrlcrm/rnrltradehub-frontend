# Trade Desk Module - Architecture & Implementation Analysis

## Executive Summary
This document analyzes the Trade Desk specification and proposes a robust, AI-first architecture with no compromises.

## Architecture Review & Recommendations

### ✅ Strong Points in Spec
1. **Clear entity model** - Trade, Offer, TestedLot, Negotiation, MatchScore, AuditLog
2. **Well-defined matching algorithm** - Weighted scoring with configurable parameters
3. **Complete state machine** - Trade and Offer lifecycle clearly defined
4. **Real-time requirements** - WebSocket for instant updates
5. **Backend handoff clarity** - Full API contract with examples

### ⚠️ Missing/Unclear Areas (Need Discussion)

#### 1. **User Role Matrix**
**Question:** Who can do what?
- Buyer roles: Can create trades? (Business Partner only? Or also internal Sales/Traders?)
- Seller roles: Who can submit offers? (Only Business Partners registered as sellers?)
- Back-office: Which roles access dashboard? (Admin only? Or Sales team too?)
- Trader role: Can they act as intermediary? Create trades on behalf of buyers?

**Recommendation:** Define clear RBAC matrix:
```
Role              | Create Trade | Submit Offer | View All Trades | Back-office Dashboard
------------------|--------------|--------------|-----------------|---------------------
Buyer Partner     | Yes (own)    | No           | Own only        | No
Seller Partner    | No           | Yes (own)    | Own only        | No
Trader            | Yes (proxy)  | Yes (proxy)  | Assigned only   | Limited (assigned)
Sales (internal)  | Yes          | No           | All             | Yes
Admin             | Yes          | No           | All             | Yes (full)
```

#### 2. **Commodity Parameter Source**
**Current:** Spec says "Admin defined per commodity with min/max"
**Question:** Use existing Commodity Master structure from types.ts?
- The app already has `Commodity` interface with varieties, terms, etc.
- Need to extend with quality parameters (staple_mm, mic, strength, etc.)

**Recommendation:** 
- Add `qualityParameters: QualityParameter[]` to existing Commodity type
- Each parameter has: `name, label, unit, min, max, weight, dataType`
- Supports different commodities (cotton: staple/mic, wheat: protein/moisture, etc.)

#### 3. **Location Matching Source**
**Question:** Integration with Location Master?
- Spec mentions State/Region/Station hierarchy
- Does app have Location Master? (Need to check Settings/Master Data)

**Recommendation:** Use existing location hierarchy or create minimal structure:
```typescript
interface LocationHierarchy {
  state: { id: number, name: string }
  region?: { id: number, name: string, stateId: number }
  station?: { id: number, name: string, regionId: number }
}
```

#### 4. **Certificate Verification**
**Question:** How to validate certificates (NPOP, Organic, etc.)?
- Is it just a tag/label or does backend verify?
- Do sellers need to upload certificate PDFs?
- Who approves/validates certificates?

**Recommendation:** 
- Phase 1: Simple tags/labels (buyer specifies, seller confirms)
- Phase 2: Upload + verification workflow (future)

#### 5. **Test Report Parsing**
**Specification:** "TestReport extraction"
**Question:** Auto-extract parameters from PDF test reports?
- Use AI/OCR to parse test reports?
- Or manual entry required?

**Recommendation:**
- Phase 1: Manual entry with optional file upload (link/reference)
- Phase 2: AI-powered OCR extraction (Gemini/GPT-4 Vision)

#### 6. **Multi-Seller Acceptance**
**Specification:** "If multiple sellers accepted, buyer can split quantity"
**Question:** UX flow for splitting?
- Pre-defined splits (50%-50%)?
- Manual quantity allocation?
- Can buyer partially accept one offer and continue negotiating with others?

**Recommendation:**
- Show "Accept & Split" button if qty > trade.quantity
- Modal with seller list, quantity sliders, auto-calculate totals
- Validation: total allocated <= trade.quantity

#### 7. **Notification Throttling**
**Specification:** "Group similar notifications every X minutes"
**Question:** Throttle logic - frontend or backend?
- Frontend: Buffer notifications and show grouped?
- Backend: Send digest notifications?

**Recommendation:** 
- Backend throttles sends (digest every 30 mins per commodity)
- Frontend shows real-time badge counter
- User clicks to see grouped list

#### 8. **Offer Expiry & Auto-Matching**
**Specification:** "Auto-expiry: backend marks expired and re-runs matching if desired"
**Question:** Auto re-match after expiry?
- Automatic or user-triggered?
- Send to same sellers or wider net?

**Recommendation:**
- Show "Expired Offers" banner with "Request Fresh Offers" button
- User-triggered re-match (not automatic)
- Option to relax parameters (location, price range, etc.)

#### 9. **Price Visibility**
**Question:** When does buyer see seller prices?
- Immediately when offer submitted?
- Only after seller confirms interest?
- Blind bidding mode (only match scores visible until acceptance)?

**Recommendation:** 
- Default: Full transparency (price visible with match score)
- Optional: Blind mode (future feature)

#### 10. **Payment & Delivery Term Compatibility**
**Specification:** "If seller supports buyer-selected term -> 100, else 0"
**Question:** How does seller specify supported terms?
- Pre-configured in seller profile?
- Selected per offer?

**Recommendation:**
- Seller specifies in each offer (select from list)
- Match checks compatibility: exact match = 100, else 0

#### 11. **Dashboard Real-Time Updates**
**Question:** WebSocket for dashboard too?
- Live counters (Posted, Negotiating, etc.)
- Live trade list updates
- Alert panel real-time

**Recommendation:**
- Yes, WebSocket subscription for dashboard
- Channel: `/ws/dashboard/{orgId}` for aggregated stats
- Separate from individual trade channels

#### 12. **Fraud Detection**
**Specification:** "Flag offers with suspicious test reports (future)"
**Question:** Any immediate red flags to check?
- Parameter values outside commodity min/max?
- Unusual price (too low/high)?

**Recommendation:**
- Phase 1: Simple validation (values within commodity bounds)
- Warning badge if price deviates >30% from recent trades
- Phase 2: ML-based anomaly detection

#### 13. **Currency/FX**
**Specification:** "Future - price fields include currency code"
**Question:** Multi-currency now or later?

**Recommendation:**
- Phase 1: INR only (hardcoded)
- Structure data for future: `{ amount: 48000, currency: 'INR' }`

#### 14. **Audit Granularity**
**Question:** What actions to audit?
- Every chat message?
- Only trade creation, offers, acceptance?
- Parameter changes during negotiation?

**Recommendation:**
- Audit critical actions only:
  - Trade created/updated
  - Offer submitted/countered/accepted/rejected
  - Contract generated
  - Manual back-office actions
- Chat messages: stored separately (not in audit log)

#### 15. **NLP Parsing**
**Specification:** "POST /nlp/parse (placeholder)"
**Question:** Use Google Gemini (already in package.json)?
- The app already imports `@google/genai`
- Can use for chat parsing?

**Recommendation:**
- Yes! Use existing Gemini integration
- Prompt: Extract commodity, quantity, action (buy/sell), certificates, quality hints
- Fallback: If parsing fails, show manual selection

## Proposed Architecture

### Directory Structure
```
src/
  pages/
    TradeDesk/
      TradeDesk.tsx              # Main page wrapper
      BuyerView.tsx              # Buyer chat + trades list
      SellerView.tsx             # Seller notifications + offer form
      BackOfficeView.tsx         # Dashboard for internal team
  
  components/
    tradedesk/
      chat/
        ChatInterface.tsx        # AI chat input + message list
        ChatMessage.tsx          # Individual message bubble
        QuickActions.tsx         # Commodity chips, templates
      
      trade/
        TradeWizard.tsx          # Missing parameter collection
        TradeCard.tsx            # Trade summary card
        TradeDetail.tsx          # Full trade view
        TradeList.tsx            # List of trades (buyer/seller)
      
      offer/
        OfferForm.tsx            # Seller submits offer
        OfferCard.tsx            # Offer display with match score
        OfferList.tsx            # Ranked list of offers
        OfferComparison.tsx      # Side-by-side comparison (top 3)
      
      negotiation/
        NegotiationChat.tsx      # Thread of counter-offers
        CounterOfferForm.tsx     # Inline counter form
        OfferTimeline.tsx        # Audit timeline for offer versions
      
      dashboard/
        DashboardOverview.tsx    # Live stats cards
        TradeTable.tsx           # Back-office trade list
        TradeActions.tsx         # Manual actions (force-match, etc.)
        SellerPerformance.tsx    # Seller metrics panel
        AlertsPanel.tsx          # Urgent alerts
      
      common/
        MatchScoreBadge.tsx      # Score visualization (0-100)
        ParameterDeviation.tsx   # Green/red highlights
        ExpiryTimer.tsx          # Countdown for offer validity
        TestReportViewer.tsx     # PDF viewer/link
  
  types/
    tradedesk.types.ts           # All Trade Desk types
  
  api/
    tradedeskApi.ts              # REST API calls
  
  services/
    websocketService.ts          # WebSocket client
    nlpService.ts                # Gemini NLP parsing
    matchingService.ts           # Client-side match score (preview)
  
  hooks/
    useTradeDesk.ts              # Main trade desk state
    useWebSocket.ts              # WebSocket hook
    useNLP.ts                    # NLP parsing hook
    useMatching.ts               # Matching logic hook
  
  data/
    mockTradeDeskData.ts         # Mock trades, offers, lots
```

### Key Design Decisions

#### 1. **Progressive Disclosure**
- Start with minimal input (commodity + quantity via chat)
- Show only missing mandatory fields (not all fields at once)
- Pre-fill with smart defaults where possible

#### 2. **Real-Time First**
- WebSocket connection established on page load
- Optimistic UI updates (show pending state immediately)
- Auto-reconnect on disconnect

#### 3. **Mobile-Responsive**
- Chat interface mobile-first
- Stacked layout on mobile, side-by-side on desktop
- Touch-friendly offer cards

#### 4. **Accessibility**
- ARIA labels for all interactive elements
- Keyboard navigation (tab, arrow keys)
- Screen reader announcements for real-time updates

#### 5. **Performance**
- Virtual scrolling for large offer lists
- Debounced chat input
- Lazy load trade details
- Memoized match score calculations

#### 6. **Error Handling**
- Network error: Show retry button, queue actions
- Validation error: Inline field errors with suggestions
- WebSocket disconnect: Banner notification with reconnect
- NLP parse failure: Fallback to manual selection

## Implementation Phases

### Phase 1: Core Structure (Day 1)
- [ ] Type definitions (all entities)
- [ ] WebSocket service (connection, subscriptions, events)
- [ ] API contract documentation (complete)
- [ ] Mock data (trades, offers, lots)
- [ ] Basic page structure (routing, navigation)

### Phase 2: Buyer Flow (Day 2-3)
- [ ] Chat interface with NLP
- [ ] Trade wizard (parameter collection)
- [ ] Trade list (posted, offers received)
- [ ] Offer list with ranking
- [ ] Accept/Counter actions

### Phase 3: Seller Flow (Day 3-4)
- [ ] Notification system
- [ ] Offer form (parameters, price, validity)
- [ ] Tested lot upload
- [ ] My offers list

### Phase 4: Negotiation (Day 4-5)
- [ ] Negotiation chat thread
- [ ] Counter-offer form
- [ ] Offer timeline/audit
- [ ] Split quantity modal

### Phase 5: Back-Office Dashboard (Day 5-6)
- [ ] Live stats overview
- [ ] Trade table with filters
- [ ] Manual actions (force-match, invite seller)
- [ ] Seller performance panel
- [ ] Alerts panel

### Phase 6: Polish & Integration (Day 6-7)
- [ ] Add to main navigation
- [ ] Role-based access control
- [ ] Comprehensive testing
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] API documentation finalization

## Questions for User (Before Starting)

1. **Role Access:** Who should access Trade Desk? (All roles or specific subset?)
2. **Commodity Parameters:** Use existing Commodity Master and extend it?
3. **Location Master:** Is there an existing location hierarchy to use?
4. **Certificate Verification:** Simple tags for now, or upload required?
5. **Test Report:** Manual entry for Phase 1, or need OCR immediately?
6. **Price Visibility:** Full transparency or blind bidding option?
7. **Multi-Currency:** INR-only for now, or multi-currency from start?
8. **Sales Contract Link:** Confirmed NOT to link? (Generate separate contract type?)

## Success Metrics

### User Experience
- Buyer can create trade in <30 seconds via chat
- Seller can submit offer in <1 minute
- Match score explanation clear (no confusion)
- Real-time updates feel instant (<500ms latency)

### Technical
- WebSocket uptime >99.5%
- NLP parse accuracy >85%
- Page load <2 seconds
- No console errors
- Mobile-responsive (320px to 4K)

### Business
- Reduce trade creation time by 70% vs manual forms
- Increase seller participation (easy offer submission)
- Faster negotiation cycles (real-time vs email)
- Full audit trail for compliance

---

**Ready to implement after user confirms the questions above.**
