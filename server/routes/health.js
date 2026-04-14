import { Router } from 'express'
import pool from '../db.js'

const router = Router()
const startTime = Date.now()

// GET /api/health — system health check
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  }

  // Check database connection
  try {
    const dbStart = Date.now()
    await pool.query('SELECT 1')
    health.database = {
      status: 'connected',
      responseTime: Date.now() - dbStart,
    }
  } catch (err) {
    health.status = 'degraded'
    health.database = {
      status: 'error',
      message: err.message,
    }
  }

  // Memory usage
  const mem = process.memoryUsage()
  health.memory = {
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
  }

  const statusCode = health.status === 'ok' ? 200 : 503
  res.status(statusCode).json(health)
})

export default router
