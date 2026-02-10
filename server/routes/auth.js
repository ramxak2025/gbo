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
