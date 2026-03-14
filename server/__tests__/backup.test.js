import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { cleanOldBackups } from '../backup.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_BACKUP_DIR = path.join(__dirname, '..', '..', 'backups-test')

describe('Backup system', () => {
  beforeAll(() => {
    if (!fs.existsSync(TEST_BACKUP_DIR)) fs.mkdirSync(TEST_BACKUP_DIR, { recursive: true })
  })

  afterAll(() => {
    if (fs.existsSync(TEST_BACKUP_DIR)) {
      fs.rmSync(TEST_BACKUP_DIR, { recursive: true, force: true })
    }
  })

  it('should create backup directory', () => {
    expect(fs.existsSync(TEST_BACKUP_DIR)).toBe(true)
  })

  it('cleanOldBackups should not crash on empty directory', () => {
    // Point BACKUP_DIR to test dir via env
    const origDir = process.env.BACKUP_DIR
    process.env.BACKUP_DIR = TEST_BACKUP_DIR
    expect(() => cleanOldBackups()).not.toThrow()
    process.env.BACKUP_DIR = origDir
  })

  it('cleanOldBackups should delete files older than retention', () => {
    // Create fake backup files
    const oldFile = path.join(TEST_BACKUP_DIR, 'backup-2025-01-01T00-00-00.sql.gz')
    const newFile = path.join(TEST_BACKUP_DIR, 'backup-2026-03-14T00-00-00.sql.gz')
    const newFile2 = path.join(TEST_BACKUP_DIR, 'backup-2026-03-13T00-00-00.sql.gz')

    fs.writeFileSync(oldFile, 'old')
    fs.writeFileSync(newFile, 'new')
    fs.writeFileSync(newFile2, 'new2')

    // Set old file mtime to 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    fs.utimesSync(oldFile, thirtyDaysAgo, thirtyDaysAgo)

    const origDir = process.env.BACKUP_DIR
    process.env.BACKUP_DIR = TEST_BACKUP_DIR
    cleanOldBackups()
    process.env.BACKUP_DIR = origDir

    // Old file should be deleted, new files kept
    expect(fs.existsSync(oldFile)).toBe(false)
    expect(fs.existsSync(newFile)).toBe(true)
    expect(fs.existsSync(newFile2)).toBe(true)
  })

  it('should always keep at least 2 backups', () => {
    // Clean dir
    for (const f of fs.readdirSync(TEST_BACKUP_DIR)) {
      fs.unlinkSync(path.join(TEST_BACKUP_DIR, f))
    }

    // Create 3 old backups
    const files = []
    for (let i = 0; i < 3; i++) {
      const f = path.join(TEST_BACKUP_DIR, `backup-2025-0${i + 1}-01T00-00-00.sql.gz`)
      fs.writeFileSync(f, `backup${i}`)
      const oldDate = new Date(Date.now() - (30 + i * 10) * 24 * 60 * 60 * 1000)
      fs.utimesSync(f, oldDate, oldDate)
      files.push(f)
    }

    const origDir = process.env.BACKUP_DIR
    process.env.BACKUP_DIR = TEST_BACKUP_DIR
    cleanOldBackups()
    process.env.BACKUP_DIR = origDir

    const remaining = fs.readdirSync(TEST_BACKUP_DIR).filter(f => f.startsWith('backup-'))
    expect(remaining.length).toBeGreaterThanOrEqual(2)
  })
})
