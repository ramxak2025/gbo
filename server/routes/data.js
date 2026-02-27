import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { authMiddleware } from '../auth.js'
import crypto from 'crypto'

const router = Router()
const genId = () => Date.now().toString(36) + crypto.randomBytes(4).toString('hex')

function mapUser(u) {
  return { id: u.id, name: u.name, phone: u.phone, role: u.role, avatar: u.avatar, clubName: u.club_name, sportType: u.sport_type, city: u.city }
}
function mapInternalTournament(t) {
  return { id: t.id, trainerId: t.trainer_id, title: t.title, date: t.date, status: t.status, brackets: t.brackets, createdAt: t.created_at }
}
function mapStudent(s) {
  return {
    id: s.id, trainerId: s.trainer_id, groupId: s.group_id,
    name: s.name, phone: s.phone,
    weight: s.weight ? parseFloat(s.weight) : null,
    belt: s.belt, birthDate: s.birth_date, avatar: s.avatar,
    subscriptionExpiresAt: s.subscription_expires_at, status: s.status,
    trainingStartDate: s.training_start_date,
    createdAt: s.created_at, password: '***',
  }
}
function mapGroup(g) {
  return { id: g.id, trainerId: g.trainer_id, name: g.name, schedule: g.schedule, subscriptionCost: g.subscription_cost, attendanceEnabled: !!g.attendance_enabled }
}
function mapAttendance(a) {
  return { id: a.id, groupId: a.group_id, studentId: a.student_id, date: a.date, present: a.present }
}
function mapTx(t) {
  return { id: t.id, trainerId: t.trainer_id, type: t.type, amount: t.amount, category: t.category, description: t.description, studentId: t.student_id, date: t.date }
}
function mapTournament(t) {
  return { id: t.id, title: t.title, coverImage: t.cover_image, date: t.date, location: t.location, description: t.description, createdBy: t.created_by }
}
function mapNews(n) {
  return { id: n.id, trainerId: n.trainer_id, groupId: n.group_id, title: n.title, content: n.content, date: n.date }
}
function mapAuthor(a) {
  return a ? { name: a.name, instagram: a.instagram, website: a.website, description: a.description, phone: a.phone } : {}
}

// GET all data (role-aware)
router.get('/', authMiddleware, async (req, res) => {
  const { userId, role, studentId } = req.user
  const [users, groups, students, transactions, tournaments, news, regs, author, intTournaments, attendance] = await Promise.all([
    pool.query('SELECT * FROM users'),
    pool.query('SELECT * FROM groups'),
    pool.query('SELECT * FROM students'),
    pool.query('SELECT * FROM transactions'),
    pool.query('SELECT * FROM tournaments ORDER BY date'),
    pool.query('SELECT * FROM news ORDER BY date DESC'),
    pool.query('SELECT * FROM tournament_registrations'),
    pool.query('SELECT * FROM author_info WHERE id = 1'),
    pool.query('SELECT * FROM internal_tournaments ORDER BY created_at DESC'),
    pool.query('SELECT * FROM attendance ORDER BY date DESC'),
  ])
  res.json({
    users: users.rows.map(mapUser),
    groups: groups.rows.map(mapGroup),
    students: students.rows.map(mapStudent),
    transactions: transactions.rows.map(mapTx),
    tournaments: tournaments.rows.map(mapTournament),
    news: news.rows.map(mapNews),
    tournamentRegistrations: regs.rows.map(r => ({ tournamentId: r.tournament_id, studentId: r.student_id })),
    authorInfo: mapAuthor(author.rows[0]),
    internalTournaments: intTournaments.rows.map(mapInternalTournament),
    attendance: attendance.rows.map(mapAttendance),
  })
})

