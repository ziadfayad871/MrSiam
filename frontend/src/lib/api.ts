import type { ApiResponse } from './types';

const TOKEN_KEY = 'mrsiam_token';

const API_BASE: string = import.meta.env.VITE_API_URL ?? '';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const b = body as Record<string, unknown>;
  if (typeof b.message === 'string' && b.message) return b.message;
  if (typeof b.title === 'string' && b.title) {
    const errors = b.errors as Record<string, unknown> | undefined;
    if (errors) {
      const first = Object.values(errors)[0];
      const val = Array.isArray(first) ? first[0] : first;
      if (typeof val === 'string' && val) return val;
    }
    return b.title;
  }
  return fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, cache: 'no-store', headers });

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok) {
    throw new ApiError(extractMessage(body, 'حصل خطأ غير متوقع'), res.status);
  }

  if (body && !body.success) {
    throw new ApiError(body.message ?? 'فشلت العملية', res.status);
  }

  return (body?.data ?? body) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE}/api${path}`, { method: 'POST', body: formData, headers, cache: 'no-store' }).then(async (res) => {
      const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
      if (!res.ok) throw new ApiError(body?.message ?? 'فشل رفع البيانات', res.status);
      if (body && !body.success) throw new ApiError(body.message ?? 'فشلت العملية', res.status);
      return (body?.data ?? body) as T;
    });
  },
  uploadForm: <T>(method: 'POST' | 'PUT' | 'PATCH', path: string, formData: FormData) => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE}/api${path}`, { method, body: formData, headers, cache: 'no-store' }).then(async (res) => {
      const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
      if (!res.ok) throw new ApiError(body?.message ?? 'فشل رفع البيانات', res.status);
      if (body && !body.success) throw new ApiError(body.message ?? 'فشلت العملية', res.status);
      return (body?.data ?? body) as T;
    });
  },
};

export function resolveFileUrl(photoUrl?: string | null): string | undefined {
  if (!photoUrl) return undefined;
  return photoUrl.startsWith('http') ? photoUrl : `${API_BASE}${photoUrl}`;
}
