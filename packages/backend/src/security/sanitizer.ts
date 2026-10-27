import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Sanitizer module for defensive backend security:
 * - CRLF Injection defense in email headers
 * - Path traversal defense in attachment filenames
 * - XSS & protocol injection defense in URLs
 * - Zero-PII scrubbing for telemetry and logging
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Strips all carriage returns, newlines, null bytes and control characters
 * to completely eliminate CRLF / Email Header Injection (CWE-93).
 */
export function sanitizeHeader(value: string | undefined | null): string {
  if (!value) return '';
  return String(value)
    .replace(/[\r\n\0]/g, '') // Strip CRLF and null bytes
    .replace(/[\x00-\x1F\x7F]/g, '') // Strip ASCII control characters
    .trim();
}

/**
 * Sanitizes a filename to protect against Path Traversal (CWE-22)
 * and malicious filesystem character injection.
 */
export function sanitizeFilename(filename: string | undefined | null): string {
  if (!filename) return 'unnamed_file';
  
  // Extract strictly the basename, eliminating any ../ or directory traversal
  let safeName = path.basename(filename.replace(/\\/g, '/'));
  
  // Strip null bytes, path separators, and dangerous shell metacharacters
  safeName = safeName.replace(/[\0\r\n\\/:*?"<>|]/g, '_').trim();
  
  // Avoid hidden files or relative path prefixes
  if (safeName.startsWith('.')) {
    safeName = safeName.replace(/^\.+/, 'file_');
  }

  return safeName || 'unnamed_file';
}

/**
 * Validates and sanitizes URLs against XSS and protocol injection (CWE-79).
 * Only http:, https:, and mailto: protocols are permitted.
 * Blocks javascript:, data:, vbscript:, file:, etc.
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
      return parsed.toString();
    }
    // Blocked protocol
    return '';
  } catch {
    // Relative URLs or invalid schemes
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }
    return '';
  }
}

/**
 * Recursively scrubs Personally Identifiable Information (PII) from metadata objects
 * before logging or telemetry storage. Masks emails, tokens, and removes prohibited fields.
 */
export function scrubPiiMetadata(
  data: Record<string, unknown> | undefined | null,
  salt = 'threads-pii-salt'
): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};

  const prohibitedKeyPatterns = [
    /pass(word)?/i,
    /token/i,
    /secret/i,
    /auth/i,
    /body/i,
    /subject/i,
    /content/i,
    /text/i,
    /name/i,
    /phone/i,
    /credit_card/i,
  ];

  const scrubbed: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(data)) {
    // 1. Skip prohibited keys entirely
    if (prohibitedKeyPatterns.some((pattern) => pattern.test(key))) {
      continue;
    }

    if (typeof val === 'string') {
      // 2. Anonymize any email address found within strings
      const masked = val.replace(EMAIL_REGEX, (email) => {
        const hash = crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex').substring(0, 10);
        return `[REDACTED_EMAIL_${hash}]`;
      });
      scrubbed[key] = masked;
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      scrubbed[key] = val;
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      scrubbed[key] = scrubPiiMetadata(val as Record<string, unknown>, salt);
    }
  }

  return scrubbed;
}