// --- Students ---
router.post('/students', authMiddleware, async (req, res) => {
  const { name, phone, weight, belt, birthDate, groupId, password, avatar, subscriptionExpiresAt, trainerId, trainingStartDate } = req.body
  const id = genId()
  const hash = bcrypt.hashSync(password || 'student123', 10)
  const tid = trainerId || req.user.userId
  await pool.query(
    `INSERT INTO students (id, trainer_id, group_id, name, phone, password_hash, weight, belt, birth_date, avatar, subscription_expires_at, training_start_date, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
    [id, tid, groupId || null, name, phone, hash, weight || null, belt || null, birthDate || null, avatar || null, subscriptionExpiresAt || null, trainingStartDate || null]
  )
  const { rows: [s] } = await pool.query('SELECT * FROM students WHERE id = $1', [id])
  res.json(mapStudent(s))
})

router.put('/students/:id', authMiddleware, async (req, res) => {
  const { name, phone, weight, belt, birthDate, avatar, subscriptionExpiresAt, status, groupId, password, trainingStartDate } = req.body
  const sets = []
  const vals = []
  let i = 1
  const add = (col, val) => { if (val !== undefined) { sets.push(`${col} = $${i++}`); vals.push(val) } }
  add('name', name); add('phone', phone); add('weight', weight); add('belt', belt)
  add('birth_date', birthDate); add('avatar', avatar); add('subscription_expires_at', subscriptionExpiresAt)
  add('status', status); add('group_id', groupId); add('training_start_date', trainingStartDate)
  if (password) { add('password_hash', bcrypt.hashSync(password, 10)) }
  if (sets.length === 0) return res.json({ ok: true })
  vals.push(req.params.id)
  await pool.query(`UPDATE students SET ${sets.join(', ')} WHERE id = $${i}`, vals)
  const { rows: [s] } = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id])
  res.json(mapStudent(s))
})

router.delete('/students/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM transactions WHERE student_id = $1', [req.params.id])
  await pool.query('DELETE FROM tournament_registrations WHERE student_id = $1', [req.params.id])
  await pool.query('DELETE FROM students WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// --- Groups ---
router.post('/groups', authMiddleware, async (req, res) => {
  const { name, schedule, subscriptionCost, trainerId } = req.body
  const id = genId()
  await pool.query('INSERT INTO groups (id, trainer_id, name, schedule, subscription_cost) VALUES ($1,$2,$3,$4,$5)',
    [id, trainerId || req.user.userId, name, schedule || '', subscriptionCost || 0])
  res.json({ id, trainerId: trainerId || req.user.userId, name, schedule: schedule || '', subscriptionCost: subscriptionCost || 0 })
})

router.put('/groups/:id', authMiddleware, async (req, res) => {
  const { name, schedule, subscriptionCost, attendanceEnabled } = req.body
  const sets = ['name = COALESCE($1, name)', 'schedule = COALESCE($2, schedule)', 'subscription_cost = COALESCE($3, subscription_cost)']
  const vals = [name, schedule, subscriptionCost]
  if (attendanceEnabled !== undefined) {
    sets.push(`attendance_enabled = $${vals.length + 1}`)
    vals.push(attendanceEnabled)
  }
  vals.push(req.params.id)
  await pool.query(`UPDATE groups SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals)
  res.json({ ok: true })
})

