/**
 * Unit Tests for Data Transformation Utilities
 * Tests: normalizeMinMax, standardize, robustScale, oneHotEncode, labelEncode, etc.
 */

import {
  normalizeMinMax,
  standardize,
  robustScale,
  oneHotEncode,
  labelEncode,
  generatePolynomialFeatures,
  generateInteractionFeatures,
} from '@/lib/transforms'

describe('Data Transformation Utilities', () => {
  describe('normalizeMinMax', () => {
    test('should normalize values to [0, 1] by default', () => {
      const values = [10, 20, 30, 40, 50]
      const result = normalizeMinMax(values)

      expect(result[0]).toBe(0)
      expect(result[result.length - 1]).toBe(1)
      expect(result).toHaveLength(5)
    })

    test('should normalize to custom range', () => {
      const values = [0, 100]
      const result = normalizeMinMax(values, { min: -1, max: 1 })

      expect(result[0]).toBe(-1)
      expect(result[1]).toBe(1)
    })

    test('should handle single value', () => {
      const values = [50]
      const result = normalizeMinMax(values)

      expect(result[0]).toBe(0)
    })

    test('should handle identical values', () => {
      const values = [5, 5, 5, 5]
      const result = normalizeMinMax(values)

      expect(result).toEqual([0, 0, 0, 0])
    })

    test('should handle empty array', () => {
      const result = normalizeMinMax([])

      expect(result).toEqual([])
    })

    test('should maintain relative distances', () => {
      const values = [10, 20, 30]
      const result = normalizeMinMax(values)

      expect(result[1] - result[0]).toBeCloseTo(result[2] - result[1], 5)
    })
  })

  describe('standardize', () => {
    test('should standardize to mean 0 and std 1', () => {
      const values = [1, 2, 3, 4, 5]
      const result = standardize(values)

      const mean = result.reduce((a, b) => a + b) / result.length
      expect(mean).toBeCloseTo(0, 5)

      const variance = result.reduce((sum, val) => sum + val ** 2, 0) / result.length
      const stdDev = Math.sqrt(variance)
      expect(stdDev).toBeCloseTo(1, 5)
    })

    test('should handle constant values', () => {
      const values = [10, 10, 10, 10]
      const result = standardize(values)

      expect(result).toEqual([0, 0, 0, 0])
    })

    test('should handle empty array', () => {
      const result = standardize([])

      expect(result).toEqual([])
    })

    test('should handle single value', () => {
      const result = standardize([42])

      expect(result[0]).toBe(0)
    })

    test('should handle negative values', () => {
      const values = [-5, -3, -1, 1, 3, 5]
      const result = standardize(values)

      const mean = result.reduce((a, b) => a + b) / result.length
      expect(mean).toBeCloseTo(0, 5)
    })
  })

  describe('robustScale', () => {
    test('should scale using median and IQR', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      const result = robustScale(values)

      expect(result).toHaveLength(9)
      expect(result.some(v => v === 0)).toBe(true)
    })

    test('should handle constant values', () => {
      const values = [5, 5, 5, 5, 5]
      const result = robustScale(values)

      expect(result).toEqual([0, 0, 0, 0, 0])
    })

    test('should handle empty array', () => {
      const result = robustScale([])

      expect(result).toEqual([])
    })

    test('should be resistant to outliers', () => {
      const values = [1, 2, 3, 4, 5, 1000]
      const result = robustScale(values)

      // Normal values should have smaller scaled values than outlier
      expect(Math.abs(result[0])).toBeLessThan(Math.abs(result[5]))
    })
  })

  describe('oneHotEncode', () => {
    test('should create binary vectors for categories', () => {
      const values = ['cat', 'dog', 'cat', 'bird']
      const result = oneHotEncode(values)

      expect(result['cat']).toEqual([1, 0, 1, 0])
      expect(result['dog']).toEqual([0, 1, 0, 0])
      expect(result['bird']).toEqual([0, 0, 0, 1])
    })

    test('should handle specified categories', () => {
      const values = ['a', 'b', 'a']
      const result = oneHotEncode(values, ['a', 'b', 'c'])

      expect(result['c']).toEqual([0, 0, 0])
    })

    test('should handle empty array', () => {
      const result = oneHotEncode([])

      expect(Object.keys(result)).toHaveLength(0)
    })

    test('should handle single category', () => {
      const values = ['x', 'x', 'x']
      const result = oneHotEncode(values)

      expect(result['x']).toEqual([1, 1, 1])
      expect(Object.keys(result)).toHaveLength(1)
    })
  })

  describe('labelEncode', () => {
    test('should encode categories to integers', () => {
      const values = ['red', 'blue', 'red', 'green']
      const result = labelEncode(values)

      expect(result.encoded).toHaveLength(4)
      expect(result.mapping.has('red')).toBe(true)
      expect(result.mapping.has('blue')).toBe(true)
      expect(result.mapping.has('green')).toBe(true)
    })

    test('should preserve order for same categories', () => {
      const values = ['a', 'b', 'a', 'b', 'a']
      const result = labelEncode(values)

      expect(result.encoded[0]).toBe(result.encoded[2])
      expect(result.encoded[0]).toBe(result.encoded[4])
      expect(result.encoded[1]).toBe(result.encoded[3])
    })

    test('should start encoding from 0', () => {
      const values = ['x', 'y', 'z']
      const result = labelEncode(values)

      const encodedSet = new Set(result.encoded)
      expect(Math.min(...result.encoded)).toBe(0)
    })

    test('should handle single value', () => {
      const values = ['only']
      const result = labelEncode(values)

      expect(result.encoded).toEqual([0])
      expect(result.mapping.get('only')).toBe(0)
    })
  })

  describe('generatePolynomialFeatures', () => {
    test('should generate polynomial features up to specified degree', () => {
      const features = [[2, 3]]
      const result = generatePolynomialFeatures(features, 2)

      // Original: [2, 3]
      // Degree 2: [2, 3, 2^2=4, 3^2=9]
      expect(result[0]).toContain(2)
      expect(result[0]).toContain(3)
      expect(result[0]).toContain(4)
      expect(result[0]).toContain(9)
    })

    test('should return original features for degree 1', () => {
      const features = [[1, 2, 3]]
      const result = generatePolynomialFeatures(features, 1)

      expect(result).toEqual(features)
    })

    test('should handle empty features', () => {
      const result = generatePolynomialFeatures([], 2)

      expect(result).toEqual([])
    })

    test('should handle degree 3', () => {
      const features = [[2]]
      const result = generatePolynomialFeatures(features, 3)

      // [2, 2^2=4, 2^3=8]
      expect(result[0]).toContain(8)
    })

    test('should handle multiple feature vectors', () => {
      const features = [[1, 2], [3, 4]]
      const result = generatePolynomialFeatures(features, 2)

      expect(result).toHaveLength(2)
      expect(result[0].length).toBeGreaterThan(2)
      expect(result[1].length).toBeGreaterThan(2)
    })
  })

  describe('generateInteractionFeatures', () => {
    test('should generate pairwise interaction features', () => {
      const features = [[2, 3, 4]]
      const result = generateInteractionFeatures(features)

      // Original: [2, 3, 4]
      // Interactions: 2*3=6, 2*4=8, 3*4=12
      expect(result[0]).toContain(2)
      expect(result[0]).toContain(3)
      expect(result[0]).toContain(4)
      expect(result[0]).toContain(6)
      expect(result[0]).toContain(8)
      expect(result[0]).toContain(12)
    })

    test('should handle two feature vectors', () => {
      const features = [[2, 3], [4, 5]]
      const result = generateInteractionFeatures(features)

      expect(result).toHaveLength(2)
      expect(result[0].length).toBe(3) // 2, 3, and 2*3
      expect(result[1].length).toBe(3) // 4, 5, and 4*5
    })

    test('should handle single feature', () => {
      const features = [[5]]
      const result = generateInteractionFeatures(features)

      expect(result[0]).toEqual([5])
    })

    test('should handle empty features', () => {
      const result = generateInteractionFeatures([])

      expect(result).toEqual([])
    })

    test('should maintain order: original then interactions', () => {
      const features = [[1, 2]]
      const result = generateInteractionFeatures(features)

      expect(result[0][0]).toBe(1)
      expect(result[0][1]).toBe(2)
      expect(result[0][2]).toBe(2) // 1 * 2
    })
  })
})
