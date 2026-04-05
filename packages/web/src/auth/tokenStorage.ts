/**
 * Token storage strategy:
 *  - Access token:  in-memory only (never persisted — lost on page refresh, restored via refresh token)
 *  - Refresh token: localStorage under key 'mc_rt' (personal app trade-off; httpOnly cookie
 *                   would be more secure but requires server-side cookie support)
 */

const REFRESH_TOKEN_KEY = 'mc_rt';

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  _accessToken = accessToken;
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  _accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
