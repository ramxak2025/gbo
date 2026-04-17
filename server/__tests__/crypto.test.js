import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '../middleware/crypto.js'

describe('encrypt / decrypt', () => {
  it('roundtrip — decrypt(encrypt(text)) returns original text', () => {
    const original = 'Hello, iBorcuha!'
    const encrypted = encrypt(original)
    expect(encrypted).not.toBe(original)
    expect(decrypt(encrypted)).toBe(original)
  })

  it('roundtrip with unicode characters', () => {
    const original = 'Привет мир 🥋'
    expect(decrypt(encrypt(original))).toBe(original)
  })

  it('empty string returns empty string for both encrypt and decrypt', () => {
    expect(encrypt('')).toBe('')
    expect(decrypt('')).toBe('')
    expect(encrypt(null)).toBe('')
    expect(encrypt(undefined)).toBe('')
  })

  it('encrypted output has iv:authTag:ciphertext format', () => {
    const encrypted = encrypt('test')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
  })

  it('each encryption produces different ciphertext (random IV)', () => {
    const a = encrypt('same text')
    const b = encrypt('same text')
    expect(a).not.toBe(b)
    // But both decrypt to the same value
    expect(decrypt(a)).toBe('same text')
    expect(decrypt(b)).toBe('same text')
  })

  it('backward compat — plain text without colons is returned as-is', () => {
    const plain = 'oldPlainPassword123'
    expect(decrypt(plain)).toBe(plain)
  })

  it('backward compat — malformed encrypted string is returned as-is', () => {
    const bad = 'not:valid:base64!!!'
    expect(decrypt(bad)).toBe(bad)
  })
})
