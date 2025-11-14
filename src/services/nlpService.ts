/**
 * NLP Service for Trade Desk Chat Parsing
 * 
 * Uses Google Gemini AI to parse natural language buyer/seller messages
 * and extract structured trade information (commodity, quantity, parameters, etc.)
 */

import { NLPParseRequest, NLPParseResponse, TradeAction } from '../types/tradedesk.types';

// Gemini AI would be integrated here - for now we use fallback parser
const genAI = null; // Will be initialized when API key is available

/**
 * System prompt for Gemini to understand trade desk context
 */
const SYSTEM_PROMPT = `You are an AI assistant for a commodity trading platform. Your task is to parse natural language messages from buyers and sellers and extract structured trade information.

Extract the following information from user messages:
1. **action**: "buy" or "sell" (default to "buy" if unclear)
2. **commodity_hint**: Name of the commodity (e.g., "cotton", "wheat", "rice")
3. **quantity**: Numerical quantity
4. **unit**: Unit of measurement (e.g., "bales", "quintal", "tonnes", "kgs")
5. **certificates**: Array of certification types (e.g., ["NPOP", "Organic", "Fair Trade", "BCI"])
6. **parameterHints**: Quality parameters with min/max ranges (e.g., {"staple_mm": {"min": 28, "max": 30}})

Common commodities and their parameters:
- **Cotton**: staple_mm (26-34), mic (3.0-5.5), strength_gpt (20-35), trash_pct (0-5), moisture_pct (0-12)
- **Wheat**: protein_pct (8-18), moisture_pct (8-14), test_weight (60-85)
- **Rice**: moisture_pct (8-15), broken_pct (0-35), length_mm (4-8)

Common certificates: NPOP, Organic, Fair Trade, BCI, GOTS, Rainforest Alliance

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "action": "buy" | "sell",
  "commodity_hint": string,
  "commodityId": null,
  "quantity": number | null,
  "unit": string | null,
  "certificates": string[],
  "parameterHints": { [param: string]: { "min": number, "max": number } },
  "confidence": number (0.0 to 1.0)
}

If you cannot parse the message with confidence >= 0.5, return:
{
  "action": "buy",
  "commodity_hint": "",
  "commodityId": null,
  "quantity": null,
  "unit": null,
  "certificates": [],
  "parameterHints": {},
  "confidence": 0.0
}`;

/**
 * Commodity name to ID mapping (would come from backend in real app)
 */
const COMMODITY_MAP: Record<string, number> = {
  'cotton': 12,
  'wheat': 15,
  'rice': 18,
  'soybean': 20,
  'corn': 22,
  'maize': 22,
  'sugar': 25,
  'turmeric': 28,
  'cumin': 30
};

/**
 * Parse natural language message using Gemini AI
 */
export async function parseNLPMessage(request: NLPParseRequest): Promise<NLPParseResponse> {
  // For now, always use fallback parser
  // TODO: Integrate with Gemini once API is properly configured
  console.warn('[NLP] Using fallback parser (Gemini integration pending)');
  return fallbackParser(request.text);
  
  /* Gemini integration code (uncomment when ready):
  if (!genAI) {
    console.warn('[NLP] No Gemini API key configured, using fallback parser');
    return fallbackParser(request.text);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `${SYSTEM_PROMPT}\n\nUser message: "${request.text}"`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const parsed = JSON.parse(text.trim());
    
    // Map commodity hint to ID if found
    if (parsed.commodity_hint && !parsed.commodityId) {
      const hint = parsed.commodity_hint.toLowerCase();
      parsed.commodityId = COMMODITY_MAP[hint] || null;
    }
    
    // Ensure confidence is between 0 and 1
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence || 0));
    
    console.log('[NLP] Parsed successfully:', parsed);
    return parsed;
  } catch (error) {
    console.error('[NLP] Gemini parsing failed:', error);
    
    // Fallback to simple regex-based parsing
    return fallbackParser(request.text);
  }
  */
}

/**
 * Fallback parser using simple regex patterns
 * Used when Gemini is not available or fails
 */
