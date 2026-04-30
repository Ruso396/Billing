import { apiUrl } from '../config/api';
import type { AuthUser, LoginResponse } from '../types/api';

export type HttpMethod = 'GET' | 'POST';

type FetchOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  token?: string | null;
};

function withQuery(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>
) {
  if (!query) {
    return path;
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  const queryString = params.toString();
  if (!queryString) {
    return path;
  }
  return `${path}${path.includes('?') ? '&' : '?'}${queryString}`;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'POST', body, query, token } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const endpoint = withQuery(path, query);
  const init: RequestInit = { method, headers };
  if (method !== 'GET' && body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(apiUrl(endpoint), init);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new Error(`Request failed for ${path}: ${message}`);
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid JSON from ${path}: ${text.slice(0, 200)}`);
  }
  return json as T;
}

export function getCompanyId(user: AuthUser | null) {
  return user?.company_id ?? null;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('auth/login.php', {
    method: 'POST',
    body: { email, password },
  });
}
