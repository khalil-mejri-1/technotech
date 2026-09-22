/**
 * RFC 6238 / RFC 4226 Time-Based One-Time Password (TOTP) Implementation
 * Designed for Google Authenticator compatibility using native Web Crypto API.
 */

// Default Base32 secret key for TechnoTech Admin (A-Z, 2-7)
export const DEFAULT_ADMIN_TOTP_SECRET = 'TECHNOTECHSECUREKEYFORADMIN23456';

/**
 * Decodes a Base32 string into a Uint8Array.
 * Follows RFC 4648 standard alphabet (A-Z, 2-7).
 */
export function base32ToUint8Array(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = (base32 || '')
    .toUpperCase()
    .replace(/=+$/, '')
    .replace(/\s+/g, '');

  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned[i]);
    if (val === -1) {
      throw new Error(`Caractère Base32 invalide: ${cleaned[i]}`);
    }
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

/**
 * Generates a 6-digit TOTP code for a given timestamp.
 */
export async function generateTOTP(secretBase32, timeStep = 30, time = Date.now()) {
  const keyBytes = base32ToUint8Array(secretBase32);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;

  const key = await cryptoObj.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const counter = Math.floor(time / 1000 / timeStep);
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setBigUint64(0, BigInt(counter), false); // Big-endian 64-bit int

  const signature = await cryptoObj.subtle.sign('HMAC', key, counterBuffer);
  const hmac = new Uint8Array(signature);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code against the secret key.
 * Allows +/- window (default 1 = +/- 30s) to handle slight clock drift.
 */
export async function verifyTOTP(token, secretBase32 = DEFAULT_ADMIN_TOTP_SECRET, window = 1, time = Date.now()) {
  const cleanToken = (token || '').toString().trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  const timeStep = 30;
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const checkTime = time + (errorWindow * timeStep * 1000);
    const expected = await generateTOTP(secretBase32, timeStep, checkTime);
    if (expected === cleanToken) {
      return true;
    }
  }

  return false;
}

/**
 * Formats a Base32 secret for human readability (groups of 4 characters).
 */
export function formatSecretKey(secret = DEFAULT_ADMIN_TOTP_SECRET) {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Generates the standard otpauth:// URL for Google Authenticator.
 */
export function getOtpAuthUrl(
  label = 'TechnoTech:Admin',
  issuer = 'TechnoTech',
  secret = DEFAULT_ADMIN_TOTP_SECRET
) {
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}`;
}

/**
 * Generates a high-quality QR code image URL for scanning with Google Authenticator.
 */
export function getQrCodeUrl(
  label = 'TechnoTech:Admin',
  issuer = 'TechnoTech',
  secret = DEFAULT_ADMIN_TOTP_SECRET,
  size = 220
) {
  const otpAuth = getOtpAuthUrl(label, issuer, secret);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(otpAuth)}&margin=10`;
}
