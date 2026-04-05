/**
 * PKCE (Proof Key for Code Exchange) utilities using the Web Crypto API.
 *
 * Flow:
 *  1. generateCodeVerifier()  → random 128-char string (stored in sessionStorage)
 *  2. generateCodeChallenge() → SHA-256 hash of verifier, base64url-encoded
 *  3. Send challenge in /auth/authorize + /auth/login
 *  4. Send original verifier in /auth/token to prove ownership
 */

const CODE_VERIFIER_KEY = 'mc_pkce_verifier';

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(96); // 96 bytes → 128 base64url chars
  crypto.getRandomValues(array);
  const verifier = base64urlEncode(array.buffer);
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);
  return verifier;
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(digest);
}

export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem(CODE_VERIFIER_KEY);
}

export function clearCodeVerifier(): void {
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
}
