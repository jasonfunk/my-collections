import { getAccessToken } from '../auth/tokenStorage';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

type RefreshFn = () => Promise<void>;
type LogoutFn = () => void;

let _refresh: RefreshFn | null = null;
let _logout: LogoutFn | null = null;
let refreshPromise: Promise<void> | null = null;

export function registerAuthCallbacks(refresh: RefreshFn, logout: LogoutFn): void {
  _refresh = refresh;
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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && retry && _refresh) {
    try {
      if (!refreshPromise) {
        refreshPromise = _refresh().finally(() => { refreshPromise = null; });
      }
      await refreshPromise;
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

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export const apiClient = {
  get<T>(path: string): Promise<T> { return request<T>('GET', path); },
  post<T>(path: string, body?: unknown): Promise<T> { return request<T>('POST', path, body); },
  patch<T>(path: string, body: unknown): Promise<T> { return request<T>('PATCH', path, body); },
  delete(path: string): Promise<void> { return request<void>('DELETE', path); },
};
