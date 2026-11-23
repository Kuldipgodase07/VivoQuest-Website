export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

export async function http<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;
  let url = endpoint.startsWith('http') ? endpoint : BASE_URL + endpoint;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => searchParams.append(k, String(v)));
    url += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('vq_token') : null;
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorBody || res.statusText}`);
  }

  return res.json() as Promise<T>;
}
