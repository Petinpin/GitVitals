/**
 * Data transformation and normalization utilities
 * Implements feature scaling and encoding strategies
 */

/**
 * Min-Max normalization (scales to [0, 1])
 */
export function normalizeMinMax(
  values: number[],
  range: { min: number; max: number } = { min: 0, max: 1 }
): number[] {
  if (values.length === 0) return []

  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const dataRange = dataMax - dataMin

  if (dataRange === 0) return values.map(() => range.min)

  const targetRange = range.max - range.min

  return values.map(
    (val) => ((val - dataMin) / dataRange) * targetRange + range.min
  )
}

/**
 * Z-score standardization (mean=0, std=1)
 */
export function standardize(values: number[]): number[] {
  if (values.length === 0) return []

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return values.map(() => 0)

  return values.map((val) => (val - mean) / stdDev)
}

/**
 * Robust scaling using median and IQR (resistant to outliers)
 */
export function robustScale(values: number[]): number[] {
  if (values.length === 0) return []

  const sorted = [...values].sort((a, b) => a - b)
  const median = calculatePercentile(sorted, 50)
  const q1 = calculatePercentile(sorted, 25)
  const q3 = calculatePercentile(sorted, 75)
  const iqr = q3 - q1

  if (iqr === 0) return values.map(() => 0)

  return values.map((val) => (val - median) / iqr)
}

function calculatePercentile(sorted: number[], percentile: number): number {
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) return sorted[lower]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * One-hot encoding for categorical variables
 */
export function oneHotEncode(
  values: string[],
  categories?: string[]
): Record<string, number[]> {
  const uniqueCategories = categories || [...new Set(values)]
  const encoded: Record<string, number[]> = {}

  for (const category of uniqueCategories) {
    encoded[category] = values.map((val) => (val === category ? 1 : 0))
  }

  return encoded
}

/**
 * Label encoding (converts categories to integers)
 */
export function labelEncode(
  values: string[]
): { encoded: number[]; mapping: Map<string, number> } {
  const mapping = new Map<string, number>()
  let nextLabel = 0

  for (const value of values) {
    if (!mapping.has(value)) {
      mapping.set(value, nextLabel++)
    }
  }

  const encoded = values.map((val) => mapping.get(val)!)

  return { encoded, mapping }
}

/**
 * Polynomial feature generation
 */
export function generatePolynomialFeatures(
  features: number[][],
  degree: number = 2
): number[][] {
  if (features.length === 0 || degree < 1) return features

  return features.map((row) => {
    const result: number[] = [...row]

    for (let d = 2; d <= degree; d++) {
      for (let i = 0; i < row.length; i++) {
        result.push(Math.pow(row[i], d))
      }
    }

    return result
  })
}

/**
 * Interaction features (pairwise products)
 */
export function generateInteractionFeatures(
  features: number[][]
): number[][] {
  if (features.length === 0) return features

  return features.map((row) => {
    const result: number[] = [...row]

    for (let i = 0; i < row.length; i++) {
      for (let j = i + 1; j < row.length; j++) {
        result.push(row[i] * row[j])
      }
    }

    return result
  })
}

/**
 * Missing value imputation strategies
 */
export function imputeMissing(
  values: (number | null)[],
  strategy: 'mean' | 'median' | 'mode' | 'forward' | 'backward' = 'mean'
): number[] {
  if (values.length === 0) return []

  const nonNull = values.filter((v): v is number => v !== null)

  if (nonNull.length === 0) return values.map(() => 0)

  let fillValue: number

  switch (strategy) {
    case 'mean':
      fillValue = nonNull.reduce((sum, val) => sum + val, 0) / nonNull.length
      break
    case 'median':
      fillValue = calculatePercentile([...nonNull].sort((a, b) => a - b), 50)
      break
    case 'mode':
      fillValue = calculateMode(nonNull)
      break
    case 'forward':
      return forwardFill(values)
    case 'backward':
      return backwardFill(values)
  }

  return values.map((val) => (val === null ? fillValue : val))
}

function calculateMode(values: number[]): number {
  const frequency = new Map<number, number>()
  let maxFreq = 0
  let mode = values[0]

  for (const val of values) {
    const freq = (frequency.get(val) || 0) + 1
    frequency.set(val, freq)

    if (freq > maxFreq) {
      maxFreq = freq
      mode = val
    }
  }

  return mode
}

function forwardFill(values: (number | null)[]): number[] {
  const result: number[] = []
  let lastValid = 0

  for (const val of values) {
    if (val !== null) {
      lastValid = val
      result.push(val)
    } else {
      result.push(lastValid)
    }
  }

  return result
}

function backwardFill(values: (number | null)[]): number[] {
  const result: number[] = new Array(values.length)
  let nextValid = 0

  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] !== null) {
      nextValid = values[i]!
      result[i] = values[i]!
    } else {
      result[i] = nextValid
    }
  }

  return result
}

/**
 * Binning continuous variables into discrete intervals
 */
export function binValues(
  values: number[],
  bins: number | number[]
): { binned: number[]; edges: number[] } {
  if (values.length === 0) {
    return { binned: [], edges: [] }
  }

  let edges: number[]

  if (typeof bins === 'number') {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const step = (max - min) / bins

    edges = Array.from({ length: bins + 1 }, (_, i) => min + i * step)
  } else {
    edges = [...bins].sort((a, b) => a - b)
  }

  const binned = values.map((val) => {
    for (let i = 0; i < edges.length - 1; i++) {
      if (val >= edges[i] && val < edges[i + 1]) {
        return i
      }
    }
    return edges.length - 2 // Last bin
  })

  return { binned, edges }
}

/**
 * Log transformation for skewed distributions
 */
export function logTransform(
  values: number[],
  offset: number = 1
): number[] {
  return values.map((val) => Math.log(val + offset))
}

/**
 * Box-Cox transformation for normality
 */
export function boxCoxTransform(
  values: number[],
  lambda: number
): number[] {
  if (lambda === 0) {
    return values.map((val) => Math.log(val))
  }

  return values.map((val) => (Math.pow(val, lambda) - 1) / lambda)
}

/**
 * Sliding window feature extraction
 */
export function extractWindowFeatures(
  timeSeries: number[],
  windowSize: number
): Array<{
  mean: number
  std: number
  min: number
  max: number
  range: number
}> {
  const features: Array<{
    mean: number
    std: number
    min: number
    max: number
    range: number
  }> = []

  for (let i = 0; i <= timeSeries.length - windowSize; i++) {
    const window = timeSeries.slice(i, i + windowSize)

    const mean = window.reduce((sum, val) => sum + val, 0) / windowSize
    const variance =
      window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowSize
    const std = Math.sqrt(variance)
    const min = Math.min(...window)
    const max = Math.max(...window)
    const range = max - min

    features.push({ mean, std, min, max, range })
  }

  return features
}

/**
 * Temporal features from timestamps
 */
export function extractTemporalFeatures(timestamp: Date): {
  hour: number
  dayOfWeek: number
  dayOfMonth: number
  month: number
  quarter: number
  isWeekend: boolean
  isBusinessHours: boolean
} {
  const hour = timestamp.getHours()
  const dayOfWeek = timestamp.getDay()
  const dayOfMonth = timestamp.getDate()
  const month = timestamp.getMonth()
  const quarter = Math.floor(month / 3) + 1
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isBusinessHours = hour >= 9 && hour < 17 && !isWeekend

  return {
    hour,
    dayOfWeek,
    dayOfMonth,
    month,
    quarter,
    isWeekend,
    isBusinessHours
  }
}
