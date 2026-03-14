import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { signToken, verifyToken } from '../auth.js'

const router = Router()

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '').slice(-10)
}

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) return res.status(400).json({ error: 'Введите номер и пароль' })

    const digits = normalizePhone(phone)
    if (digits.length < 10) return res.status(400).json({ error: 'Введите корректный номер телефона' })

    // Indexed search by normalized last 10 digits — works with any phone format
    const { rows: [user] } = await pool.query(
      `SELECT * FROM users WHERE RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = $1 LIMIT 1`, [digits]
    )
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = signToken({ userId: user.id, role: user.role })
      res.cookie('token', token, { httpOnly: true, maxAge: 30 * 86400000, sameSite: 'lax' })
      return res.json({
        token,
        userId: user.id,
        role: user.role,
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role, avatar: user.avatar, clubName: user.club_name, clubId: user.club_id || null, isHeadTrainer: !!user.is_head_trainer, sportType: user.sport_type, sportTypes: user.sport_types || [], city: user.city },
      })
    }

    // Check students — normalized phone search
    const { rows: [student] } = await pool.query(
      `SELECT * FROM students WHERE RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = $1 LIMIT 1`, [digits]
    )
    if (student && await bcrypt.compare(password, student.password_hash)) {
      const { rows: [trainer] } = await pool.query('SELECT * FROM users WHERE id = $1', [student.trainer_id])
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

    // Check parents — normalized phone search
    const { rows: [parent] } = await pool.query(
      `SELECT * FROM parents WHERE RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = $1 LIMIT 1`, [digits]
    )
    if (parent && await bcrypt.compare(password, parent.password_hash)) {
      const { rows: [pStudent] } = await pool.query('SELECT * FROM students WHERE id = $1', [parent.student_id])
      if (!pStudent) return res.status(400).json({ error: 'Ученик не найден' })
      const { rows: [pTrainer] } = await pool.query('SELECT * FROM users WHERE id = $1', [pStudent.trainer_id])
      if (!pTrainer) return res.status(400).json({ error: 'Тренер не найден' })
      const token = signToken({ userId: pTrainer.id, role: 'parent', studentId: pStudent.id, parentId: parent.id })
      res.cookie('token', token, { httpOnly: true, maxAge: 30 * 86400000, sameSite: 'lax' })
      return res.json({
        token,
        userId: pTrainer.id,
        role: 'parent',
        studentId: pStudent.id,
        parentId: parent.id,
        user: { id: pTrainer.id, name: pTrainer.name, phone: pTrainer.phone, role: pTrainer.role, avatar: pTrainer.avatar, clubName: pTrainer.club_name },
        student: {
          id: pStudent.id, name: pStudent.name, phone: pStudent.phone, belt: pStudent.belt,
          weight: pStudent.weight ? parseFloat(pStudent.weight) : null,
          status: pStudent.status, groupId: pStudent.group_id,
          subscriptionExpiresAt: pStudent.subscription_expires_at,
        },
        parent: { id: parent.id, name: parent.name, phone: parent.phone, relation: parent.relation },
      })
    }

    // Determine error type
    if (user) return res.status(401).json({ error: 'Неверный пароль', errorType: 'trainer' })
    if (student) return res.status(401).json({ error: 'Неверный пароль', errorType: 'student' })
    if (parent) return res.status(401).json({ error: 'Неверный пароль', errorType: 'parent' })
    return res.status(401).json({ error: 'Пользователь не найден', errorType: 'student' })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// --- Public registration for trainers ---
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, clubName, sportType, city, consent } = req.body
    if (!name || !phone || !password) return res.status(400).json({ error: 'Заполните все обязательные поля' })
    if (!consent) return res.status(400).json({ error: 'Необходимо согласие на обработку персональных данных' })

    const digits = normalizePhone(phone)
    if (digits.length < 10) return res.status(400).json({ error: 'Введите корректный номер телефона' })

    // Check if phone already exists in users
    const { rows: existingUsers } = await pool.query(
      `SELECT id FROM users WHERE RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = $1`, [digits]
    )
    if (existingUsers.length > 0) return res.status(400).json({ error: 'Этот номер уже зарегистрирован' })

    // Check if phone already has a pending request
    const { rows: existingRegs } = await pool.query(
      `SELECT id FROM pending_registrations WHERE RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = $1 AND status = 'pending'`, [digits]
    )
    if (existingRegs.length > 0) return res.status(400).json({ error: 'Заявка с этим номером уже отправлена. Ожидайте одобрения.' })

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    const hash = await bcrypt.hash(password, 10)

    await pool.query(
      `INSERT INTO pending_registrations (id, name, phone, password_hash, plain_password, club_name, sport_type, city, consent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, name.trim(), phone, hash, password, clubName?.trim() || '', sportType || null, city?.trim() || null, true]
    )

    res.json({ ok: true, message: 'Заявка отправлена! Ожидайте одобрения администратора.' })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ ok: true })
})

router.get('/me', async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.json(null)
  try {
    const decoded = verifyToken(token)

    const { rows: [user] } = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId])
    if (!user) return res.json(null)

    const result = {
      userId: decoded.userId,
      role: decoded.role,
      studentId: decoded.studentId || null,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, avatar: user.avatar, clubName: user.club_name, clubId: user.club_id || null, isHeadTrainer: !!user.is_head_trainer, sportType: user.sport_type, sportTypes: user.sport_types || [], city: user.city },
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
    if (decoded.parentId) {
      const { rows: [parent] } = await pool.query('SELECT * FROM parents WHERE id = $1', [decoded.parentId])
      if (parent) {
        result.parentId = parent.id
        result.parent = { id: parent.id, name: parent.name, phone: parent.phone, relation: parent.relation }
      }
    }
    res.json(result)
  } catch {
    res.json(null)
  }
})

export default router