function fallbackParser(text: string): NLPParseResponse {
  const lowerText = text.toLowerCase();
  
  // Determine action
  let action: TradeAction = TradeAction.BUY;
  if (lowerText.includes('sell') || lowerText.includes('selling') || lowerText.includes('offer')) {
    action = TradeAction.SELL;
  }
  
  // Extract commodity
  let commodity_hint = '';
  let commodityId: number | undefined = undefined;
  
  for (const [name, id] of Object.entries(COMMODITY_MAP)) {
    if (lowerText.includes(name)) {
      commodity_hint = name;
      commodityId = id;
      break;
    }
  }
  
  // Extract quantity and unit
  let quantity: number | undefined = undefined;
  let unit: string | undefined = undefined;
  
  // Pattern: "500 bales", "1000 quintal", etc.
  const quantityMatch = text.match(/(\d+(?:,\d+)*)\s*(bales?|quintals?|tonnes?|kgs?|qty|candy)/i);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1].replace(/,/g, ''));
    unit = quantityMatch[2].toLowerCase();
    
    // Normalize units
    if (unit.startsWith('bale')) unit = 'bales';
    else if (unit.startsWith('quintal')) unit = 'quintal';
    else if (unit.startsWith('tonne')) unit = 'tonnes';
    else if (unit.startsWith('kg')) unit = 'kgs';
  }
  
  // Extract certificates
  const certificates: string[] = [];
  const certPatterns = ['npop', 'organic', 'fair trade', 'bci', 'gots', 'rainforest alliance'];
  
  for (const cert of certPatterns) {
    if (lowerText.includes(cert)) {
      certificates.push(cert.toUpperCase().replace(' ', '_'));
    }
  }
  
  // Extract parameter hints (basic)
  const parameterHints: Record<string, { min: number; max: number }> = {};
  
  // Pattern: "staple 28-30", "mic 3.8 to 4.2", etc.
  const stapleMatch = text.match(/staple\s+(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)/i);
  if (stapleMatch) {
    parameterHints['staple_mm'] = {
      min: parseFloat(stapleMatch[1]),
      max: parseFloat(stapleMatch[2])
    };
  }
  
  const micMatch = text.match(/mic(?:ronaire)?\s+(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)/i);
  if (micMatch) {
    parameterHints['mic'] = {
      min: parseFloat(micMatch[1]),
      max: parseFloat(micMatch[2])
    };
  }
  
  // Calculate confidence
  let confidence = 0.0;
  if (commodity_hint) confidence += 0.4;
  if (quantity) confidence += 0.3;
  if (unit) confidence += 0.2;
  if (Object.keys(parameterHints).length > 0) confidence += 0.1;
  
  const result: NLPParseResponse = {
    action,
    commodity_hint,
    commodityId,
    quantity,
    unit,
    certificates,
    parameterHints,
    confidence
  };
  
  console.log('[NLP] Fallback parser result:', result);
  return result;
}

/**
 * Suggest next questions based on parsed data
 * Helps guide the conversation
 */
export function suggestNextQuestions(parsed: NLPParseResponse): string[] {
  const questions: string[] = [];
  
  if (!parsed.commodity_hint) {
    questions.push("Which commodity are you interested in? (Cotton, Wheat, Rice, etc.)");
  }
  
  if (!parsed.quantity) {
    questions.push("How much quantity do you need?");
  }
  
  if (!parsed.unit && parsed.quantity) {
    questions.push("In which unit? (Bales, Quintal, Tonnes, Kgs)");
  }
  
  if (parsed.commodity_hint === 'cotton' && Object.keys(parsed.parameterHints).length === 0) {
    questions.push("What quality parameters do you prefer? (e.g., staple 28-30, mic 3.8-4.2)");
  }
  
  if (parsed.certificates.length === 0) {
    questions.push("Do you need any certifications? (Organic, NPOP, Fair Trade, etc.)");
  }
  
  return questions;
}

/**
 * Format parsed data as confirmation message
 */
export function formatParsedDataConfirmation(parsed: NLPParseResponse): string {
  if (parsed.confidence < 0.5) {
    return "I couldn't quite understand that. Could you please clarify?";
  }
  
  const parts: string[] = [];
  
  if (parsed.action) {
    parts.push(parsed.action === 'buy' ? 'Buying' : 'Selling');
  }
  
  if (parsed.quantity && parsed.unit) {
    parts.push(`${parsed.quantity} ${parsed.unit}`);
  } else if (parsed.quantity) {
    parts.push(`${parsed.quantity} units`);
  }
  
  if (parsed.commodity_hint) {
    parts.push(`of ${parsed.commodity_hint}`);
  }
  
  if (parsed.certificates.length > 0) {
    parts.push(`with ${parsed.certificates.join(', ')} certification`);
  }
  
  if (Object.keys(parsed.parameterHints).length > 0) {
    const params = Object.entries(parsed.parameterHints)
      .map(([key, range]) => `${key}: ${range.min}-${range.max}`)
      .join(', ');
    parts.push(`(${params})`);
  }
  
  return parts.join(' ');
}

/**
 * Validate parsed data completeness
 * Returns array of missing required fields
 */
export function validateParsedData(parsed: NLPParseResponse): string[] {
  const missing: string[] = [];
  
  if (!parsed.commodityId && !parsed.commodity_hint) {
    missing.push('commodity');
  }
  
  if (!parsed.quantity) {
    missing.push('quantity');
  }
  
  if (!parsed.unit) {
    missing.push('unit');
  }
  
  return missing;
}

/**
 * Get example messages for guidance
 */
export function getExampleMessages(): string[] {
  return [
    "Need 500 bales organic cotton with staple 28-30",
    "Buying 1000 quintal wheat with protein 12-14%",
    "Sell 200 tonnes rice, moisture max 12%",
    "I want 300 bales NPOP cotton, mic 3.8-4.2",
    "Looking for 2000 kgs fair trade sugar"
  ];
}
