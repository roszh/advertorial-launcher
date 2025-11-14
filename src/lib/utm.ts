/**
 * UTM and Session Tracking Utilities
 * Handles parsing, storage, and recovery of UTM parameters from various sources
 */

export interface UtmData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  landing_page_url: string | null;
  first_touch_timestamp?: number;
}

const STORAGE_KEY = 'als_utm_data';
const SESSION_KEY = 'als_session_id';
const SESSION_RECORDED_PREFIX = 'als_session_recorded_';
const UTM_TTL_DAYS = 30;

/**
 * Parse UTM parameters from a URL string
 */
export function parseUtmFromUrl(url: string): Partial<UtmData> {
  try {
    const urlObj = new URL(url);
    return {
      utm_source: urlObj.searchParams.get('utm_source'),
      utm_medium: urlObj.searchParams.get('utm_medium'),
      utm_campaign: urlObj.searchParams.get('utm_campaign'),
      utm_term: urlObj.searchParams.get('utm_term'),
      utm_content: urlObj.searchParams.get('utm_content'),
    };
  } catch {
    return {};
  }
}

/**
 * Parse UTM parameters from referrer, including Facebook link shim recovery
 */
export function parseUtmFromReferrer(referrer: string): Partial<UtmData> & { recovered_url?: string } {
  if (!referrer) return {};

  try {
    const referrerUrl = new URL(referrer);
    
    // Special handling for Facebook link shim (l.facebook.com)
    if (referrerUrl.hostname === 'l.facebook.com') {
      const originalUrl = referrerUrl.searchParams.get('u');
      if (originalUrl) {
        console.debug('[Tracking] Recovering UTMs from Facebook link shim:', originalUrl);
        const decodedUrl = decodeURIComponent(originalUrl);
        const utms = parseUtmFromUrl(decodedUrl);
        return { ...utms, recovered_url: decodedUrl };
      }
    }

    // Try to parse UTMs from the referrer itself
    const utms = parseUtmFromUrl(referrer);
    
    // If no UTMs in referrer, infer source from hostname
    if (!utms.utm_source) {
      const hostname = referrerUrl.hostname.toLowerCase();
      if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
        return { utm_source: 'facebook', utm_medium: 'social' };
      } else if (hostname.includes('google.com')) {
        return { utm_source: 'google', utm_medium: 'organic' };
      } else if (hostname.includes('instagram.com')) {
        return { utm_source: 'instagram', utm_medium: 'social' };
      } else if (hostname.includes('twitter.com') || hostname.includes('t.co')) {
        return { utm_source: 'twitter', utm_medium: 'social' };
      } else if (hostname.includes('linkedin.com')) {
        return { utm_source: 'linkedin', utm_medium: 'social' };
      }
    }
    
    return utms;
  } catch {
    return {};
  }
}

/**
 * Read stored UTM data from localStorage
 */
