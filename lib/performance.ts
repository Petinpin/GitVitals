/**
 * Performance optimization utilities
 * Implements memoization, lazy loading, and virtualization
 */

type Func = (...args: any[]) => any

/**
 * Memoization with LRU cache eviction policy
 */
export function memoize<T extends Func>(
  fn: T,
  options: { maxSize?: number; ttl?: number } = {}
): T {
  const cache = new Map<string, { value: any; timestamp: number }>()
  const maxSize = options.maxSize || 100
  const ttl = options.ttl || Infinity

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)

    // Check cache validity
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value
    }

    // Compute and cache result
    const result = fn(...args)
    cache.set(key, { value: result, timestamp: Date.now() })

    // Evict oldest entry if cache is full
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    return result
  }) as T
}

/**
 * Debounce function execution
 */
export function debounce<T extends Func>(fn: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null

  return ((...args: Parameters<T>): void => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

/**
 * Throttle function execution
 */
export function throttle<T extends Func>(fn: T, limit: number): T {
  let inThrottle = false

  return ((...args: Parameters<T>): void => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

/**
 * Batch operations for efficiency
 */
export class BatchProcessor<T, R> {
  private queue: T[] = []
  private processing = false
  private batchSize: number
  private delayMs: number
  private processor: (batch: T[]) => Promise<R[]>

  constructor(
    processor: (batch: T[]) => Promise<R[]>,
    options: { batchSize?: number; delayMs?: number } = {}
  ) {
    this.processor = processor
    this.batchSize = options.batchSize || 50
    this.delayMs = options.delayMs || 100
  }

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(item)
      
      setTimeout(() => {
        if (!this.processing) {
          this.processBatch().catch(reject)
        }
      }, this.delayMs)
    })
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const batch = this.queue.splice(0, this.batchSize)

    try {
      await this.processor(batch)
    } finally {
      this.processing = false
      
      if (this.queue.length > 0) {
        await this.processBatch()
      }
    }
  }
}

/**
 * Virtual scrolling implementation for large lists
 */
export function calculateVirtualItems(
  scrollOffset: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { startIndex: number; endIndex: number; offsetY: number } {
  const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollOffset + containerHeight) / itemHeight) + overscan
  )
  const offsetY = startIndex * itemHeight

  return { startIndex, endIndex, offsetY }
}

/**
 * Lazy loading with intersection observer
 */
export function createLazyLoader(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): {
  observe: (element: Element) => void
  unobserve: (element: Element) => void
  disconnect: () => void
} {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry)
      }
    })
  }, {
    root: options.root || null,
    rootMargin: options.rootMargin || '50px',
    threshold: options.threshold || 0.1
  })

  return {
    observe: (element) => observer.observe(element),
    unobserve: (element) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  }
}

/**
 * Request deduplication to prevent duplicate API calls
 */
export class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>()

  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>
    }

    const promise = fetcher().finally(() => {
      this.pending.delete(key)
    })

    this.pending.set(key, promise)
    return promise
  }

  clear(): void {
    this.pending.clear()
  }
}

/**
 * Resource pool for connection management
 */
export class ResourcePool<T> {
  private available: T[] = []
  private inUse = new Set<T>()
  private factory: () => T | Promise<T>
  private maxSize: number

  constructor(factory: () => T | Promise<T>, maxSize: number = 10) {
    this.factory = factory
    this.maxSize = maxSize
  }

  async acquire(): Promise<T> {
    if (this.available.length > 0) {
      const resource = this.available.pop()!
      this.inUse.add(resource)
      return resource
    }

    if (this.inUse.size < this.maxSize) {
      const resource = await this.factory()
      this.inUse.add(resource)
      return resource
    }

    // Wait for a resource to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.available.length > 0) {
          clearInterval(checkInterval)
          const resource = this.available.pop()!
          this.inUse.add(resource)
          resolve(resource)
        }
      }, 100)
    })
  }

  release(resource: T): void {
    if (this.inUse.has(resource)) {
      this.inUse.delete(resource)
      this.available.push(resource)
    }
  }

  clear(): void {
    this.available = []
    this.inUse.clear()
  }
}

/**
 * Compresses data using Run-Length Encoding
 */
export function compressRLE(data: number[]): { values: number[]; counts: number[] } {
  if (data.length === 0) return { values: [], counts: [] }

  const values: number[] = []
  const counts: number[] = []
  let currentValue = data[0]
  let currentCount = 1

  for (let i = 1; i < data.length; i++) {
    if (data[i] === currentValue) {
      currentCount++
    } else {
      values.push(currentValue)
      counts.push(currentCount)
      currentValue = data[i]
      currentCount = 1
    }
  }

  values.push(currentValue)
  counts.push(currentCount)

  return { values, counts }
}

/**
 * Decompresses RLE-encoded data
 */
export function decompressRLE(compressed: { values: number[]; counts: number[] }): number[] {
  const result: number[] = []

  for (let i = 0; i < compressed.values.length; i++) {
    const value = compressed.values[i]
    const count = compressed.counts[i]
    
    for (let j = 0; j < count; j++) {
      result.push(value)
    }
  }

  return result
}

/**
 * Priority queue implementation for task scheduling
 */
export class PriorityQueue<T> {
  private items: Array<{ value: T; priority: number }> = []

  enqueue(value: T, priority: number): void {
    const item = { value, priority }
    let added = false

    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item)
        added = true
        break
      }
    }

    if (!added) {
      this.items.push(item)
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.value
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  size(): number {
    return this.items.length
  }

  clear(): void {
    this.items = []
  }
}
