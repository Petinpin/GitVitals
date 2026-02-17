/**
 * Comprehensive utility functions for data formatting, analysis, and transformation
 * Implements industry-standard algorithms for medical data processing
 */

/**
 * Formats date to localized string with fallback
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return 'Invalid date'
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

/**
 * Formats relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
  
  return formatDate(d)
}

/**
 * Calculates percentile rank of a value within a distribution
 */
export function calculatePercentile(value: number, data: number[]): number {
  const sorted = [...data].sort((a, b) => a - b)
  const index = sorted.findIndex(v => v >= value)
  
  if (index === -1) return 100
  if (index === 0) return 0
  
  return Math.round((index / sorted.length) * 100)
}

/**
 * Calculates statistical measures for a dataset
 */
export function calculateStatistics(data: number[]): {
  mean: number
  median: number
  stdDev: number
  min: number
  max: number
} {
  if (data.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 }
  }

  const sorted = [...data].sort((a, b) => a - b)
  const sum = data.reduce((acc, val) => acc + val, 0)
  const mean = sum / data.length
  
  const median = data.length % 2 === 0
    ? (sorted[data.length / 2 - 1] + sorted[data.length / 2]) / 2
    : sorted[Math.floor(data.length / 2)]
  
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)
  
  return {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    min: Math.min(...data),
    max: Math.max(...data)
  }
}

/**
 * Generates color code based on value and thresholds
 */
export function getVitalSignColor(
  value: number,
  normalMin: number,
  normalMax: number,
  criticalMin: number,
  criticalMax: number
): string {
  if (value < criticalMin || value > criticalMax) return 'text-red-600'
  if (value < normalMin || value > normalMax) return 'text-yellow-600'
  return 'text-green-600'
}

/**
 * Exports data to CSV format
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        const stringValue = value === null || value === undefined ? '' : String(value)
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Groups array of objects by a specified key
 */
export function groupBy<T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Calculates accuracy rate with confidence interval
 */
export function calculateAccuracy(correct: number, total: number): {
  percentage: number
  confidence: string
} {
  if (total === 0) return { percentage: 0, confidence: 'Insufficient data' }
  
  const percentage = (correct / total) * 100
  const stdErr = Math.sqrt((percentage * (100 - percentage)) / total)
  const marginOfError = 1.96 * stdErr
  
  let confidence = 'Low'
  if (total >= 30 && marginOfError < 10) confidence = 'Moderate'
  if (total >= 100 && marginOfError < 5) confidence = 'High'
  
  return {
    percentage: parseFloat(percentage.toFixed(1)),
    confidence
  }
}

/**
 * Detects trends in time-series data
 */
export function detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 3) return 'stable'
  
  let increases = 0
  let decreases = 0
  
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    if (Math.abs(diff) < 0.01) continue
    
    if (diff > 0) increases++
    else decreases++
  }
  
  const threshold = values.length * 0.6
  if (increases > threshold) return 'increasing'
  if (decreases > threshold) return 'decreasing'
  
  return 'stable'
}

/**
 * Generates a unique identifier
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Safely parses JSON with fallback
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Calculates Mean Arterial Pressure
 */
export function calculateMAP(systolic: number, diastolic: number): number {
  return parseFloat((diastolic + (systolic - diastolic) / 3).toFixed(1))
}

/**
 * Formats number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}
