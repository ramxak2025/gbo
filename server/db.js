import pg from 'pg'
const { Pool } = pg

const dbUrl = process.env.DATABASE_URL || ''
const needSSL = dbUrl.includes('neon.tech') ||
  dbUrl.includes('supabase') ||
  dbUrl.includes('vercel-storage') ||
  dbUrl.includes('sslmode=require') ||
  process.env.DB_SSL === 'true'

const pool = new Pool({
  connectionString: dbUrl,
  ssl: needSSL ? { rejectUnauthorized: false } : undefined,
})

export default pool

export async function initDB() {
  const fs = await import('fs')
  const path = await import('path')
  const { fileURLToPath } = await import('url')
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
  await pool.query(schema)
  console.log('Database schema initialized')
}
