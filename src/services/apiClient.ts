/**
 * Simple API client utilities for making HTTP requests to various APIs
 */

// Define basic types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

/**
 * Creates a configured API client for a specific API endpoint
 */
export function createApiClient(options: ApiOptions) {
  const {
    baseUrl,
    headers: defaultHeaders = {},
    timeout = 30000,
    retries = 0
  } = options;

  // Normalize the base URL
  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;

  /**
   * Makes an HTTP request to the API
   */
  async function request<T>(
    path: string,
    method: HttpMethod = 'GET',
    body?: unknown,
    customHeaders: Record<string, string> = {},
    queryParams: Record<string, string | number | boolean | undefined> = {}
  ): Promise<T> {
    // Build the URL with query parameters
    let url = `${normalizedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    
    // Add query parameters if any
    if (Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
      ...customHeaders
    };

    // Setup fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: timeout ? AbortSignal.timeout(timeout) : undefined
    };

    // Add body for non-GET requests
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Function to handle a single request attempt
    const attemptRequest = async (attempt = 0): Promise<T> => {
      try {
        const response = await fetch(url, fetchOptions);
        
        let data: unknown;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = await response.text();
        } else {
          // Default to empty object for other content types
          data = {};
        }

        if (!response.ok) {
          const error = new Error(`API request failed with status ${response.status}`) as Error & {
            status?: number;
            data?: unknown;
          };
          error.status = response.status;
          error.data = data;
          throw error;
        }

        return data as T;
      } catch (error) {
        // Retry logic
        if (attempt < retries) {
          // Simple exponential backoff with jitter
          const delay = Math.min(
            1000 * Math.pow(2, attempt) + Math.random() * 1000,
            8000
          );
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptRequest(attempt + 1);
        }
        
        throw error;
      }
    };

    return attemptRequest();
  }

  // Return convenient methods for different HTTP verbs
  return {
    /**
     * Makes a GET request
     */
    get: <T>(
      path: string,
      queryParams: Record<string, string | number | boolean | undefined> = {},
      customHeaders: Record<string, string> = {}
    ) => request<T>(path, 'GET', undefined, customHeaders, queryParams),

    /**
     * Makes a POST request
     */
    post: <T>(
      path: string,
      body?: unknown,
      customHeaders: Record<string, string> = {},
      queryParams: Record<string, string | number | boolean | undefined> = {}
    ) => request<T>(path, 'POST', body, customHeaders, queryParams),

    /**
     * Makes a PUT request
     */
    put: <T>(
      path: string,
      body?: unknown,
      customHeaders: Record<string, string> = {},
      queryParams: Record<string, string | number | boolean | undefined> = {}
    ) => request<T>(path, 'PUT', body, customHeaders, queryParams),

    /**
     * Makes a PATCH request
     */
    patch: <T>(
      path: string,
      body?: unknown,
      customHeaders: Record<string, string> = {},
      queryParams: Record<string, string | number | boolean | undefined> = {}
    ) => request<T>(path, 'PATCH', body, customHeaders, queryParams),

    /**
     * Makes a DELETE request
     */
    delete: <T>(
      path: string,
      customHeaders: Record<string, string> = {},
      queryParams: Record<string, string | number | boolean | undefined> = {}
    ) => request<T>(path, 'DELETE', undefined, customHeaders, queryParams)
  };
} 