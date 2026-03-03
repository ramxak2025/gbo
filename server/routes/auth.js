import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { signToken } from '../auth.js'

const router = Router()

function phonesMatch(a, b) {
  const da = (a || '').replace(/\D/g, '')
  const db = (b || '').replace(/\D/g, '')
  if (!da || !db) return false
  return da.slice(-10) === db.slice(-10)
}

router.post('/login', async (req, res) => {
  const { phone, password } = req.body
  if (!phone || !password) return res.status(400).json({ error: 'Введите номер и пароль' })

  const digits = phone.replace(/\D/g, '').slice(-10)

  // Check users (admin/trainer)
  const { rows: users } = await pool.query('SELECT * FROM users')
  const user = users.find(u => phonesMatch(u.phone, phone))
  if (user && bcrypt.compareSync(password, user.password_hash)) {
    const token = signToken({ userId: user.id, role: user.role })
    res.cookie('token', token, { httpOnly: true, maxAge: 30 * 86400000, sameSite: 'lax' })
    return res.json({
      token,
      userId: user.id,
      role: user.role,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, avatar: user.avatar, clubName: user.club_name },
    })
  }

  // Check students
  const { rows: students } = await pool.query('SELECT * FROM students')
  const student = students.find(s => phonesMatch(s.phone, phone))
  if (student && bcrypt.compareSync(password, student.password_hash)) {
    const trainer = users.find(u => u.id === student.trainer_id)
    if (!trainer) return res.status(400).json({ error: 'Тренер не найден', errorType: 'student' })
    const token = signToken({ userId: trainer.id, role: 'student', studentId: student.id })
    res.cookie('token', token, { httpOnly: true, maxAge: 30 * 86400000, sameSite: 'lax' })
    return res.json({
      token,
      userId: trainer.id,
      role: 'student',
      studentId: student.id,
      user: { id: trainer.id, name: trainer.name, phone: trainer.phone, role: trainer.role, avatar: trainer.avatar, clubName: trainer.club_name },
      student: {
        id: student.id, name: student.name, phone: student.phone, belt: student.belt,
        weight: student.weight ? parseFloat(student.weight) : null,
        status: student.status, groupId: student.group_id,
        subscriptionExpiresAt: student.subscription_expires_at,
      },
    })
  }

  // Error type
  if (user) return res.status(401).json({ error: 'Неверный пароль', errorType: 'trainer' })
  if (student) return res.status(401).json({ error: 'Неверный пароль', errorType: 'student' })
  return res.status(401).json({ error: 'Пользователь не найден', errorType: 'student' })
})

// --- Public registration for trainers ---
router.post('/register', async (req, res) => {
  const { name, phone, password, clubName, sportType, city, consent } = req.body
  if (!name || !phone || !password) return res.status(400).json({ error: 'Заполните все обязательные поля' })
  if (!consent) return res.status(400).json({ error: 'Необходимо согласие на обработку персональных данных' })

  const digits = phone.replace(/\D/g, '').slice(-10)
  if (digits.length < 10) return res.status(400).json({ error: 'Введите корректный номер телефона' })

  // Check if phone already exists in users
  const { rows: existingUsers } = await pool.query('SELECT id FROM users WHERE phone LIKE $1', [`%${digits}`])
  if (existingUsers.length > 0) return res.status(400).json({ error: 'Этот номер уже зарегистрирован' })

  // Check if phone already has a pending request
  const { rows: existingRegs } = await pool.query("SELECT id FROM pending_registrations WHERE phone LIKE $1 AND status = 'pending'", [`%${digits}`])
  if (existingRegs.length > 0) return res.status(400).json({ error: 'Заявка с этим номером уже отправлена. Ожидайте одобрения.' })

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const hash = bcrypt.hashSync(password, 10)

  await pool.query(
    `INSERT INTO pending_registrations (id, name, phone, password_hash, plain_password, club_name, sport_type, city, consent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, name.trim(), phone, hash, password, clubName?.trim() || '', sportType || null, city?.trim() || null, true]
  )

  res.json({ ok: true, message: 'Заявка отправлена! Ожидайте одобрения администратора.' })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ ok: true })
})

router.get('/me', async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.json(null)
  try {
    const { default: jwt } = await import('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'iborcuha-secret-key-change-me')

    const { rows: [user] } = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId])
    if (!user) return res.json(null)

    const result = {
      userId: decoded.userId,
      role: decoded.role,
      studentId: decoded.studentId || null,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, avatar: user.avatar, clubName: user.club_name },
    }

    if (decoded.studentId) {
      const { rows: [student] } = await pool.query('SELECT * FROM students WHERE id = $1', [decoded.studentId])
      if (!student) return res.json(null)
      result.student = {
        id: student.id, name: student.name, phone: student.phone, belt: student.belt,
        weight: student.weight ? parseFloat(student.weight) : null,
        status: student.status, groupId: student.group_id,
        subscriptionExpiresAt: student.subscription_expires_at,
      }
    }
    res.json(result)
  } catch {
    res.json(null)
  }
})

export default router
