import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import crypto from 'crypto'
import { authMiddleware } from '../auth.js'

let sharp
try { sharp = (await import('sharp')).default } catch { sharp = null }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    const name = crypto.randomBytes(12).toString('hex') + ext
    cb(null, name)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images allowed'))
  }
})

const router = Router()

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  // Compress images with sharp if available
  if (sharp && req.file.mimetype.startsWith('image/')) {
    try {
      const inputPath = req.file.path
      const compressedName = crypto.randomBytes(12).toString('hex') + '.webp'
      const outputPath = path.join(uploadsDir, compressedName)

      await sharp(inputPath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(outputPath)

      // Remove original, serve compressed
      fs.unlink(inputPath, () => {})

      return res.json({ url: `/uploads/${compressedName}` })
    } catch (err) {
      // Fallback to original on compression error
      console.error('Image compression failed:', err.message)
    }
  }

  const url = `/uploads/${req.file.filename}`
  res.json({ url })
})

export default router
