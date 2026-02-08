import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'
import { seedDatabase } from './seed.js'
import authRoutes from './routes/auth.js'
import dataRoutes from './routes/data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)

// Serve React build
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

async function start() {
  await initDB()
  await seedDatabase()
  app.listen(PORT, () => {
    console.log(`iBorcuha server running on port ${PORT}`)
  })
}

start().catch(console.error)
