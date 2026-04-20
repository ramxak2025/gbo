/**
 * iBorcuha mobile — HTTP client with auth + refresh support
 *
 * - Bearer Authorization header (cookies not available in RN)
 * - Automatic refresh-token on 401 (single-flight to avoid stampedes)
 * - Error class `ApiError` for typed handling
 */
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'

const API_BASE: string =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ||
  'https://iborcuha.ru'

const TOKEN_KEY = 'iborcuha_token'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown
  readonly code?: string

  constructor(status: number, body: unknown, message?: string) {
    const bodyObj = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
    super(message ?? (bodyObj.error as string | undefined) ?? `HTTP ${status}`)
    this.status = status
    this.body = body
    this.code = bodyObj.errorType as string | undefined
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token)
  else await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined)
}

// Single-flight refresh — multiple 401s during concurrent requests wait on one refresh
let refreshPromise: Promise<string | null> | null = null

async function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const currentToken = await getToken()
    if (!currentToken) return null
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      })
      if (!res.ok) return null
      const data = (await res.json()) as { token?: string }
      if (data.token) {
        await setToken(data.token)
        return data.token
      }
      return null
    } catch {
      return null
    } finally {
      // Reset after some tick to allow piggyback within same microtask
      setTimeout(() => { refreshPromise = null }, 0)
    }
  })()
  return refreshPromise
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  skipAuth?: boolean
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
  retry = true,
): Promise<T> {
  const token = options.skipAuth ? null : await getToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  let body: BodyInit | undefined
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body
    } else {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const url = path.startsWith('http') ? path : `${API_BASE}/api${path}`

  let res: Response
  try {
    res = await fetch(url, { ...options, headers, body })
  } catch (err) {
    throw new ApiError(0, null, err instanceof Error ? err.message : 'Сеть недоступна')
  }

  // Auto-refresh once on 401
  if (res.status === 401 && retry && !options.skipAuth) {
    const newToken = await refreshToken()
    if (newToken) return apiRequest<T>(path, options, false)
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }

  if (!res.ok) throw new ApiError(res.status, data)
  return data as T
}

export const api = {
  // Auth
  login: (phone: string, password: string) =>
    apiRequest<{ token: string; userId: string; role: string; user: unknown; student?: unknown }>('/auth/login', {
      method: 'POST',
      body: { phone, password },
      skipAuth: true,
    }),
  register: (payload: Record<string, unknown>) =>
    apiRequest<{ ok: true; message: string }>('/auth/register', { method: 'POST', body: payload, skipAuth: true }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest<unknown>('/auth/me'),
  refresh: () => apiRequest<{ token: string }>('/auth/refresh', { method: 'POST' }),

  // Data (generic)
  get: <T = unknown>(path: string) => apiRequest<T>(path),
  post: <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  put: <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  del: <T = unknown>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'DELETE', body }),

  // Push
  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    apiRequest<{ ok: true }>('/push/register-token', { method: 'POST', body: { token, platform } }),
  unregisterPushToken: (token: string) =>
    apiRequest<{ ok: true }>('/push/unregister-token', { method: 'POST', body: { token } }),
}
