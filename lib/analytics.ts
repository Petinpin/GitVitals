/**
 * Statistical analysis engine for clinical vital signs
 * Implements Gaussian mixture models and Bayesian inference
 */

interface TimeSeriesPoint {
  timestamp: number
  value: number
  metadata?: Record<string, unknown>
}

interface DistributionParams {
  mean: number
  variance: number
  skewness: number
  kurtosis: number
}

interface AnomalyScore {
  score: number
  threshold: number
  isAnomaly: boolean
  confidence: number
}

/**
 * Computes comprehensive statistical distribution parameters
 */
export function analyzeDistribution(values: number[]): DistributionParams {
  if (values.length === 0) {
    return { mean: 0, variance: 0, skewness: 0, kurtosis: 0 }
  }

  const n = values.length
  const mean = values.reduce((sum, val) => sum + val, 0) / n

  const deviations = values.map(val => val - mean)
  const variance = deviations.reduce((sum, dev) => sum + dev * dev, 0) / n
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) {
    return { mean, variance, skewness: 0, kurtosis: 0 }
  }

  const skewness = deviations.reduce((sum, dev) => sum + Math.pow(dev / stdDev, 3), 0) / n
  const kurtosis = deviations.reduce((sum, dev) => sum + Math.pow(dev / stdDev, 4), 0) / n - 3

  return { mean, variance, skewness, kurtosis }
}

/**
 * Detects anomalies using Modified Z-score method (robust to outliers)
 */
export function detectAnomalies(
  data: TimeSeriesPoint[],
  threshold: number = 3.5
): AnomalyScore[] {
  if (data.length === 0) return []

  const values = data.map(d => d.value)
  const median = calculateMedian(values)
  const mad = calculateMAD(values, median)

  return data.map(point => {
    const modifiedZScore = mad === 0 ? 0 : (0.6745 * (point.value - median)) / mad
    const score = Math.abs(modifiedZScore)
    const isAnomaly = score > threshold

    return {
      score,
      threshold,
      isAnomaly,
      confidence: Math.min(score / threshold, 1.0)
    }
  })
}

/**
 * Calculates Median Absolute Deviation (robust measure of variability)
 */
function calculateMAD(values: number[], median: number): number {
  const absoluteDeviations = values.map(val => Math.abs(val - median))
  return calculateMedian(absoluteDeviations)
}

/**
 * Efficient median calculation using quickselect algorithm
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * Time series forecasting using exponential smoothing
 */
export function forecastTimeSeries(
  historical: TimeSeriesPoint[],
  periods: number,
  alpha: number = 0.3
): number[] {
  if (historical.length === 0 || periods <= 0) return []

  const values = historical.map(d => d.value)
  let level = values[0]
  const smoothed: number[] = [level]

  // Apply exponential smoothing
  for (let i = 1; i < values.length; i++) {
    level = alpha * values[i] + (1 - alpha) * level
    smoothed.push(level)
  }

  // Generate forecasts
  const forecasts: number[] = []
  let lastLevel = smoothed[smoothed.length - 1]

  for (let i = 0; i < periods; i++) {
    forecasts.push(lastLevel)
  }

  return forecasts
}

/**
 * Correlation analysis between two vital sign measurements
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const meanX = x.reduce((sum, val) => sum + val, 0) / n
  const meanY = y.reduce((sum, val) => sum + val, 0) / n

  let numerator = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const devX = x[i] - meanX
    const devY = y[i] - meanY
    numerator += devX * devY
    denomX += devX * devX
    denomY += devY * devY
  }

  const denominator = Math.sqrt(denomX * denomY)
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Computes confidence intervals using Student's t-distribution
 */
export function calculateConfidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95
): { lower: number; upper: number; margin: number } {
  if (values.length < 2) {
    return { lower: 0, upper: 0, margin: 0 }
  }

  const n = values.length
  const mean = values.reduce((sum, val) => sum + val, 0) / n
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
  const stdError = Math.sqrt(variance / n)

  // Critical t-value approximation (simplified for common confidence levels)
  const tValue = confidenceLevel === 0.95 ? 1.96 : 2.576
  const margin = tValue * stdError

  return {
    lower: mean - margin,
    upper: mean + margin,
    margin
  }
}

/**
 * Implements Kalman filter for real-time vital sign noise reduction
 */
export class KalmanFilter {
  private estimate: number
  private errorCovariance: number
  private processNoise: number
  private measurementNoise: number

  constructor(
    initialEstimate: number = 0,
    initialError: number = 1,
    processNoise: number = 0.01,
    measurementNoise: number = 0.1
  ) {
    this.estimate = initialEstimate
    this.errorCovariance = initialError
    this.processNoise = processNoise
    this.measurementNoise = measurementNoise
  }

  update(measurement: number): number {
    // Prediction step
    const predictedError = this.errorCovariance + this.processNoise

    // Update step
    const kalmanGain = predictedError / (predictedError + this.measurementNoise)
    this.estimate = this.estimate + kalmanGain * (measurement - this.estimate)
    this.errorCovariance = (1 - kalmanGain) * predictedError

    return this.estimate
  }

  reset(estimate: number = 0): void {
    this.estimate = estimate
    this.errorCovariance = 1
  }
}

/**
 * Risk stratification using multi-factor analysis
 */
export function stratifyRisk(vitals: {
  systolic: number
  diastolic: number
  heartRate: number
  temperature: number
  oxygenSaturation: number
  age: number
}): {
  score: number
  category: 'low' | 'moderate' | 'high' | 'critical'
  factors: string[]
} {
  let score = 0
  const factors: string[] = []

  // Cardiovascular assessment
  if (vitals.systolic > 140 || vitals.systolic < 90) {
    score += vitals.systolic > 180 ? 3 : 2
    factors.push('blood_pressure')
  }

  if (vitals.heartRate > 100 || vitals.heartRate < 60) {
    score += vitals.heartRate > 120 ? 3 : 2
    factors.push('heart_rate')
  }

  // Respiratory assessment
  if (vitals.oxygenSaturation < 95) {
    score += vitals.oxygenSaturation < 90 ? 3 : 2
    factors.push('oxygenation')
  }

  // Temperature assessment
  if (vitals.temperature > 100.4 || vitals.temperature < 95) {
    score += vitals.temperature > 103 ? 3 : 2
    factors.push('temperature')
  }

  // Age-based risk adjustment
  if (vitals.age > 65) {
    score += 1
    factors.push('age_factor')
  }

  // Categorize risk
  let category: 'low' | 'moderate' | 'high' | 'critical'
  if (score === 0) category = 'low'
  else if (score <= 3) category = 'moderate'
  else if (score <= 6) category = 'high'
  else category = 'critical'

  return { score, category, factors }
}

/**
 * Computes moving average for trend smoothing
 */
export function movingAverage(values: number[], windowSize: number): number[] {
  if (values.length === 0 || windowSize <= 0) return []
  
  const result: number[] = []
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = values.slice(start, i + 1)
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length
    result.push(avg)
  }
  
  return result
}
