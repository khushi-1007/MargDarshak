/**
 * Centralized API Client for MargDarshak Full-Stack System.
 * Connects frontend to the backend REST API with automatic Bearer token injection,
 * response unwrapping, and structured error handling.
 */

export interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
  meta?: Record<string, any>;
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, code = 'API_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  private loginPromise: Promise<string | null> | null = null;

  constructor() {
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    // If envUrl is explicitly empty string, use relative proxy path
    if (envUrl === '') {
      this.baseUrl = '';
    } else if (typeof envUrl === 'string' && envUrl.length > 0) {
      this.baseUrl = envUrl.replace(/\/+$/, '');
    } else {
      // Default to empty string for Vite proxy
      this.baseUrl = '';
    }

    // Try to load cached token from localStorage
    try {
      this.token = localStorage.getItem('margdarshak_auth_token');
    } catch {
      this.token = null;
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      try {
        localStorage.setItem('margdarshak_auth_token', token);
      } catch {
        // ignore storage errors
      }
    } else {
      try {
        localStorage.removeItem('margdarshak_auth_token');
      } catch {
        // ignore
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  /**
   * Proactively guarantee authentication is established before firing initial API requests
   */
  async ensureAuth(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    return this.tryAutoLogin();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Normalise endpoint prefix
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${path.startsWith('/api') || path.startsWith('/health') || path === '/' ? path : `/api/v1${path}`}`;

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Attach Bearer token if available
    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Attempt automatic login with default dispatcher credentials if token is missing/expired
        if (!options.headers || !(options.headers as any)['x-retry-auth']) {
          const autoToken = await this.tryAutoLogin();
          if (autoToken) {
            headers.set('Authorization', `Bearer ${autoToken}`);
            headers.set('x-retry-auth', 'true');
            const retryRes = await fetch(url, { ...options, headers });
            return this.handleResponse<T>(retryRes);
          }
        }
      }

      return await this.handleResponse<T>(response);
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        err.message || 'Network error: Failed to communicate with MargDarshak backend.',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // not JSON
    }

    if (!response.ok) {
      const errorDetail = json?.detail || json?.error?.message || response.statusText || 'Request failed';
      const errorCode = json?.error?.code || `HTTP_${response.status}`;
      throw new ApiError(
        typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail),
        response.status,
        errorCode,
        json?.error?.details
      );
    }

    // Backend ApiResponse standard: { success: true, data: T, ... }
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }

    return json as T;
  }

  /**
   * Helper to automatically authenticate as default dispatcher if no token is set.
   * Uses a shared Promise to deduplicate multiple concurrent calls.
   */
  async tryAutoLogin(): Promise<string | null> {
    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.loginPromise = (async () => {
      try {
        const loginUrl = `${this.baseUrl}/api/v1/auth/login`;
        const res = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'dispatcher@margdarshak.ai',
            password: 'dispatch123',
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const token = json?.data?.access_token || json?.access_token;
          if (token) {
            this.setToken(token);
            return token;
          }
        }
      } catch (err) {
        console.warn('Auto-login attempt encountered an issue:', err);
      } finally {
        this.loginPromise = null;
      }
      return null;
    })();

    return this.loginPromise;
  }

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      }
      const qs = query.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
