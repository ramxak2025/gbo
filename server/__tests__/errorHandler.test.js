import { describe, it, expect, vi } from 'vitest'
import { errorHandler, asyncHandler } from '../middleware/errorHandler.js'

function mockReqRes() {
  const req = { method: 'GET', path: '/test' }
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(data) { this.body = data; return this },
  }
  const next = vi.fn()
  return { req, res, next }
}

describe('errorHandler', () => {
  // Silence console.error during tests
  vi.spyOn(console, 'error').mockImplementation(() => {})

  it('returns 413 for LIMIT_FILE_SIZE error', () => {
    const { req, res, next } = mockReqRes()
    const err = new Error('File too big')
    err.code = 'LIMIT_FILE_SIZE'
    errorHandler(err, req, res, next)
    expect(res.statusCode).toBe(413)
  })

  it('returns 400 for MulterError', () => {
    const { req, res, next } = mockReqRes()
    const err = new Error('Unexpected field')
    err.name = 'MulterError'
    errorHandler(err, req, res, next)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toContain('Unexpected field')
  })

  it('returns 400 for entity.parse.failed', () => {
    const { req, res, next } = mockReqRes()
    const err = new Error('Bad JSON')
    err.type = 'entity.parse.failed'
    errorHandler(err, req, res, next)
    expect(res.statusCode).toBe(400)
  })

  it('returns 401 for JsonWebTokenError', () => {
    const { req, res, next } = mockReqRes()
    const err = new Error('invalid token')
    err.name = 'JsonWebTokenError'
    errorHandler(err, req, res, next)
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 for TokenExpiredError', () => {
    const { req, res, next } = mockReqRes()
    const err = new Error('jwt expired')
    err.name = 'TokenExpiredError'
    errorHandler(err, req, res, next)
    expect(res.statusCode).toBe(401)
  })

  it('returns custom status from err.status', () => {
    const { req, res, next } = mockReqRes()
    const err = new Error('Not found')
    err.status = 404
    errorHandler(err, req, res, next)
    expect(res.statusCode).toBe(404)
    expect(res.body.error).toBe('Not found')
  })

  it('returns custom status from err.statusCode', () => {
    const { req, res, next } = mockReqRes()
    const err = new Error('Forbidden')
    err.statusCode = 403
    errorHandler(err, req, res, next)
    expect(res.statusCode).toBe(403)
  })

  it('defaults to 500 and hides message', () => {
    const { req, res, next } = mockReqRes()
    const err = new Error('internal detail')
    errorHandler(err, req, res, next)
    expect(res.statusCode).toBe(500)
    expect(res.body.error).toBe('Внутренняя ошибка сервера')
  })
})

describe('asyncHandler', () => {
  it('passes async errors to next()', async () => {
    const error = new Error('async fail')
    const handler = asyncHandler(async () => { throw error })
    const { req, res, next } = mockReqRes()
    await handler(req, res, next)
    expect(next).toHaveBeenCalledWith(error)
  })

  it('does not call next on success', async () => {
    const handler = asyncHandler(async (req, res) => {
      res.status(200).json({ ok: true })
    })
    const { req, res, next } = mockReqRes()
    await handler(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })
})
