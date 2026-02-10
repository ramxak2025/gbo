import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { initDB } from '../server/db.js'
import { seedDatabase } from '../server/seed.js'
import authRoutes from '../server/routes/auth.js'
import dataRoutes from '../server/routes/data.js'
import uploadRoutes from '../server/routes/upload.js'
import pushRoutes from '../server/routes/push.js'

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/push', pushRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: 'vercel' })
})

let dbReady = false

export default async function handler(req, res) {
  if (!dbReady) {
    try {
      await initDB()
      await seedDatabase()
      dbReady = true
    } catch (err) {
      console.error('DB init error:', err)
      return res.status(500).json({ error: 'Ошибка подключения к базе данных' })
    }
  }
  return app(req, res)
}
