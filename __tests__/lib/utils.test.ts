import { describe, it, expect } from 'vitest'
import { cn, formatDate } from '../../lib/utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('btn', 'btn-primary')
    expect(result).toBe('btn btn-primary')
  })

  it('should handle conditional classes', () => {
    const result = cn('btn', true && 'active', false && 'disabled')
    expect(result).toBe('btn active')
  })

  it('should merge conflicting Tailwind classes', () => {
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle undefined values', () => {
    const result = cn('btn', undefined, 'active')
    expect(result).toBe('btn active')
  })

  it('should handle null values', () => {
    const result = cn('btn', null, 'active')
    expect(result).toBe('btn active')
  })

  it('should handle array inputs', () => {
    const result = cn(['btn', 'btn-primary'], 'active')
    expect(result).toBe('btn btn-primary active')
  })

  it('should handle object inputs', () => {
    const result = cn({ 'btn': true, 'active': false, 'disabled': true })
    expect(result).toBe('btn disabled')
  })
})

describe('formatDate utility function', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15')
    const result = formatDate(date)
    expect(result).toBe('2024-01-15')
  })

  it('should handle single digit months and days', () => {
    const date = new Date('2024-03-05')
    const result = formatDate(date)
    expect(result).toBe('2024-03-05')
  })

  it('should handle end of year date', () => {
    const date = new Date('2023-12-31')
    const result = formatDate(date)
    expect(result).toBe('2023-12-31')
  })

  it('should handle beginning of year date', () => {
    const date = new Date('2024-01-01')
    const result = formatDate(date)
    expect(result).toBe('2024-01-01')
  })

  it('should handle leap year date', () => {
    const date = new Date('2024-02-29')
    const result = formatDate(date)
    expect(result).toBe('2024-02-29')
  })

  it('should handle invalid date', () => {
    const date = new Date('invalid')
    const result = formatDate(date)
    expect(result).toBe('NaN-NaN-NaN')
  })
})