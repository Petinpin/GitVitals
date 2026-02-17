/**
 * Unit Tests for Validation Utilities
 * Tests: validateVitalSigns, validateEmail, validateStudentId, validateForm, etc.
 */

import {
  validateVitalSigns,
  validateEmail,
  validateStudentId,
  validateForm,
  sanitizeInput,
  validateAge,
  calculateBMI,
  validateDateRange,
} from '@/lib/validation'

describe('Validation Utilities', () => {
  describe('validateVitalSigns', () => {
    test('should accept normal vital signs', () => {
      const result = validateVitalSigns({
        systolicBP: 120,
        diastolicBP: 80,
        heartRate: 72,
      })

      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    test('should flag critical values as errors', () => {
      const result = validateVitalSigns({
        systolicBP: 200,
        heartRate: 160,
      })

      expect(result.valid).toBe(false)
      expect(result.errors.systolicBP).toBeDefined()
      expect(result.errors.heartRate).toBeDefined()
    })

    test('should generate warnings for out-of-range non-critical values', () => {
      const result = validateVitalSigns({
        systolicBP: 145,
        heartRate: 105,
      })

      expect(result.valid).toBe(true)
      expect(result.warnings.systolicBP).toBeDefined()
      expect(result.warnings.heartRate).toBeDefined()
    })

    test('should flag invalid blood pressure (diastolic > systolic)', () => {
      const result = validateVitalSigns({
        systolicBP: 100,
        diastolicBP: 120,
      })

      expect(result.valid).toBe(false)
      expect(result.errors.bloodPressure).toContain('Systolic must exceed diastolic')
    })

    test('should warn on narrow pulse pressure', () => {
      const result = validateVitalSigns({
        systolicBP: 120,
        diastolicBP: 105,
      })

      expect(result.warnings.pulsePressure).toContain('Narrow pulse pressure')
    })

    test('should warn on wide pulse pressure', () => {
      const result = validateVitalSigns({
        systolicBP: 150,
        diastolicBP: 60,
      })

      expect(result.warnings.pulsePressure).toContain('Wide pulse pressure')
    })

    test('should ignore unknown vital sign keys', () => {
      const result = validateVitalSigns({
        systolicBP: 120,
        unknownVital: 999,
      })

      expect(result.valid).toBe(true)
      expect(result.errors.unknownVital).toBeUndefined()
    })
  })

  describe('validateEmail', () => {
    test('should accept valid email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('john.doe+tag@university.edu')).toBe(true)
      expect(validateEmail('student_2024@college.org')).toBe(true)
    })

    test('should reject invalid email formats', () => {
      expect(validateEmail('invalid.email')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user spaces@domain.com')).toBe(false)
    })

    test('should reject empty email', () => {
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validateStudentId', () => {
    test('should accept valid student IDs', () => {
      expect(validateStudentId('S123')).toBe(true)
      expect(validateStudentId('S123456')).toBe(true)
      expect(validateStudentId('S1000')).toBe(true)
    })

    test('should reject invalid student ID formats', () => {
      expect(validateStudentId('123')).toBe(false)
      expect(validateStudentId('ST123')).toBe(false)
      expect(validateStudentId('S12')).toBe(false)
      expect(validateStudentId('S1234567')).toBe(false)
      expect(validateStudentId('student123')).toBe(false)
    })
  })

  describe('validateForm', () => {
    test('should validate form fields against rules', () => {
      const data = { email: 'test@example.com', age: 25 }
      const rules = {
        email: (val: unknown) => (val ? null : 'Email required'),
        age: (val: unknown) => typeof val === 'number' && val >= 18 ? null : 'Must be 18+',
      }

      const result = validateForm(data, rules)

      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    test('should collect validation errors', () => {
      const data = { email: '', age: 15 }
      const rules = {
        email: (val: unknown) => (val ? null : 'Email required'),
        age: (val: unknown) => typeof val === 'number' && val >= 18 ? null : 'Must be 18+',
      }

      const result = validateForm(data, rules)

      expect(result.valid).toBe(false)
      expect(result.errors.email).toBe('Email required')
      expect(result.errors.age).toBe('Must be 18+')
    })

    test('should handle custom validation rules', () => {
      const data: Record<string, unknown> = { password: 'strongPassword123' }
      const rules: Record<string, (val: unknown) => string | null> = {
        password: (val: unknown) => {
          if (typeof val !== 'string') return 'Password must be string'
          return val.length >= 8 ? null : 'Password must be 8+ characters'
        },
      }

      const result = validateForm(data, rules)

      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })
  })

  describe('sanitizeInput', () => {
    test('should remove dangerous HTML tags', () => {
      const input = '<script>alert("XSS")</script>Hello'
      const sanitized = sanitizeInput(input)

      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
      expect(sanitized).toContain('Hello')
    })

    test('should remove javascript protocol', () => {
      const input = 'javascript:alert(1)'
      const sanitized = sanitizeInput(input)

      expect(sanitized).not.toContain('javascript:')
    })

    test('should trim whitespace', () => {
      const input = '  hello world  '
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('hello world')
    })

    test('should handle normal input without modification', () => {
      const input = 'Normal user input'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('Normal user input')
    })
  })

  describe('validateAge', () => {
    test('should accept valid ages', () => {
      expect(validateAge(25)).toBeNull()
      expect(validateAge(0)).toBeNull()
      expect(validateAge(120)).toBeNull()
    })

    test('should reject invalid ages', () => {
      expect(validateAge(-1)).toBeTruthy()
      expect(validateAge(121)).toBeTruthy()
      expect(validateAge(200)).toBeTruthy()
    })

    test('should return specific error message', () => {
      const error = validateAge(-5)
      expect(error).toContain('Age must be between 0 and 120')
    })
  })

  describe('calculateBMI', () => {
    test('should calculate correct BMI', () => {
      // 150 lbs, 70 inches
      const result = calculateBMI(150, 70)

      expect(result.bmi).toBeCloseTo(21.5, 1)
    })

    test('should categorize as underweight', () => {
      // Low weight for height
      const result = calculateBMI(100, 70)

      expect(result.category).toBe('Underweight')
      expect(result.bmi).toBeLessThan(18.5)
    })

    test('should categorize as normal', () => {
      const result = calculateBMI(150, 70)

      expect(result.category).toBe('Normal')
      expect(result.bmi).toBeGreaterThanOrEqual(18.5)
      expect(result.bmi).toBeLessThan(25)
    })

    test('should categorize as overweight', () => {
      const result = calculateBMI(180, 70)

      expect(result.category).toBe('Overweight')
      expect(result.bmi).toBeGreaterThanOrEqual(25)
      expect(result.bmi).toBeLessThan(30)
    })

    test('should categorize as obese', () => {
      const result = calculateBMI(220, 70)

      expect(result.category).toBe('Obese')
      expect(result.bmi).toBeGreaterThanOrEqual(30)
    })

    test('should return number with one decimal place', () => {
      const result = calculateBMI(150, 70)

      expect(result.bmi.toString().split('.')[1]?.length).toBeLessThanOrEqual(1)
    })
  })

  describe('validateDateRange', () => {
    test('should accept valid date ranges', () => {
      const start = new Date('2026-01-01')
      const end = new Date('2026-02-01')

      const error = validateDateRange(start, end)

      expect(error).toBeNull()
    })

    test('should reject when start date is after end date', () => {
      const start = new Date('2026-02-01')
      const end = new Date('2026-01-01')

      const error = validateDateRange(start, end)

      expect(error).toContain('Start date must precede end date')
    })

    test('should reject when end date is in future', () => {
      const start = new Date('2026-01-01')
      const end = new Date('2099-12-31')

      const error = validateDateRange(start, end)

      expect(error).toContain('End date cannot be in the future')
    })

    test('should accept same date for start and end', () => {
      const date = new Date('2026-02-01')

      const error = validateDateRange(date, date)

      expect(error).toBeNull()
    })
  })
})
