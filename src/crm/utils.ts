/**
 * LinkedIn Lead CRM - Utility Functions
 */

/**
 * Generates a hash from a string (profile URL).
 * Uses a simple but effective hashing algorithm.
 *
 * @param str - String to hash
 * @returns Hash string
 */
export async function hashString(str: string): Promise<string> {
  // Use Web Crypto API for consistent hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generates a unique ID.
 *
 * @returns Unique ID string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gets the current timestamp in ISO 8601 format.
 *
 * @returns ISO 8601 timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Normalizes a LinkedIn profile URL to ensure consistency.
 *
 * @param url - Profile URL to normalize
 * @returns Normalized URL
 */
export function normalizeProfileUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove query parameters and trailing slashes
    const path = urlObj.pathname.replace(/\/$/, '');
    return `${urlObj.protocol}//${urlObj.host}${path}`;
  } catch {
    // If URL parsing fails, just return trimmed version
    return url.trim();
  }
}

/**
 * Validates if a string is a valid ISO 8601 date.
 *
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}
