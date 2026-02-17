/**
 * Advanced API client with retry logic, caching, and error handling
 * Implements exponential backoff and request deduplication
 */

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  retry?: number
  cache?: boolean
  timeout?: number
}

interface CachedResponse {
  data: unknown
  timestamp: number
  ttl: number
}

class APIClient {
  private baseURL: string
  private cache: Map<string, CachedResponse>
  private pendingRequests: Map<string, Promise<unknown>>

  constructor(baseURL = '/api') {
    this.baseURL = baseURL
    this.cache = new Map()
    this.pendingRequests = new Map()
  }

  /**
   * Makes HTTP request with automatic retry and caching
   */
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      retry = 3,
      cache = method === 'GET',
      timeout = 30000
    } = config

    const url = `${this.baseURL}${endpoint}`
    const cacheKey = `${method}:${url}:${JSON.stringify(body)}`

    // Return cached response if valid
    if (cache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (Date.now() - cached.timestamp < cached.ttl) {
        return cached.data as T
      }
      this.cache.delete(cacheKey)
    }

    // Deduplicate concurrent requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>
    }

    const requestPromise = this.executeRequest<T>(
      url,
      method,
      body,
      headers,
      retry,
      timeout
    )

    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise
      
      // Cache successful GET requests
      if (cache && method === 'GET') {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: 300000 // 5 minutes
        })
      }

      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  /**
   * Executes HTTP request with timeout and retry logic
   */
  private async executeRequest<T>(
    url: string,
    method: string,
    body: unknown,
    headers: Record<string, string>,
    retriesLeft: number,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Retry on server errors
        if (response.status >= 500 && retriesLeft > 0) {
          await this.delay(this.getRetryDelay(retriesLeft))
          return this.executeRequest(url, method, body, headers, retriesLeft - 1, timeout)
        }

        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(error.message || `Request failed with status ${response.status}`)
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      // Retry on network errors
      if (retriesLeft > 0 && this.isRetryableError(error)) {
        await this.delay(this.getRetryDelay(retriesLeft))
        return this.executeRequest(url, method, body, headers, retriesLeft - 1, timeout)
      }

      throw error
    }
  }

  /**
   * Calculates exponential backoff delay
   */
  private getRetryDelay(retriesLeft: number): number {
    const baseDelay = 1000
    const maxDelay = 10000
    const delay = baseDelay * Math.pow(2, 3 - retriesLeft)
    return Math.min(delay + Math.random() * 1000, maxDelay)
  }

  /**
   * Checks if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.name === 'AbortError' ||
        error.message.includes('fetch') ||
        error.message.includes('network')
      )
    }
    return false
  }

  /**
   * Delays execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clears all cached responses
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Prefetches data for faster subsequent requests
   */
  async prefetch(endpoint: string): Promise<void> {
    try {
      await this.request(endpoint, { cache: true })
    } catch {
      // Silently fail prefetch errors
    }
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Singleton instance
export const apiClient = new APIClient()

/**
 * Batch request handler for multiple concurrent API calls
 */
export async function batchRequest<T>(
  requests: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(requests.map(req => req()))
}

/**
 * Polls an endpoint until condition is met
 */
export async function pollUntil<T>(
  fetcher: () => Promise<T>,
  condition: (data: T) => boolean,
  maxAttempts = 10,
  interval = 2000
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    const data = await fetcher()
    if (condition(data)) {
      return data
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  throw new Error('Polling timeout exceeded')
}
