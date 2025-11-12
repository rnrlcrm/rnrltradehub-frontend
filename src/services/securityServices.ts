/**
 * COMPLETE SECURITY IMPLEMENTATION
 * All security features in one place
 */

// ============================================================================
// IP WHITELISTING
// ============================================================================

export class IPWhitelistService {
  private static whitelist: Set<string> = new Set([
    '192.168.1.0/24', // Office network
    '10.0.0.0/8', // Internal network
  ]);

  static isWhitelisted(ip: string): boolean {
    return this.whitelist.has(ip) || this.isInSubnet(ip);
  }

  private static isInSubnet(ip: string): boolean {
    // Check if IP is in any whitelisted subnet
    for (const subnet of this.whitelist) {
      if (subnet.includes('/')) {
        // CIDR notation
        if (this.ipInRange(ip, subnet)) return true;
      }
    }
    return false;
  }

  private static ipInRange(ip: string, subnet: string): boolean {
    // Simple CIDR check (production should use proper library)
    const [range, bits] = subnet.split('/');
    return ip.startsWith(range.split('.').slice(0, parseInt(bits) / 8).join('.'));
  }
}

// ============================================================================
// GEO-LOCATION TRACKING
// ============================================================================

export interface GeoLocation {
  ip: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
}

export class GeoLocationService {
  static async track(ip: string): Promise<GeoLocation> {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      
      const location: GeoLocation = {
        ip,
        country: data.country_name,
        region: data.region,
        city: data.city,
        lat: data.latitude,
        lon: data.longitude,
        timezone: data.timezone,
      };

      // Store location
      await fetch('/api/security/track-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });

      return location;
    } catch (error) {
      console.error('Geo-location tracking failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// CONTENT SECURITY POLICY (CSP)
// ============================================================================

export class CSPService {
  static applyCSP(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.ipify.org https://ipapi.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    
    document.head.appendChild(meta);
  }
}

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

export const CORS_CONFIG = {
  allowedOrigins: [
    'http://localhost:3000',
    'https://tradehub.example.com',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// ============================================================================
// XSS PREVENTION
// ============================================================================

export class XSSPreventionService {
  /**
   * Sanitize HTML input
   */
  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Escape HTML special characters
   */
  static escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    
    return text.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Remove script tags
   */
  static removeScripts(html: string): string {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

export class CSRFService {
  private static token: string | null = null;

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('csrf_token', this.token);
    return this.token;
  }

  /**
   * Get current CSRF token
   */
  static getToken(): string | null {
    if (!this.token) {
      this.token = sessionStorage.getItem('csrf_token');
    }
    return this.token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    return token === this.getToken();
  }

  /**
   * Add CSRF token to request headers
   */
  static addTokenToHeaders(headers: Headers): Headers {
    const token = this.getToken();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
    return headers;
  }
}

// ============================================================================
// SECURE COOKIE FLAGS
// ============================================================================

export class SecureCookieService {
  /**
   * Set secure cookie
   */
  static setCookie(
    name: string,
    value: string,
    options: {
      maxAge?: number;
      path?: string;
      domain?: string;
    } = {}
  ): void {
    const cookieParts = [
      `${name}=${value}`,
      `HttpOnly`,
      `Secure`,
      `SameSite=Strict`,
    ];

    if (options.maxAge) {
      cookieParts.push(`Max-Age=${options.maxAge}`);
    }

    if (options.path) {
      cookieParts.push(`Path=${options.path}`);
    }

    if (options.domain) {
      cookieParts.push(`Domain=${options.domain}`);
    }

    document.cookie = cookieParts.join('; ');
  }

  /**
   * Get cookie value
   */
  static getCookie(name: string): string | null {
    const matches = document.cookie.match(
      new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`)
    );
    return matches ? decodeURIComponent(matches[1]) : null;
  }

  /**
   * Delete cookie
   */
  static deleteCookie(name: string): void {
    this.setCookie(name, '', { maxAge: -1 });
  }
}

// ============================================================================
// SQL INJECTION PREVENTION
// ============================================================================

export class SQLInjectionPreventionService {
  /**
   * Sanitize SQL input
   */
  static sanitize(input: string): string {
    // Remove SQL keywords and dangerous characters
    const dangerous = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 
      'ALTER', 'EXEC', 'EXECUTE', '--', ';', '/*', '*/', 'xp_',
    ];

    let sanitized = input;
    dangerous.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    return sanitized;
  }

  /**
   * Validate query parameter
   */
  static validateParam(param: string): boolean {
    // Check for SQL injection patterns
    const patterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /(--|\||;|\/\*|\*\/)/,
      /(\bOR\b.*=.*)/i,
      /(\bAND\b.*=.*)/i,
    ];

    return !patterns.some(pattern => pattern.test(param));
  }
}

// ============================================================================
// DDoS PROTECTION
// ============================================================================

export class DDoSProtectionService {
  private static requestCounts: Map<string, number[]> = new Map();

  /**
   * Check if request should be blocked
   */
  static shouldBlock(ip: string): boolean {
    const now = Date.now();
    const timestamps = this.requestCounts.get(ip) || [];

    // Remove old timestamps (older than 1 minute)
    const recentTimestamps = timestamps.filter(ts => now - ts < 60000);

    // Check if too many requests
    if (recentTimestamps.length > 1000) {
      return true; // Block
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.requestCounts.set(ip, recentTimestamps);

    return false;
  }
}

// ============================================================================
// DATA LOSS PREVENTION (DLP)
// ============================================================================

export class DLPService {
  private static sensitivePatterns = {
    pan: /[A-Z]{5}[0-9]{4}[A-Z]/g,
    gst: /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}/g,
    phone: /[6-9]\d{9}/g,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  };

  /**
   * Detect sensitive data in text
   */
  static detectSensitiveData(text: string): {
    found: boolean;
    types: string[];
  } {
    const found: string[] = [];

    for (const [type, pattern] of Object.entries(this.sensitivePatterns)) {
      if (pattern.test(text)) {
        found.push(type);
      }
    }

    return {
      found: found.length > 0,
      types: found,
    };
  }

  /**
   * Mask sensitive data
   */
  static maskSensitiveData(text: string): string {
    let masked = text;

    for (const pattern of Object.values(this.sensitivePatterns)) {
      masked = masked.replace(pattern, '***REDACTED***');
    }

    return masked;
  }

  /**
   * Check if export is allowed
   */
  static canExport(data: any[], userId: string): boolean {
    // Check user permissions
    const user = JSON.parse(localStorage.getItem('current_user') || '{}');
    
    // Only admins and managers can export
    if (!['Admin', 'Manager'].includes(user.role)) {
      return false;
    }

    // Check data volume
    if (data.length > 10000) {
      // Large exports require special approval
      return false;
    }

    return true;
  }
}

// ============================================================================
// SECURITY AUDIT
// ============================================================================

export interface SecurityAudit {
  id: string;
  date: string;
  findings: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
    description: string;
    recommendation: string;
  }>;
  score: number; // 0-100
}

export class SecurityAuditService {
  /**
   * Run security audit
   */
  static async runAudit(): Promise<SecurityAudit> {
    const findings: SecurityAudit['findings'] = [];
    let score = 100;

    // Check CSP
    if (!this.hasCSP()) {
      findings.push({
        severity: 'HIGH',
        category: 'CSP',
        description: 'Content Security Policy not configured',
        recommendation: 'Implement CSP headers',
      });
      score -= 15;
    }

    // Check HTTPS
    if (!location.protocol.includes('https')) {
      findings.push({
        severity: 'CRITICAL',
        category: 'HTTPS',
        description: 'Site not using HTTPS',
        recommendation: 'Enable HTTPS',
      });
      score -= 30;
    }

    // Check secure cookies
    if (!this.hasSecureCookies()) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Cookies',
        description: 'Cookies not using Secure flag',
        recommendation: 'Set Secure flag on all cookies',
      });
      score -= 10;
    }

    return {
      id: `AUDIT-${Date.now()}`,
      date: new Date().toISOString(),
      findings,
      score: Math.max(0, score),
    };
  }

  private static hasCSP(): boolean {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return !!meta;
  }

  private static hasSecureCookies(): boolean {
    return document.cookie.split(';').every(cookie => 
      cookie.includes('Secure') && cookie.includes('HttpOnly')
    );
  }
}

// Initialize security on app load
if (typeof window !== 'undefined') {
  // Apply CSP
  CSPService.applyCSP();
  
  // Generate CSRF token
  CSRFService.generateToken();
  
  // Run initial security audit
  SecurityAuditService.runAudit().then(audit => {
    console.log('[SECURITY] Audit complete. Score:', audit.score);
    if (audit.findings.length > 0) {
      console.warn('[SECURITY] Findings:', audit.findings);
    }
  });
}
