import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_BACKUP_DIR = path.join(__dirname, '..', 'backups')

function getBackupDir() {
  return process.env.BACKUP_DIR || DEFAULT_BACKUP_DIR
}
function getRetentionDays() {
  return parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10)
}
function getIntervalHours() {
  return parseInt(process.env.BACKUP_INTERVAL_HOURS || '6', 10)
}

function getTimestamp() {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

export function createBackup() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.warn('BACKUP: DATABASE_URL not set, skipping backup')
    return null
  }

  const backupDir = getBackupDir()
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })

  const timestamp = getTimestamp()
  const filename = `backup-${timestamp}.sql.gz`
  const filepath = path.join(backupDir, filename)

  try {
    execSync(`pg_dump "${dbUrl}" | gzip > "${filepath}"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 300000,
    })

    const stats = fs.statSync(filepath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`BACKUP: Created ${filename} (${sizeMB} MB)`)
    return filepath
  } catch (err) {
    console.error('BACKUP: pg_dump failed, falling back to JSON export')
    return createFallbackBackup(timestamp)
  }
}

async function createFallbackBackup(timestamp) {
  const { default: pool } = await import('./db.js')
  const backupDir = getBackupDir()
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })

  const filename = `backup-${timestamp}.json.gz`
  const filepath = path.join(backupDir, filename)

  try {
    const tables = [
      'users', 'groups', 'students', 'transactions', 'tournaments',
      'tournament_registrations', 'news', 'push_subscriptions',
      'notification_settings', 'internal_tournaments', 'author_info',
      'attendance', 'materials', 'clubs', 'parents', 'student_groups',
      'branches', 'qr_tokens', 'trainer_qr_tokens', 'pending_registrations',
    ]

    const backup = {}
    for (const table of tables) {
      try {
        const { rows } = await pool.query(`SELECT * FROM ${table}`)
        backup[table] = rows
      } catch {
        backup[table] = []
      }
    }

    backup._meta = {
      createdAt: new Date().toISOString(),
      tables: Object.keys(backup).filter(k => k !== '_meta'),
      totalRows: Object.values(backup).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0),
    }

    const { createGzip } = await import('zlib')
    const { pipeline } = await import('stream/promises')
    const { Readable } = await import('stream')

    const jsonStr = JSON.stringify(backup)
    const input = Readable.from([jsonStr])
    const gzip = createGzip()
    const output = fs.createWriteStream(filepath)

    await pipeline(input, gzip, output)

    const stats = fs.statSync(filepath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`BACKUP: Created fallback ${filename} (${sizeMB} MB)`)
    return filepath
  } catch (err) {
    console.error('BACKUP: Fallback backup also failed:', err.message)
    return null
  }
}

export function cleanOldBackups() {
  const backupDir = getBackupDir()
  if (!fs.existsSync(backupDir)) return

  const now = Date.now()
  const maxAge = getRetentionDays() * 24 * 60 * 60 * 1000

  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup-'))
    .map(f => ({
      name: f,
      path: path.join(backupDir, f),
      mtime: fs.statSync(path.join(backupDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)

  // Always keep at least 2 backups regardless of age
  const toDelete = files.slice(2).filter(f => (now - f.mtime) > maxAge)

  for (const file of toDelete) {
    try {
      fs.unlinkSync(file.path)
      console.log(`BACKUP: Deleted old backup ${file.name}`)
    } catch (err) {
      console.error(`BACKUP: Failed to delete ${file.name}:`, err.message)
    }
  }

  if (toDelete.length > 0) {
    console.log(`BACKUP: Cleaned ${toDelete.length} old backup(s), ${files.length - toDelete.length} remaining`)
  }
}

export function runBackupCycle() {
  try {
    createBackup()
    cleanOldBackups()
  } catch (err) {
    console.error('BACKUP: Backup cycle failed:', err.message)
  }
}

let backupInterval = null

export function startBackupScheduler() {
  const intervalHours = getIntervalHours()
  const retentionDays = getRetentionDays()
  console.log(`BACKUP: Scheduler started — every ${intervalHours}h, retention ${retentionDays} days`)

  // Run first backup after 1 minute (let the server start up first)
  setTimeout(() => {
    runBackupCycle()

    backupInterval = setInterval(
      runBackupCycle,
      intervalHours * 60 * 60 * 1000
    )
  }, 60000)
}

export function stopBackupScheduler() {
  if (backupInterval) {
    clearInterval(backupInterval)
    backupInterval = null
  }
}
