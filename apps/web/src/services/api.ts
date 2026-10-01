import { ApiResponse, ApiErrorResponse } from '@kraxyy/types';

const API_BASE = '/api/v1';

class ApiClient {
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.accessToken = localStorage.getItem('kraxyy_access_token');
  }

  setToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('kraxyy_access_token', token);
    } else {
      localStorage.removeItem('kraxyy_access_token');
    }
  }

  getToken(): string | null {
    return this.accessToken;
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    let response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 and attempt refresh
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData.data.accessToken;
            this.setToken(newToken);
            this.onTokenRefreshed(newToken);
            headers.set('Authorization', `Bearer ${newToken}`);
            response = await fetch(url, { ...options, headers });
          } else {
            this.setToken(null);
            window.location.href = '/login';
          }
        } catch {
          this.setToken(null);
          window.location.href = '/login';
        } finally {
          this.isRefreshing = false;
        }
      } else {
        // Wait for refresh to complete
        const retryToken = await new Promise<string>((resolve) => {
          this.addRefreshSubscriber((token) => resolve(token));
        });
        headers.set('Authorization', `Bearer ${retryToken}`);
        response = await fetch(url, { ...options, headers });
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const err = (data as ApiErrorResponse).error;
      throw new Error(err?.message || 'An error occurred');
    }

    return (data as ApiResponse<T>).data;
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
