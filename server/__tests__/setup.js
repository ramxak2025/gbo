import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from '../routes/auth.js'
import dataRoutes from '../routes/data.js'
import uploadRoutes from '../routes/upload.js'
import pushRoutes from '../routes/push.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '10mb' }))
  app.use(cookieParser())
  app.use('/api/auth', authRoutes)
  app.use('/api/data', dataRoutes)
  app.use('/api/upload', uploadRoutes)
  app.use('/api/push', pushRoutes)
  return app
}
