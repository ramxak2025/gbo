import helmet from 'helmet'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

// Helmet — HTTP security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // CSP managed by frontend framework
  crossOriginEmbedderPolicy: false, // Allow loading external images/videos
})

// Rate limiter for auth endpoints (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // максимум 20 попыток за окно
  message: { error: 'Слишком много попыток. Попробуйте через 15 минут.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip) || 'unknown',
})

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 200, // 200 запросов в минуту
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { error: 'Слишком много загрузок. Попробуйте позже.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Input sanitization middleware — strips HTML tags from string values
export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  next()
}

function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'string' ? stripTags(item) : typeof item === 'object' && item !== null ? sanitizeObject(item) : item)
  }
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Don't sanitize password fields or URLs
      if (key === 'password' || key === 'videoUrl' || key === 'coverImage' || key === 'avatar' || key === 'customThumb' || key === 'endpoint' || key === 'url') {
        result[key] = value
      } else {
        result[key] = stripTags(value)
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value)
    } else {
      result[key] = value
    }
  }
  return result
}

function stripTags(str) {
  return str.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '')
}
