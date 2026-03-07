import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import crypto from 'crypto'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'
import { seedDatabase } from './seed.js'
import { checkDemoReset } from './demo.js'
import authRoutes from './routes/auth.js'
import dataRoutes from './routes/data.js'
import uploadRoutes from './routes/upload.js'
import pushRoutes from './routes/push.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Serve uploaded files
const uploadsPath = path.join(__dirname, 'uploads')
app.use('/uploads', express.static(uploadsPath))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/push', pushRoutes)

// EAS Build webhook - auto-download APK when build completes
app.post('/api/eas-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.EAS_WEBHOOK_SECRET
  if (!secret) return res.status(500).json({ error: 'Webhook secret not configured' })

  // Verify signature from Expo
  const sig = req.headers['expo-signature']
  if (!sig) return res.status(401).json({ error: 'Missing signature' })

  const hmac = crypto.createHmac('sha1', secret).update(req.body).digest('hex')
  if (sig !== `sha1=${hmac}`) return res.status(401).json({ error: 'Invalid signature' })

  const payload = JSON.parse(req.body)

  // Only process successful Android builds
  if (payload.status !== 'finished' || payload.platform !== 'android') {
    return res.json({ ok: true, skipped: true })
  }

  const artifactUrl = payload.artifacts?.buildUrl
  if (!artifactUrl) return res.status(400).json({ error: 'No artifact URL' })

  try {
    const apkPath = path.join(__dirname, '..', 'public', 'download', 'iborcuha.apk')
    const response = await fetch(artifactUrl)
    if (!response.ok) throw new Error(`Download failed: ${response.status}`)
    await pipeline(response.body, createWriteStream(apkPath))
    console.log('APK updated from EAS build:', payload.id)
    res.json({ ok: true, updated: true })
  } catch (err) {
    console.error('Failed to download APK:', err)
    res.status(500).json({ error: 'Download failed' })
  }
})

// Serve APK download
app.get('/download/iborcuha.apk', (req, res) => {
  const apkPath = path.join(__dirname, '..', 'public', 'download', 'iborcuha.apk')
  res.download(apkPath, 'iborcuha.apk', (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'APK not found' })
    }
  })
})

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
  })
}

start().catch(console.error)
