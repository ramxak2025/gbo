import { describe, it, expect } from 'vitest'
import { signToken, verifyToken } from '../auth.js'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'iborcuha-secret-key-change-me'

describe('signToken', () => {
  it('returns a valid JWT string', () => {
    const token = signToken({ id: 'user-1', role: 'trainer' })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('embeds the payload', () => {
    const token = signToken({ id: 'user-1', role: 'trainer' })
    const decoded = jwt.decode(token)
    expect(decoded.id).toBe('user-1')
    expect(decoded.role).toBe('trainer')
  })

  it('sets an expiration claim', () => {
    const token = signToken({ id: 'user-1' })
    const decoded = jwt.decode(token)
    expect(decoded.exp).toBeDefined()
    // exp should be roughly 30 days from now
    const thirtyDays = 30 * 24 * 60 * 60
    const diff = decoded.exp - decoded.iat
    expect(diff).toBe(thirtyDays)
  })
})

describe('verifyToken', () => {
  it('returns decoded payload for a valid token', () => {
    const token = signToken({ id: 'user-2' })
    const decoded = verifyToken(token)
    expect(decoded.id).toBe('user-2')
    expect(decoded.iat).toBeDefined()
    expect(decoded.exp).toBeDefined()
  })

  it('throws for a tampered token', () => {
    const token = signToken({ id: 'user-3' })
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(() => verifyToken(tampered)).toThrow()
  })

  it('throws for a token signed with a different secret', () => {
    const token = jwt.sign({ id: 'user-4' }, 'wrong-secret', { expiresIn: '1h' })
    expect(() => verifyToken(token)).toThrow()
  })

  it('throws for an expired token', () => {
    const token = jwt.sign({ id: 'user-5' }, SECRET, { expiresIn: '-1s' })
    expect(() => verifyToken(token)).toThrow()
  })
})