export function readStoredUtm(): UtmData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: UtmData = JSON.parse(stored);
    
    // Check if UTM data has expired (30 days)
    if (data.first_touch_timestamp) {
      const age = Date.now() - data.first_touch_timestamp;
      const maxAge = UTM_TTL_DAYS * 24 * 60 * 60 * 1000;
      if (age > maxAge) {
        console.debug('[Tracking] Stored UTMs expired, clearing');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Write UTM data to localStorage with first-touch attribution
 */
export function writeStoredUtm(utmData: Partial<UtmData>): void {
  try {
    // Only write if we have at least one UTM parameter
    const hasUtm = utmData.utm_source || utmData.utm_medium || utmData.utm_campaign;
    if (!hasUtm) return;

    // Don't overwrite existing first-touch data
    const existing = readStoredUtm();
    if (existing) {
      console.debug('[Tracking] First-touch UTMs already stored, keeping original');
      return;
    }

    const dataToStore: UtmData = {
      utm_source: utmData.utm_source || null,
      utm_medium: utmData.utm_medium || null,
      utm_campaign: utmData.utm_campaign || null,
      utm_term: utmData.utm_term || null,
      utm_content: utmData.utm_content || null,
      landing_page_url: utmData.landing_page_url || null,
      first_touch_timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    console.debug('[Tracking] First-touch UTMs stored:', dataToStore);
  } catch (error) {
    console.error('[Tracking] Failed to store UTM data:', error);
  }
}

/**
 * Get UTM data with fallback priority: URL -> Referrer -> Stored
 */
export function getUtm(): UtmData & { source: 'url' | 'referrer' | 'stored' | 'none', recovered_landing_url?: string } {
  // 1. Try current URL
  const currentUrl = window.location.href;
  const urlUtms = parseUtmFromUrl(currentUrl);
  const hasUrlUtms = urlUtms.utm_source || urlUtms.utm_medium || urlUtms.utm_campaign;
  
  if (hasUrlUtms) {
    console.debug('[Tracking] UTMs found in URL:', urlUtms);
    return {
      ...urlUtms,
      utm_source: urlUtms.utm_source || null,
      utm_medium: urlUtms.utm_medium || null,
      utm_campaign: urlUtms.utm_campaign || null,
      utm_term: urlUtms.utm_term || null,
      utm_content: urlUtms.utm_content || null,
      landing_page_url: currentUrl,
      source: 'url',
    };
  }

  // 2. Try referrer (including Facebook link shim recovery)
  const referrer = document.referrer;
  const referrerData = parseUtmFromReferrer(referrer);
  const hasReferrerUtms = referrerData.utm_source || referrerData.utm_medium || referrerData.utm_campaign;
  
  if (hasReferrerUtms) {
    console.debug('[Tracking] UTMs recovered from referrer:', referrerData);
    return {
      utm_source: referrerData.utm_source || null,
      utm_medium: referrerData.utm_medium || null,
      utm_campaign: referrerData.utm_campaign || null,
      utm_term: referrerData.utm_term || null,
      utm_content: referrerData.utm_content || null,
      landing_page_url: referrerData.recovered_url || currentUrl,
      recovered_landing_url: referrerData.recovered_url,
      source: 'referrer',
    };
  }

  // 3. Try stored first-touch data
  const stored = readStoredUtm();
  if (stored) {
    console.debug('[Tracking] Using stored first-touch UTMs:', stored);
    return {
      ...stored,
      source: 'stored',
    };
  }

  // 4. No UTMs found
  console.debug('[Tracking] No UTMs found in URL, referrer, or storage');
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    landing_page_url: currentUrl,
    source: 'none',
  };
}

/**
 * Get or create a durable session ID
 */
export function getOrCreateSessionId(): string {
  try {
    // Try localStorage first
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) return sessionId;

    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
    console.debug('[Tracking] Created new session ID:', sessionId);
    return sessionId;
  } catch {
    // Fallback if localStorage fails
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Check if session has been recorded for this page
 */
export function isSessionRecorded(pageId: string): boolean {
  try {
    return localStorage.getItem(`${SESSION_RECORDED_PREFIX}${pageId}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark session as recorded for this page
 */
export function markSessionRecorded(pageId: string): void {
  try {
    localStorage.setItem(`${SESSION_RECORDED_PREFIX}${pageId}`, 'true');
  } catch (error) {
    console.error('[Tracking] Failed to mark session as recorded:', error);
  }
}

/**
 * Append UTM parameters to a URL if they're not already present
 */
export function appendUtmToUrl(url: string, utmData: Partial<UtmData>): string {
  try {
    const urlObj = new URL(url);
    
    // Only append if not already present
    if (!urlObj.searchParams.has('utm_source') && utmData.utm_source) {
      urlObj.searchParams.set('utm_source', utmData.utm_source);
    }
    if (!urlObj.searchParams.has('utm_medium') && utmData.utm_medium) {
      urlObj.searchParams.set('utm_medium', utmData.utm_medium);
    }
    if (!urlObj.searchParams.has('utm_campaign') && utmData.utm_campaign) {
      urlObj.searchParams.set('utm_campaign', utmData.utm_campaign);
    }
    if (!urlObj.searchParams.has('utm_term') && utmData.utm_term) {
      urlObj.searchParams.set('utm_term', utmData.utm_term);
    }
    if (!urlObj.searchParams.has('utm_content') && utmData.utm_content) {
      urlObj.searchParams.set('utm_content', utmData.utm_content);
    }

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}
