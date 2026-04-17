import { describe, it, expect, vi } from 'vitest'
import {
  validatePhone,
  validatePassword,
  validateName,
  validateAmount,
  validateId,
  validateDate,
  validateUrl,
  requireFields,
} from '../middleware/validate.js'

describe('validatePhone', () => {
  it('accepts valid phone numbers', () => {
    expect(validatePhone('+7 (999) 123-45-67')).toBe(true)   // 11 digits
    expect(validatePhone('1234567890')).toBe(true)            // 10 digits
    expect(validatePhone('123456789012345')).toBe(true)       // 15 digits
  })

  it('rejects too short or too long', () => {
    expect(validatePhone('123')).toBe(false)
    expect(validatePhone('1234567890123456')).toBe(false)     // 16 digits
  })

  it('rejects non-string / empty', () => {
    expect(validatePhone(null)).toBe(false)
    expect(validatePhone(undefined)).toBe(false)
    expect(validatePhone('')).toBe(false)
    expect(validatePhone(12345)).toBe(false)
  })
})

describe('validatePassword', () => {
  it('accepts passwords between 6 and 128 chars', () => {
    expect(validatePassword('abcdef')).toBe(true)
    expect(validatePassword('a'.repeat(128))).toBe(true)
  })

  it('rejects too short or too long', () => {
    expect(validatePassword('abc')).toBe(false)
    expect(validatePassword('a'.repeat(129))).toBe(false)
  })

  it('rejects non-string / empty', () => {
    expect(validatePassword(null)).toBe(false)
    expect(validatePassword('')).toBe(false)
  })
})

describe('validateName', () => {
  it('accepts non-empty trimmed strings up to 255 chars', () => {
    expect(validateName('Иван')).toBe(true)
    expect(validateName('A')).toBe(true)
    expect(validateName('a'.repeat(255))).toBe(true)
  })

  it('rejects whitespace-only or too long', () => {
    expect(validateName('   ')).toBe(false)
    expect(validateName('a'.repeat(256))).toBe(false)
  })

  it('rejects non-string / empty', () => {
    expect(validateName(null)).toBe(false)
    expect(validateName('')).toBe(false)
  })
})

describe('validateAmount', () => {
  it('accepts positive numbers up to 99999999', () => {
    expect(validateAmount(1)).toBe(true)
    expect(validateAmount(99999999)).toBe(true)
    expect(validateAmount('500')).toBe(true)
  })

  it('rejects zero, negative, too large, NaN', () => {
    expect(validateAmount(0)).toBe(false)
    expect(validateAmount(-1)).toBe(false)
    expect(validateAmount(100000000)).toBe(false)
    expect(validateAmount('abc')).toBe(false)
  })

  it('rejects null / undefined', () => {
    expect(validateAmount(null)).toBe(false)
    expect(validateAmount(undefined)).toBe(false)
  })
})

describe('validateId', () => {
  it('accepts alphanumeric with dashes and underscores', () => {
    expect(validateId('abc-123_XYZ')).toBe(true)
    expect(validateId('a')).toBe(true)
    expect(validateId('a'.repeat(64))).toBe(true)
  })

  it('rejects special chars, empty, too long', () => {
    expect(validateId('has space')).toBe(false)
    expect(validateId('a'.repeat(65))).toBe(false)
    expect(validateId('<script>')).toBe(false)
    expect(validateId('')).toBe(false)
  })

  it('rejects non-string', () => {
    expect(validateId(null)).toBe(false)
    expect(validateId(123)).toBe(false)
  })
})

describe('validateDate', () => {
  it('accepts valid date strings', () => {
    expect(validateDate('2025-01-15')).toBe(true)
    expect(validateDate('2025-01-15T10:30:00Z')).toBe(true)
  })

  it('rejects invalid dates', () => {
    expect(validateDate('not-a-date')).toBe(false)
    expect(validateDate('')).toBe(false)
    expect(validateDate(null)).toBe(false)
  })
})

describe('validateUrl', () => {
  it('accepts valid URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true)
    expect(validateUrl('http://localhost:3000/path')).toBe(true)
  })

  it('accepts local upload paths', () => {
    expect(validateUrl('/uploads/photo.jpg')).toBe(true)
    expect(validateUrl('/uploads/file-name_123.png')).toBe(true)
  })

  it('rejects invalid URLs', () => {
    expect(validateUrl('not a url')).toBe(false)
    expect(validateUrl('')).toBe(false)
    expect(validateUrl(null)).toBe(false)
  })
})

describe('requireFields middleware', () => {
  function mockReqRes(body) {
    const req = { body }
    const res = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this },
      json(data) { this.body = data; return this },
    }
    return { req, res }
  }

  it('calls next when all fields present', () => {
    const middleware = requireFields('name', 'email')
    const { req, res } = mockReqRes({ name: 'John', email: 'j@j.com' })
    const next = vi.fn()
    middleware(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('returns 400 when fields are missing', () => {
    const middleware = requireFields('name', 'email')
    const { req, res } = mockReqRes({ name: 'John' })
    const next = vi.fn()
    middleware(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toContain('email')
  })

  it('treats 0 and false as present values', () => {
    const middleware = requireFields('count', 'active')
    const { req, res } = mockReqRes({ count: 0, active: false })
    const next = vi.fn()
    middleware(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})
