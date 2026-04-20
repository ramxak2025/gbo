import { Router } from 'express'
import webPush from 'web-push'
import pool from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BNgqh5tV4CBa9wPZuFGweC3RvRyTpHZKWdeIVgRdSqSXd2ExulOPlyupSWEh9imarSbFlCmgbMBBiIJ3kT9qNKE'
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'cZuJ_Uumd15VHe9PE1Ab0o6hoqHS5tAdqsEr_q6fYro'

webPush.setVapidDetails(
  'mailto:admin@iborcuha.ru',
  VAPID_PUBLIC,
  VAPID_PRIVATE
)

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC })
})

// Subscribe to push
router.post('/subscribe', authMiddleware, async (req, res) => {
  const { subscription } = req.body
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' })

  const { userId, studentId } = req.user
  const { endpoint } = subscription
  const p256dh = subscription.keys?.p256dh || ''
  const auth = subscription.keys?.auth || ''

  await pool.query(
    `INSERT INTO push_subscriptions (user_id, student_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint) DO UPDATE SET user_id=$1, student_id=$2, p256dh=$4, auth=$5`,
    [userId, studentId || null, endpoint, p256dh, auth]
  )
  res.json({ ok: true })
})

// Register Expo push token (mobile, v1.2.0+) — аддитивный, не ломает web-push
router.post('/register-token', authMiddleware, async (req, res) => {
  const { token, platform } = req.body
  if (!token || typeof token !== 'string' || token.length < 10) {
    return res.status(400).json({ error: 'Некорректный push-токен' })
  }
  const { userId, studentId } = req.user
  await pool.query(
    `INSERT INTO device_tokens (user_id, student_id, token, platform, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (token) DO UPDATE SET user_id = $1, student_id = $2, platform = $4, updated_at = NOW()`,
    [userId, studentId || null, token, platform || null]
  )
  res.json({ ok: true })
})

// Delete Expo push token (logout, or user revokes permission)
router.post('/unregister-token', authMiddleware, async (req, res) => {
  const { token } = req.body
  if (token) await pool.query('DELETE FROM device_tokens WHERE token = $1', [token])
  res.json({ ok: true })
})

// Unsubscribe
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  const { endpoint } = req.body
  if (endpoint) {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint])
  }
  res.json({ ok: true })
})

// Get notification settings
router.get('/settings', authMiddleware, async (req, res) => {
  const { userId, studentId } = req.user
  const { rows } = await pool.query(
    'SELECT * FROM notification_settings WHERE user_id = $1 AND (student_id = $2 OR student_id IS NULL)',
    [userId, studentId || null]
  )
  if (rows.length > 0) {
    const s = rows[0]
    res.json({ news: s.news, tournaments: s.tournaments, payments: s.payments, schedule: s.schedule })
  } else {
    res.json({ news: true, tournaments: true, payments: true, schedule: true })
  }
})

// Update notification settings
router.put('/settings', authMiddleware, async (req, res) => {
  const { userId, studentId } = req.user
  const { news, tournaments, payments, schedule } = req.body
  await pool.query(
    `INSERT INTO notification_settings (user_id, student_id, news, tournaments, payments, schedule)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, student_id) DO UPDATE SET news=$3, tournaments=$4, payments=$5, schedule=$6`,
    [userId, studentId || null, news ?? true, tournaments ?? true, payments ?? true, schedule ?? true]
  )
  res.json({ ok: true })
})

// Send notification (admin/trainer use)
export async function sendPushToUser(userId, studentId, payload) {
  const conditions = []
  const params = []
  if (userId) { conditions.push(`user_id = $${params.length + 1}`); params.push(userId) }
  if (studentId) { conditions.push(`student_id = $${params.length + 1}`); params.push(studentId) }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' OR ')}` : ''
  const { rows } = await pool.query(`SELECT * FROM push_subscriptions ${where}`, params)

  const results = []
  for (const sub of rows) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth }
    }
    try {
      await webPush.sendNotification(pushSub, JSON.stringify(payload))
      results.push({ endpoint: sub.endpoint, success: true })
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint])
      }
      results.push({ endpoint: sub.endpoint, success: false })
    }
  }
  return results
}

// Send push (admin endpoint)
router.post('/send', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'trainer') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const { title, body, url, userId, studentId } = req.body
  const results = await sendPushToUser(userId, studentId, { title, body, url })
  res.json({ sent: results.length, results })
})

export default router
