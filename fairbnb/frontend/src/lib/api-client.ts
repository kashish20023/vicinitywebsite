const API_BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
    : (process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000');

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const cleanEndpoint = endpoint.replace(/^\/api\//, '/');
  const url = `${API_BASE_URL}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;

  // Read auth token from localStorage if in browser
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('fairbnb_token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    throw new ApiError(
      `Unable to connect to backend server at ${url}. Please ensure the Fairbnb backend server is running on port 5000. (${networkError?.message || 'Failed to fetch'})`,
      0,
      { url, originalError: networkError?.message },
    );
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      (isJson && (data.message || data.error)) ||
      (Array.isArray(data.message) ? data.message.join(', ') : null) ||
      response.statusText ||
      'An error occurred';

    // If 401 Unauthorized, clear stale token
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('fairbnb_token');
      localStorage.removeItem('fairbnb_user');
    }

    throw new ApiError(
      Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      response.status,
      data,
    );
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
