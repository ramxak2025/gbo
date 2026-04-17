import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'
import { seedDatabase } from './seed.js'
import { checkDemoReset } from './demo.js'
import { securityHeaders, authLimiter, apiLimiter, uploadLimiter, sanitizeInput } from './middleware/security.js'
import { errorHandler } from './middleware/errorHandler.js'
import { auditMiddleware } from './middleware/audit.js'
import authRoutes from './routes/auth.js'
import dataRoutes from './routes/data.js'
import uploadRoutes from './routes/upload.js'
import pushRoutes from './routes/push.js'
import healthRoutes from './routes/health.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Trust reverse proxy (nginx/Vercel) so req.ip returns real client IP
// instead of 127.0.0.1 — required for rate limiting and audit logging
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY) {
  app.set('trust proxy', 1)
}

// Security headers (helmet)
app.use(securityHeaders)

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN
app.use(cors({
  origin: corsOrigin || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Input sanitization — strip XSS from all incoming bodies
app.use(sanitizeInput)

// API rate limiting
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/upload', uploadLimiter)
app.use('/api', apiLimiter)

// Audit logging for modifying requests
app.use('/api', auditMiddleware)

// Serve uploaded files
const uploadsPath = path.join(__dirname, 'uploads')
app.use('/uploads', express.static(uploadsPath))

// Health check (no auth required)
app.use('/api/health', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/push', pushRoutes)

// Global error handler
app.use('/api', errorHandler)

// Serve React build
const distPath = path.join(__dirname, '..', 'dist')

// Prevent caching of sw.js so browser always checks for updates
app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.sendFile(path.join(distPath, 'sw.js'))
})

app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    // No cache for index.html, aggressive cache for hashed assets
    if (filePath.endsWith('index.html') || filePath.endsWith('manifest.json')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    }
  }
}))

app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.sendFile(path.join(distPath, 'index.html'))
})

async function start() {
  await initDB()
  await seedDatabase()
  await checkDemoReset()
  // Check demo reset every hour
  setInterval(() => checkDemoReset(), 3600000)
  app.listen(PORT, () => {
    console.log(`iBorcuha server running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`Health check: http://localhost:${PORT}/api/health`)
  })
}

start().catch(console.error)

export default app
