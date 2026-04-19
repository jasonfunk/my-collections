/**
 * Token storage for mobile:
 *  - Access token:  in-memory (fast, never written to disk)
 *  - Refresh token: expo-secure-store (encrypted device keychain, survives app restarts)
 *
 * On app launch, AuthContext reads the refresh token from SecureStore and calls
 * POST /auth/token (refresh_token grant) with it in the request body.
 */

import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'mc_refresh_token';

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function clearAccessToken(): void {
  _accessToken = null;
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearAllTokens(): Promise<void> {
  _accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
