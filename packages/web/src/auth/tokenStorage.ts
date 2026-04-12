/**
 * Token storage strategy:
 *  - Access token:  in-memory only (never persisted — lost on page refresh, restored via refresh token)
 *  - Refresh token: httpOnly cookie set by the server (never accessible to JavaScript)
 *
 * On page reload, AuthContext calls POST /auth/token (refresh_token grant) with no body —
 * the browser sends the cookie automatically. If the cookie is absent or expired the server
 * returns 401 and the user is treated as logged out.
 */

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setTokens(accessToken: string): void {
  _accessToken = accessToken;
}

export function clearTokens(): void {
  _accessToken = null;
  // Migration: remove the old localStorage refresh-token key written by the
  // pre-httpOnly-cookie implementation. Safe to call repeatedly (no-op if absent).
  localStorage.removeItem('mc_rt');
}
