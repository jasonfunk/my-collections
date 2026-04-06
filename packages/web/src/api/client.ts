/**
 * Typed API client wrapping native fetch.
 *
 * - Prepends /api base path (proxied to NestJS at localhost:3000 in dev)
 * - Injects Authorization: Bearer <accessToken> on every request
 * - On 401: attempts one silent token refresh, then retries
 * - If refresh also fails, calls the registered logout handler
 *
 * The refresh + logout callbacks are registered by AuthContext at startup
 * to avoid a circular import dependency.
 */

import { getAccessToken } from '../auth/tokenStorage.js';

type RefreshFn = () => Promise<void>;
type LogoutFn = () => void;

let _refreshTokens: RefreshFn | null = null;
let _logout: LogoutFn | null = null;

export function registerAuthCallbacks(refresh: RefreshFn, logout: LogoutFn): void {
  _refreshTokens = refresh;
  _logout = logout;
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && retry && _refreshTokens) {
    try {
      await _refreshTokens();
      return request<T>(method, path, body, false);
    } catch {
      _logout?.();
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function uploadFile(path: string, file: File): Promise<{ url: string }> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api${path}`, {
    method: 'POST',
    // No Content-Type header — browser sets it automatically with multipart boundary
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }
  return response.json() as Promise<{ url: string }>;
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, body);
  },
  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>('PATCH', path, body);
  },
  delete(path: string): Promise<void> {
    return request<void>('DELETE', path);
  },
};
