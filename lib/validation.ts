/**
 * Advanced validation utilities for vital signs and user input
 * Implements medical-grade validation rules with comprehensive error handling
 */

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
  warnings: Record<string, string>
}

export interface VitalRanges {
  min: number
  max: number
  criticalMin?: number
  criticalMax?: number
}

// Evidence-based clinical ranges for vital signs
const VITAL_RANGES: Record<string, VitalRanges> = {
  systolicBP: { min: 90, max: 140, criticalMin: 70, criticalMax: 180 },
  diastolicBP: { min: 60, max: 90, criticalMin: 40, criticalMax: 120 },
  heartRate: { min: 60, max: 100, criticalMin: 40, criticalMax: 150 },
  respiratoryRate: { min: 12, max: 20, criticalMin: 8, criticalMax: 30 },
  temperature: { min: 97.0, max: 99.5, criticalMin: 95.0, criticalMax: 104.0 },
  oxygenSaturation: { min: 95, max: 100, criticalMin: 88, criticalMax: 100 },
  weight: { min: 50, max: 500, criticalMin: 30, criticalMax: 800 },
}

/**
 * Validates vital sign measurements against clinical ranges
 */
export function validateVitalSigns(data: Record<string, number>): ValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  for (const [key, value] of Object.entries(data)) {
    const range = VITAL_RANGES[key]
    if (!range) continue

    if (value < range.criticalMin! || value > range.criticalMax!) {
      errors[key] = `Critical value detected. Expected ${range.criticalMin}-${range.criticalMax}`
    } else if (value < range.min || value > range.max) {
      warnings[key] = `Outside normal range. Expected ${range.min}-${range.max}`
    }
  }

  // Cross-field validations
  if (data.systolicBP && data.diastolicBP) {
    const pulsePressure = data.systolicBP - data.diastolicBP
    if (pulsePressure < 20) {
      warnings.pulsePressure = 'Narrow pulse pressure detected'
    } else if (pulsePressure > 80) {
      warnings.pulsePressure = 'Wide pulse pressure detected'
    }
    
    if (data.systolicBP <= data.diastolicBP) {
      errors.bloodPressure = 'Systolic must exceed diastolic pressure'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings
  }
}

/**
 * Validates email format with comprehensive pattern matching
 */
export function validateEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return pattern.test(email)
}

/**
 * Validates student ID format
 */
export function validateStudentId(id: string): boolean {
  const pattern = /^S\d{3,6}$/
  return pattern.test(id)
}

/**
 * Validates form data with custom rules
 */
export function validateForm<T extends Record<string, unknown>>(
  data: T,
  rules: Record<keyof T, (value: unknown) => string | null>
): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [field, validator] of Object.entries(rules)) {
    const error = validator(data[field as keyof T])
    if (error) {
      errors[field] = error
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings: {}
  }
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
}

/**
 * Validates age range
 */
export function validateAge(age: number): string | null {
  if (age < 0 || age > 120) {
    return 'Age must be between 0 and 120 years'
  }
  return null
}

/**
 * Calculates Body Mass Index and returns assessment
 */
export function calculateBMI(weightLb: number, heightIn: number): { bmi: number; category: string } {
  const heightM = heightIn * 0.0254
  const weightKg = weightLb * 0.453592
  const bmi = weightKg / (heightM * heightM)
  
  let category = 'Normal'
  if (bmi < 18.5) category = 'Underweight'
  else if (bmi >= 25 && bmi < 30) category = 'Overweight'
  else if (bmi >= 30) category = 'Obese'
  
  return { bmi: parseFloat(bmi.toFixed(1)), category }
}

/**
 * Validates date range for queries
 */
export function validateDateRange(start: Date, end: Date): string | null {
  if (start > end) {
    return 'Start date must precede end date'
  }
  if (end > new Date()) {
    return 'End date cannot be in the future'
  }
  return null
}
