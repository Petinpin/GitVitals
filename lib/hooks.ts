/**
 * Advanced form management hook with validation and submission handling
 * Provides comprehensive state management for complex forms
 */

import { useState, useCallback, FormEvent } from 'react'
import { ValidationResult } from './validation'

interface UseFormOptions<T> {
  initialValues: T
  validate?: (values: T) => ValidationResult
  onSubmit: (values: T) => Promise<void> | void
}

interface UseFormReturn<T> {
  values: T
  errors: Record<string, string>
  warnings: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
  handleChange: (field: keyof T, value: unknown) => void
  handleBlur: (field: keyof T) => void
  handleSubmit: (e: FormEvent) => Promise<void>
  reset: () => void
  setFieldError: (field: keyof T, error: string) => void
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((field: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }, [errors])

  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }))
    
    // Validate single field on blur if validator provided
    if (validate) {
      const result = validate(values)
      if (result.errors[field as string]) {
        setErrors(prev => ({
          ...prev,
          [field as string]: result.errors[field as string]
        }))
      }
    }
  }, [values, validate])

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    if (validate) {
      const result = validate(values)
      setErrors(result.errors)
      setWarnings(result.warnings)
      
      if (!result.valid) {
        // Mark all fields as touched to show errors
        const allTouched = Object.keys(values).reduce((acc, key) => ({
          ...acc,
          [key]: true
        }), {})
        setTouched(allTouched)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submission failed'
      setErrors({ submit: message })
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setWarnings({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }))
  }, [])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    warnings,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldError,
  }
}

/**
 * Hook for managing async data fetching with loading and error states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await asyncFunction()
      setData(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, dependencies)

  return { data, loading, error, refetch: execute }
}

/**
 * Hook for debounced value updates (search, validation)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  })

  return debouncedValue
}
