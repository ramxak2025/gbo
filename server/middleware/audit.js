import pool from '../db.js'

// Audit log — records important actions for security monitoring
export async function logAudit(action, userId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_log (action, user_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [action, userId || null, JSON.stringify(details), details.ip || null]
    )
  } catch (err) {
    console.error('Audit log error:', err.message)
  }
}

// Middleware that logs modifying requests automatically
export function auditMiddleware(req, res, next) {
  // Only audit modifying requests
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const originalJson = res.json.bind(res)
    res.json = function (data) {
      // Log after successful response
      if (res.statusCode < 400) {
        const userId = req.user?.userId || null
        const action = `${req.method} ${req.path}`
        const details = {
          ip: req.ip || req.headers['x-forwarded-for'],
          role: req.user?.role,
          userAgent: req.headers['user-agent']?.substring(0, 200),
        }
        logAudit(action, userId, details).catch(() => {})
      }
      return originalJson(data)
    }
  }
  next()
}
