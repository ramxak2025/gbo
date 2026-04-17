import { describe, it, expect, vi } from 'vitest'
import { sanitizeInput } from '../middleware/security.js'

describe('sanitizeInput middleware', () => {
  function run(body) {
    const req = { body }
    const res = {}
    const next = vi.fn()
    sanitizeInput(req, res, next)
    return { req, next }
  }

  it('strips HTML tags from string values', () => {
    const { req } = run({ name: '<b>bold</b>', note: '<script>alert(1)</script>' })
    expect(req.body.name).toBe('bold')
    expect(req.body.note).toBe('alert(1)')
  })

  it('strips javascript: protocol', () => {
    const { req } = run({ link: 'javascript:alert(1)' })
    expect(req.body.link).not.toContain('javascript:')
  })

  it('strips inline event handlers', () => {
    const { req } = run({ text: 'hello onerror=alert(1)' })
    expect(req.body.text).not.toMatch(/onerror\s*=/)
  })

  it('does not sanitize password field', () => {
    const { req } = run({ password: '<script>keep-me</script>' })
    expect(req.body.password).toBe('<script>keep-me</script>')
  })

  it('does not sanitize URL fields (videoUrl, coverImage, avatar, url, endpoint)', () => {
    const body = {
      videoUrl: 'https://example.com/<path>',
      coverImage: 'https://example.com/<img>',
      avatar: 'https://example.com/<pic>',
      url: 'https://example.com/<link>',
      endpoint: 'https://example.com/<ep>',
      customThumb: 'https://example.com/<thumb>',
    }
    const { req } = run(body)
    expect(req.body.videoUrl).toBe(body.videoUrl)
    expect(req.body.coverImage).toBe(body.coverImage)
    expect(req.body.avatar).toBe(body.avatar)
    expect(req.body.url).toBe(body.url)
    expect(req.body.endpoint).toBe(body.endpoint)
    expect(req.body.customThumb).toBe(body.customThumb)
  })

  it('sanitizes nested objects', () => {
    const { req } = run({ trainer: { name: '<em>John</em>', bio: 'ok' } })
    expect(req.body.trainer.name).toBe('John')
    expect(req.body.trainer.bio).toBe('ok')
  })

  it('sanitizes arrays of strings', () => {
    const { req } = run({ tags: ['<b>a</b>', 'b'] })
    expect(req.body.tags).toEqual(['a', 'b'])
  })

  it('leaves non-string values unchanged', () => {
    const { req } = run({ count: 42, active: true, data: null })
    expect(req.body.count).toBe(42)
    expect(req.body.active).toBe(true)
  })

  it('calls next()', () => {
    const { next } = run({ x: 'hello' })
    expect(next).toHaveBeenCalled()
  })

  it('handles missing body gracefully', () => {
    const req = {}
    const next = vi.fn()
    sanitizeInput(req, {}, next)
    expect(next).toHaveBeenCalled()
  })
})