router.delete('/groups/:id', authMiddleware, async (req, res) => {
  await pool.query('UPDATE students SET group_id = NULL WHERE group_id = $1', [req.params.id])
  await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// --- Transactions ---
router.post('/transactions', authMiddleware, async (req, res) => {
  const { type, amount, category, description, studentId, trainerId } = req.body
  const id = genId()
  const tid = trainerId || req.user.userId
  await pool.query('INSERT INTO transactions (id, trainer_id, type, amount, category, description, student_id, date) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())',
    [id, tid, type, amount, category || '', description || '', studentId || null])
  res.json({ id, trainerId: tid, type, amount, category, description, studentId, date: new Date().toISOString() })
})

router.put('/transactions/:id', authMiddleware, async (req, res) => {
  const { type, amount, category, description } = req.body
  await pool.query('UPDATE transactions SET type=COALESCE($1,type), amount=COALESCE($2,amount), category=COALESCE($3,category), description=COALESCE($4,description) WHERE id=$5',
    [type, amount, category, description, req.params.id])
  res.json({ ok: true })
})

router.delete('/transactions/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// --- Tournaments ---
router.post('/tournaments', authMiddleware, async (req, res) => {
  const { title, date, location, description, coverImage } = req.body
  const id = genId()
  await pool.query('INSERT INTO tournaments (id, title, date, location, description, cover_image, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, title, date, location || '', description || '', coverImage || null, req.user.userId])
  res.json({ id, title, date, location, description, coverImage, createdBy: req.user.userId })
})

router.put('/tournaments/:id', authMiddleware, async (req, res) => {
  const { title, date, location, description, coverImage } = req.body
  await pool.query('UPDATE tournaments SET title=COALESCE($1,title), date=COALESCE($2,date), location=COALESCE($3,location), description=COALESCE($4,description), cover_image=COALESCE($5,cover_image) WHERE id=$6',
    [title, date, location, description, coverImage, req.params.id])
  res.json({ ok: true })
})

router.delete('/tournaments/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM tournament_registrations WHERE tournament_id = $1', [req.params.id])
  await pool.query('DELETE FROM tournaments WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// --- Tournament Registrations ---
router.post('/tournament-registrations', authMiddleware, async (req, res) => {
  const { tournamentId, studentId } = req.body
  await pool.query('INSERT INTO tournament_registrations (tournament_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [tournamentId, studentId])
  res.json({ ok: true })
})

router.delete('/tournament-registrations', authMiddleware, async (req, res) => {
  const { tournamentId, studentId } = req.body
  await pool.query('DELETE FROM tournament_registrations WHERE tournament_id = $1 AND student_id = $2',
    [tournamentId, studentId])
  res.json({ ok: true })
})

// --- Attendance ---
router.post('/attendance', authMiddleware, async (req, res) => {
  const { groupId, studentId, date, present } = req.body
  const id = genId()
  await pool.query(
    `INSERT INTO attendance (id, group_id, student_id, date, present)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (group_id, student_id, date)
     DO UPDATE SET present = $5`,
    [id, groupId, studentId, date, present !== false]
  )
  res.json({ id, groupId, studentId, date, present: present !== false })
})

router.post('/attendance/bulk', authMiddleware, async (req, res) => {
  const { groupId, date, records } = req.body
  // records: [{ studentId, present }]
  for (const r of records) {
    const id = genId()
    await pool.query(
      `INSERT INTO attendance (id, group_id, student_id, date, present)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (group_id, student_id, date)
       DO UPDATE SET present = $5`,
      [id, groupId, r.studentId, date, r.present !== false]
    )
  }
  res.json({ ok: true })
})

router.delete('/attendance', authMiddleware, async (req, res) => {
  const { groupId, studentId, date } = req.body
  await pool.query('DELETE FROM attendance WHERE group_id = $1 AND student_id = $2 AND date = $3',
    [groupId, studentId, date])
  res.json({ ok: true })
})

// --- News ---
router.post('/news', authMiddleware, async (req, res) => {
  const { title, content, groupId, trainerId } = req.body
  const id = genId()
  const tid = trainerId || req.user.userId
  await pool.query('INSERT INTO news (id, trainer_id, group_id, title, content, date) VALUES ($1,$2,$3,$4,$5,NOW())',
    [id, tid, groupId || null, title, content || ''])
  res.json({ id, trainerId: tid, groupId, title, content, date: new Date().toISOString() })
})

router.delete('/news/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM news WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// --- Trainers (admin only) ---
router.post('/trainers', authMiddleware, async (req, res) => {
  const { name, phone, password, clubName, avatar, sportType, city } = req.body
  const id = genId()
  const hash = bcrypt.hashSync(password || 'trainer123', 10)
  await pool.query('INSERT INTO users (id, name, phone, password_hash, role, club_name, avatar, sport_type, city) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, name, phone, hash, 'trainer', clubName || '', avatar || null, sportType || null, city || null])
  res.json({ id, name, phone, role: 'trainer', clubName, avatar, sportType, city })
})

router.put('/trainers/:id', authMiddleware, async (req, res) => {
  const { name, phone, clubName, avatar, sportType, city } = req.body
  await pool.query('UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), club_name=COALESCE($3,club_name), avatar=COALESCE($4,avatar), sport_type=COALESCE($5,sport_type), city=COALESCE($6,city) WHERE id=$7',
    [name, phone, clubName, avatar, sportType, city, req.params.id])
  res.json({ ok: true })
})

router.delete('/trainers/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM news WHERE trainer_id = $1', [req.params.id])
  await pool.query('DELETE FROM transactions WHERE trainer_id = $1', [req.params.id])
  const { rows: students } = await pool.query('SELECT id FROM students WHERE trainer_id = $1', [req.params.id])
  for (const s of students) {
    await pool.query('DELETE FROM tournament_registrations WHERE student_id = $1', [s.id])
  }
  await pool.query('DELETE FROM students WHERE trainer_id = $1', [req.params.id])
  await pool.query('DELETE FROM groups WHERE trainer_id = $1', [req.params.id])
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// --- Author Info ---
router.put('/author', authMiddleware, async (req, res) => {
  const { name, instagram, website, description, phone } = req.body
  await pool.query(
    `INSERT INTO author_info (id, name, instagram, website, description, phone) VALUES (1,$1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET name=$1, instagram=$2, website=$3, description=$4, phone=$5`,
    [name, instagram, website, description, phone])
  res.json({ ok: true })
})

// --- Internal Tournaments (trainer brackets) ---
router.post('/internal-tournaments', authMiddleware, async (req, res) => {
  const { title, date, brackets } = req.body
  const id = genId()
  await pool.query('INSERT INTO internal_tournaments (id, trainer_id, title, date, brackets) VALUES ($1,$2,$3,$4,$5)',
    [id, req.user.userId, title, date || null, JSON.stringify(brackets || {})])
  const { rows: [t] } = await pool.query('SELECT * FROM internal_tournaments WHERE id = $1', [id])
  res.json(mapInternalTournament(t))
})

router.put('/internal-tournaments/:id', authMiddleware, async (req, res) => {
  const { title, date, status, brackets } = req.body
  const sets = []
  const vals = []
  let i = 1
  if (title !== undefined) { sets.push(`title = $${i++}`); vals.push(title) }
  if (date !== undefined) { sets.push(`date = $${i++}`); vals.push(date) }
  if (status !== undefined) { sets.push(`status = $${i++}`); vals.push(status) }
  if (brackets !== undefined) { sets.push(`brackets = $${i++}`); vals.push(JSON.stringify(brackets)) }
  if (sets.length === 0) return res.json({ ok: true })
  vals.push(req.params.id)
  await pool.query(`UPDATE internal_tournaments SET ${sets.join(', ')} WHERE id = $${i}`, vals)
  const { rows: [t] } = await pool.query('SELECT * FROM internal_tournaments WHERE id = $1', [req.params.id])
  res.json(mapInternalTournament(t))
})

router.delete('/internal-tournaments/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM internal_tournaments WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

export default router
