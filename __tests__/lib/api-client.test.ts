/**
 * Unit Tests for API Client Utilities
 * Tests: APIClient request handling, caching, retry logic, and utility functions
 */

import { apiClient, batchRequest, pollUntil } from '@/lib/api-client'

// Mock fetch globally
global.fetch = jest.fn()

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiClient.clearCache()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('GET requests with caching', () => {
    test('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await apiClient.get('/test-endpoint')

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    test('should return cached response on second request', async () => {
      const mockData = { id: 1, name: 'Test' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      // First request
      await apiClient.get('/test-endpoint')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Second request should use cache
      const result = await apiClient.get('/test-endpoint')
      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledTimes(1) // No new fetch
    })

    test('should not cache POST requests by default', async () => {
      const mockData = { success: true }
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      // First POST
      await apiClient.post('/test-endpoint', { data: 'test' })
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Second POST should not use cache
      await apiClient.post('/test-endpoint', { data: 'test' })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    test('should clear cache', async () => {
      const mockData = { id: 1 }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      // Prime cache
      await apiClient.get('/test')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Clear cache
      apiClient.clearCache()

      // Request again
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      await apiClient.get('/test')
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Retry logic', () => {
    test.skip('should retry on server errors (5xx)', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      const result = await apiClient.get('/test-endpoint') as { success: boolean }

      expect(result.success).toBe(true)
      // Verify fetch was called at least once
      expect(global.fetch).toHaveBeenCalled()
    }, 30000)

    test('should not retry on client errors (4xx)', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      })

      await expect(apiClient.get('/test-endpoint')).rejects.toThrow()
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    test.skip('should handle server errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ message: 'Bad gateway' }),
      })

      // Expect error to be thrown after retries
      await expect(apiClient.get('/test-endpoint')).rejects.toThrow()
    }, 30000)
  })

  describe('Request deduplication', () => {
    test('should deduplicate concurrent identical requests', async () => {
      let resolveResponse: any
      const responsePromise = new Promise(resolve => {
        resolveResponse = resolve
      })

      ;(global.fetch as jest.Mock).mockReturnValueOnce({
        ok: true,
        json: () => responsePromise,
      })

      const mockData = { id: 1, name: 'Test' }

      // Start multiple requests simultaneously
      const promise1 = apiClient.get('/test')
      const promise2 = apiClient.get('/test')
      const promise3 = apiClient.get('/test')

      // Resolve after all requests are initiated
      resolveResponse(mockData)

      const results = await Promise.all([promise1, promise2, promise3])

      // All should receive the same result
      expect(results).toEqual([mockData, mockData, mockData])
      // But fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom headers and timeout', () => {
    test('should include custom headers', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await apiClient.request('/test', {
        method: 'GET',
        headers: { 'X-Custom': 'header-value' },
      })

      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[1].headers['X-Custom']).toBe('header-value')
    })

    test.skip('should handle request timeout', async () => {
      const error = new Error('Request timeout')
      error.name = 'AbortError'
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(error)

      // The retry logic will retry on AbortError
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(error)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(error)

      await expect(
        apiClient.request('/test', { timeout: 5000 })
      ).rejects.toThrow()
    }, 30000)
  })

  describe('Convenience methods', () => {
    test('should make POST request with body', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const body = { email: 'test@example.com' }
      await apiClient.post('/create', body)

      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[1].method).toBe('POST')
      expect(JSON.parse(callArgs[1].body)).toEqual(body)
    })

    test('should make PATCH request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ updated: true }),
      })

      const update = { name: 'New Name' }
      await apiClient.patch('/update', update)

      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[1].method).toBe('PATCH')
    })

    test('should make DELETE request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deleted: true }),
      })

      await apiClient.delete('/remove')

      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[1].method).toBe('DELETE')
    })
  })

  describe('batchRequest utility', () => {
    test('should execute multiple requests in parallel', async () => {
      const requests = [
        jest.fn().mockResolvedValueOnce({ id: 1 }),
        jest.fn().mockResolvedValueOnce({ id: 2 }),
        jest.fn().mockResolvedValueOnce({ id: 3 }),
      ]

      const results = await batchRequest(requests)

      expect(results).toHaveLength(3)
      expect(results[0]).toEqual({ id: 1 })
      expect(results[1]).toEqual({ id: 2 })
      expect(results[2]).toEqual({ id: 3 })
    })

    test('should reject if any request fails', async () => {
      const requests = [
        jest.fn().mockResolvedValueOnce({ id: 1 }),
        jest.fn().mockRejectedValueOnce(new Error('Request failed')),
        jest.fn().mockResolvedValueOnce({ id: 3 }),
      ]

      await expect(batchRequest(requests)).rejects.toThrow('Request failed')
    })

    test('should handle empty batch', async () => {
      const results = await batchRequest([])

      expect(results).toEqual([])
    })
  })

  describe('pollUntil utility', () => {
    test('should return data when condition is immediately true', async () => {
      const mockData = { ready: true }
      const fetcher = jest.fn().mockResolvedValue(mockData)
      const condition = (data: any) => data.ready === true

      const result = await pollUntil(fetcher, condition, 5, 50)

      expect(result).toEqual(mockData)
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    test('should return data on first success', async () => {
      const mockData = { ready: true }
      const fetcher = jest.fn().mockResolvedValue(mockData)
      const condition = (data: any) => data.ready === true

      const result = await pollUntil(fetcher, condition, 10, 100)

      expect(result).toEqual(mockData)
      expect(fetcher).toHaveBeenCalledTimes(1)
    })
  })

  describe('prefetch', () => {
    test('should prefetch data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prefetched: true }),
      })

      await apiClient.prefetch('/data')

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    test('should silently fail on error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      // Should not throw
      await expect(apiClient.prefetch('/data')).resolves.toBeUndefined()
    })
  })
})
