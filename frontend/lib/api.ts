const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/foshol/public/api';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { requireAuth = false, headers, ...restOptions } = options;

  const mergedHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers,
  };

  if (requireAuth) {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        (mergedHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: mergedHeaders,
    ...restOptions,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthenticated');
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `API request failed with status ${response.status}`);
  }

  return response.json().catch(() => ({}));
}
