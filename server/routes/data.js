import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { authMiddleware } from '../auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { encrypt, decrypt } from '../middleware/crypto.js'
import crypto from 'crypto'

const router = Router()
const genId = () => Date.now().toString(36) + crypto.randomBytes(4).toString('hex')

function mapUser(u, includeSecrets = false) {
  const base = { id: u.id, name: u.name, phone: u.phone, role: u.role, avatar: u.avatar, clubName: u.club_name, sportType: u.sport_type, sportTypes: u.sport_types || [], city: u.city, isDemo: !!u.is_demo, materialCategories: u.material_categories || [], clubId: u.club_id || null, isHeadTrainer: !!u.is_head_trainer }
  if (includeSecrets) base.plainPassword = decrypt(u.plain_password || '')
  return base
}
function mapClub(c) {
  return { id: c.id, name: c.name, city: c.city || '', sportTypes: c.sport_types || [], headTrainerId: c.head_trainer_id || null, createdAt: c.created_at }
}
function mapInternalTournament(t) {
  return { id: t.id, trainerId: t.trainer_id, title: t.title, date: t.date, status: t.status, brackets: t.brackets, sportType: t.sport_type || null, coverImage: t.cover_image || null, createdAt: t.created_at }
}
function mapStudent(s, includeSecrets = false) {
  const base = {
    id: s.id, trainerId: s.trainer_id, groupId: s.group_id,
    name: s.name, phone: s.phone,
    weight: s.weight ? parseFloat(s.weight) : null,
    belt: s.belt, birthDate: s.birth_date, avatar: s.avatar,
    subscriptionExpiresAt: s.subscription_expires_at, status: s.status,
    trainingStartDate: s.training_start_date,
    createdAt: s.created_at, isDemo: !!s.is_demo,
  }
  if (includeSecrets) base.plainPassword = decrypt(s.plain_password || '')
  return base
}
function mapGroup(g) {
  return { id: g.id, trainerId: g.trainer_id, name: g.name, schedule: g.schedule, subscriptionCost: g.subscription_cost, attendanceEnabled: !!g.attendance_enabled, sportType: g.sport_type || null, pinnedMaterialId: g.pinned_material_id || null }
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
function mapMaterial(m) {
  return { id: m.id, trainerId: m.trainer_id, title: m.title, description: m.description, videoUrl: m.video_url, groupIds: m.group_ids || [], category: m.category || 'other', customThumb: m.custom_thumb || '', createdAt: m.created_at }
}
function mapAuthor(a) {
  return a ? { name: a.name, instagram: a.instagram, website: a.website, description: a.description, phone: a.phone } : {}
}

// GET all data (role-aware)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { userId, role, studentId } = req.user
  const queries = [
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
    pool.query('SELECT * FROM materials ORDER BY created_at DESC'),
    pool.query('SELECT * FROM clubs ORDER BY created_at DESC'),
  ]
  if (role === 'superadmin') queries.push(pool.query("SELECT * FROM pending_registrations WHERE status = 'pending' ORDER BY created_at DESC"))
  const results = await Promise.all(queries)
  const [users, groups, students, transactions, tournaments, news, regs, author, intTournaments, attendance, materials, clubs] = results
  const pendingRegs = results[12] || { rows: [] }

  const isSuperadmin = role === 'superadmin'
  // Superadmin sees passwords + no demo data; demo users see only their demo data
  const filteredUsers = isSuperadmin ? users.rows.filter(u => !u.is_demo) : users.rows
  const filteredStudents = isSuperadmin ? students.rows.filter(s => !s.is_demo) : students.rows
  const demoTrainerIds = new Set(users.rows.filter(u => u.is_demo && u.role === 'trainer').map(u => u.id))
  const filteredGroups = isSuperadmin ? groups.rows.filter(g => !demoTrainerIds.has(g.trainer_id)) : groups.rows
  const filteredTx = isSuperadmin ? transactions.rows.filter(t => !demoTrainerIds.has(t.trainer_id)) : transactions.rows
  const filteredNews = isSuperadmin ? news.rows.filter(n => !demoTrainerIds.has(n.trainer_id)) : news.rows
  const filteredIntTournaments = isSuperadmin ? intTournaments.rows.filter(t => !demoTrainerIds.has(t.trainer_id)) : intTournaments.rows
  const filteredMaterials = isSuperadmin ? materials.rows.filter(m => !demoTrainerIds.has(m.trainer_id)) : materials.rows

  res.json({
    users: filteredUsers.map(u => mapUser(u, isSuperadmin)),
    groups: filteredGroups.map(mapGroup),
    students: filteredStudents.map(s => mapStudent(s, isSuperadmin)),
    transactions: filteredTx.map(mapTx),
    tournaments: tournaments.rows.map(mapTournament),
    news: filteredNews.map(mapNews),
    tournamentRegistrations: regs.rows.map(r => ({ tournamentId: r.tournament_id, studentId: r.student_id })),
    authorInfo: mapAuthor(author.rows[0]),
    internalTournaments: filteredIntTournaments.map(mapInternalTournament),
    attendance: attendance.rows.map(mapAttendance),
    materials: filteredMaterials.map(mapMaterial),
    clubs: clubs.rows.map(mapClub),
    ...(isSuperadmin ? {
      pendingRegistrations: pendingRegs.rows.map(r => ({
        id: r.id, name: r.name, phone: r.phone, clubName: r.club_name,
        sportType: r.sport_type, city: r.city, plainPassword: decrypt(r.plain_password || ''),
        status: r.status, createdAt: r.created_at,
      }))
    } : {}),
  })
}))

// --- Students ---
router.post('/students', authMiddleware, asyncHandler(async (req, res) => {
  const { name, phone, weight, belt, birthDate, groupId, password, avatar, subscriptionExpiresAt, trainerId, trainingStartDate } = req.body
  const id = genId()
  const pw = password || 'student123'
  const hash = bcrypt.hashSync(pw, 10)
  const tid = trainerId || req.user.userId
  await pool.query(
    `INSERT INTO students (id, trainer_id, group_id, name, phone, password_hash, weight, belt, birth_date, avatar, subscription_expires_at, training_start_date, plain_password, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())`,
    [id, tid, groupId || null, name, phone, hash, weight || null, belt || null, birthDate || null, avatar || null, subscriptionExpiresAt || null, trainingStartDate || null, encrypt(pw)]
  )
  const { rows: [s] } = await pool.query('SELECT * FROM students WHERE id = $1', [id])
  res.json(mapStudent(s))
}))

router.put('/students/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { name, phone, weight, belt, birthDate, avatar, subscriptionExpiresAt, status, groupId, password, trainingStartDate } = req.body
  const sets = []
  const vals = []
  let i = 1
  const add = (col, val) => { if (val !== undefined) { sets.push(`${col} = $${i++}`); vals.push(val) } }
  add('name', name); add('phone', phone); add('weight', weight); add('belt', belt)
  add('birth_date', birthDate); add('avatar', avatar); add('subscription_expires_at', subscriptionExpiresAt)
  add('status', status); add('group_id', groupId); add('training_start_date', trainingStartDate)
  if (password) { add('password_hash', bcrypt.hashSync(password, 10)); add('plain_password', encrypt(password)) }
  if (sets.length === 0) return res.json({ ok: true })
  vals.push(req.params.id)
  await pool.query(`UPDATE students SET ${sets.join(', ')} WHERE id = $${i}`, vals)
  const { rows: [s] } = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id])
  res.json(mapStudent(s))
}))

router.delete('/students/:id', authMiddleware, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM transactions WHERE student_id = $1', [req.params.id])
  await pool.query('DELETE FROM tournament_registrations WHERE student_id = $1', [req.params.id])
  await pool.query('DELETE FROM students WHERE id = $1', [req.params.id])
  res.json({ ok: true })
}))

// --- Groups ---
router.post('/groups', authMiddleware, asyncHandler(async (req, res) => {
  const { name, schedule, subscriptionCost, trainerId, sportType } = req.body
  const id = genId()
  await pool.query('INSERT INTO groups (id, trainer_id, name, schedule, subscription_cost, sport_type) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, trainerId || req.user.userId, name, schedule || '', subscriptionCost || 0, sportType || null])
  res.json({ id, trainerId: trainerId || req.user.userId, name, schedule: schedule || '', subscriptionCost: subscriptionCost || 0, sportType: sportType || null })
}))

router.put('/groups/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { name, schedule, subscriptionCost, attendanceEnabled, sportType, pinnedMaterialId } = req.body
  const sets = ['name = COALESCE($1, name)', 'schedule = COALESCE($2, schedule)', 'subscription_cost = COALESCE($3, subscription_cost)']
  const vals = [name, schedule, subscriptionCost]
  if (attendanceEnabled !== undefined) {
    sets.push(`attendance_enabled = $${vals.length + 1}`)
    vals.push(attendanceEnabled)
  }
  if (sportType !== undefined) {
    sets.push(`sport_type = $${vals.length + 1}`)
    vals.push(sportType)
  }
  if (pinnedMaterialId !== undefined) {
    sets.push(`pinned_material_id = $${vals.length + 1}`)
    vals.push(pinnedMaterialId)
  }
  vals.push(req.params.id)
  await pool.query(`UPDATE groups SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals)
  res.json({ ok: true })
}))

router.delete('/groups/:id', authMiddleware, asyncHandler(async (req, res) => {
  await pool.query('UPDATE students SET group_id = NULL WHERE group_id = $1', [req.params.id])
  await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id])
  res.json({ ok: true })
}))

// --- Transactions ---
router.post('/transactions', authMiddleware, asyncHandler(async (req, res) => {
  const { type, amount, category, description, studentId, trainerId } = req.body
  const id = genId()
  const tid = trainerId || req.user.userId
  await pool.query('INSERT INTO transactions (id, trainer_id, type, amount, category, description, student_id, date) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())',
    [id, tid, type, amount, category || '', description || '', studentId || null])
  res.json({ id, trainerId: tid, type, amount, category, description, studentId, date: new Date().toISOString() })
}))

router.put('/transactions/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { type, amount, category, description } = req.body
  await pool.query('UPDATE transactions SET type=COALESCE($1,type), amount=COALESCE($2,amount), category=COALESCE($3,category), description=COALESCE($4,description) WHERE id=$5',
    [type, amount, category, description, req.params.id])
  res.json({ ok: true })
}))

router.delete('/transactions/:id', authMiddleware, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id])
  res.json({ ok: true })
}))

// --- Tournaments ---
router.post('/tournaments', authMiddleware, asyncHandler(async (req, res) => {
  const { title, date, location, description, coverImage } = req.body
  const id = genId()
  await pool.query('INSERT INTO tournaments (id, title, date, location, description, cover_image, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, title, date, location || '', description || '', coverImage || null, req.user.userId])
  res.json({ id, title, date, location, description, coverImage, createdBy: req.user.userId })
}))

router.put('/tournaments/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { title, date, location, description, coverImage } = req.body
  await pool.query('UPDATE tournaments SET title=COALESCE($1,title), date=COALESCE($2,date), location=COALESCE($3,location), description=COALESCE($4,description), cover_image=COALESCE($5,cover_image) WHERE id=$6',
    [title, date, location, description, coverImage, req.params.id])
  res.json({ ok: true })
}))

router.delete('/tournaments/:id', authMiddleware, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM tournament_registrations WHERE tournament_id = $1', [req.params.id])
  await pool.query('DELETE FROM tournaments WHERE id = $1', [req.params.id])
  res.json({ ok: true })
}))

// --- Tournament Registrations ---
router.post('/tournament-registrations', authMiddleware, asyncHandler(async (req, res) => {
  const { tournamentId, studentId } = req.body
  await pool.query('INSERT INTO tournament_registrations (tournament_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [tournamentId, studentId])
  res.json({ ok: true })
}))

router.delete('/tournament-registrations', authMiddleware, asyncHandler(async (req, res) => {
  const { tournamentId, studentId } = req.body
  await pool.query('DELETE FROM tournament_registrations WHERE tournament_id = $1 AND student_id = $2',
    [tournamentId, studentId])
  res.json({ ok: true })
}))

// --- Attendance ---
router.post('/attendance', authMiddleware, asyncHandler(async (req, res) => {
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
}))

router.post('/attendance/bulk', authMiddleware, asyncHandler(async (req, res) => {
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
}))

router.delete('/attendance', authMiddleware, asyncHandler(async (req, res) => {
  const { groupId, studentId, date } = req.body
  await pool.query('DELETE FROM attendance WHERE group_id = $1 AND student_id = $2 AND date = $3',
    [groupId, studentId, date])
  res.json({ ok: true })
}))

// --- News ---
router.post('/news', authMiddleware, asyncHandler(async (req, res) => {
  const { title, content, groupId, trainerId } = req.body
  const id = genId()
  const tid = trainerId || req.user.userId
  await pool.query('INSERT INTO news (id, trainer_id, group_id, title, content, date) VALUES ($1,$2,$3,$4,$5,NOW())',
    [id, tid, groupId || null, title, content || ''])
  res.json({ id, trainerId: tid, groupId, title, content, date: new Date().toISOString() })
}))

router.delete('/news/:id', authMiddleware, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM news WHERE id = $1', [req.params.id])
  res.json({ ok: true })
}))

// --- Trainers (admin only) ---
router.post('/trainers', authMiddleware, asyncHandler(async (req, res) => {
  const { name, phone, password, clubName, avatar, sportType, sportTypes, city } = req.body
  const id = genId()
  const pw = password || 'trainer123'
  const hash = bcrypt.hashSync(pw, 10)
  // Support both sportType (single) and sportTypes (array)
  const sTypes = sportTypes || (sportType ? [sportType] : [])
  const sType = sportType || (sTypes[0] || null)
  await pool.query('INSERT INTO users (id, name, phone, password_hash, role, club_name, avatar, sport_type, sport_types, city, plain_password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [id, name, phone, hash, 'trainer', clubName || '', avatar || null, sType, JSON.stringify(sTypes), city || null, encrypt(pw)])
  res.json({ id, name, phone, role: 'trainer', clubName, avatar, sportType: sType, sportTypes: sTypes, city, plainPassword: pw })
}))

router.put('/trainers/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { name, phone, clubName, avatar, sportType, sportTypes, city, password, materialCategories } = req.body
  const sets = ['name=COALESCE($1,name)', 'phone=COALESCE($2,phone)', 'club_name=COALESCE($3,club_name)', 'avatar=COALESCE($4,avatar)', 'sport_type=COALESCE($5,sport_type)', 'city=COALESCE($6,city)']
  const vals = [name, phone, clubName, avatar, sportType, city]
  if (sportTypes !== undefined) {
    sets.push(`sport_types = $${vals.length + 1}`)
    vals.push(JSON.stringify(sportTypes))
  }
  if (materialCategories !== undefined) {
    sets.push(`material_categories = $${vals.length + 1}`)
    vals.push(JSON.stringify(materialCategories))
  }
  if (password) {
    sets.push(`password_hash = $${vals.length + 1}`, `plain_password = $${vals.length + 2}`)
    vals.push(bcrypt.hashSync(password, 10), encrypt(password))
  }
  vals.push(req.params.id)
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals)
  res.json({ ok: true })
}))

router.delete('/trainers/:id', authMiddleware, asyncHandler(async (req, res) => {
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
}))

// --- Author Info ---
router.put('/author', authMiddleware, asyncHandler(async (req, res) => {
  const { name, instagram, website, description, phone } = req.body
  await pool.query(
    `INSERT INTO author_info (id, name, instagram, website, description, phone) VALUES (1,$1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET name=$1, instagram=$2, website=$3, description=$4, phone=$5`,
    [name, instagram, website, description, phone])
  res.json({ ok: true })
}))

// --- Internal Tournaments (trainer brackets) ---
router.post('/internal-tournaments', authMiddleware, asyncHandler(async (req, res) => {
  const { title, date, brackets, sportType, coverImage } = req.body
  const id = genId()
  await pool.query('INSERT INTO internal_tournaments (id, trainer_id, title, date, brackets, sport_type, cover_image) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, req.user.userId, title, date || null, JSON.stringify(brackets || {}), sportType || null, coverImage || null])
  const { rows: [t] } = await pool.query('SELECT * FROM internal_tournaments WHERE id = $1', [id])
  res.json(mapInternalTournament(t))
}))

router.put('/internal-tournaments/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { title, date, status, brackets, sportType, coverImage } = req.body
  const sets = []
  const vals = []
  let i = 1
  if (title !== undefined) { sets.push(`title = $${i++}`); vals.push(title) }
  if (date !== undefined) { sets.push(`date = $${i++}`); vals.push(date) }
  if (status !== undefined) { sets.push(`status = $${i++}`); vals.push(status) }
  if (brackets !== undefined) { sets.push(`brackets = $${i++}`); vals.push(JSON.stringify(brackets)) }
  if (sportType !== undefined) { sets.push(`sport_type = $${i++}`); vals.push(sportType) }
  if (coverImage !== undefined) { sets.push(`cover_image = $${i++}`); vals.push(coverImage) }
  if (sets.length === 0) return res.json({ ok: true })
  vals.push(req.params.id)
  await pool.query(`UPDATE internal_tournaments SET ${sets.join(', ')} WHERE id = $${i}`, vals)
  const { rows: [t] } = await pool.query('SELECT * FROM internal_tournaments WHERE id = $1', [req.params.id])
  res.json(mapInternalTournament(t))
}))

router.delete('/internal-tournaments/:id', authMiddleware, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM internal_tournaments WHERE id = $1', [req.params.id])
  res.json({ ok: true })
}))

// --- Materials ---
router.post('/materials', authMiddleware, asyncHandler(async (req, res) => {
  const { title, description, videoUrl, groupIds, trainerId, category, customThumb } = req.body
  const id = genId()
  const tid = trainerId || req.user.userId
  await pool.query(
    'INSERT INTO materials (id, trainer_id, title, description, video_url, group_ids, category, custom_thumb, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())',
    [id, tid, title, description || '', videoUrl, JSON.stringify(groupIds || []), category || 'other', customThumb || null]
  )
  res.json({ id, trainerId: tid, title, description: description || '', videoUrl, groupIds: groupIds || [], category: category || 'other', customThumb: customThumb || '', createdAt: new Date().toISOString() })
}))

router.put('/materials/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { title, description, videoUrl, groupIds, category, customThumb } = req.body
  const sets = []
  const vals = []
  let i = 1
  if (title !== undefined) { sets.push(`title = $${i++}`); vals.push(title) }
  if (description !== undefined) { sets.push(`description = $${i++}`); vals.push(description) }
  if (videoUrl !== undefined) { sets.push(`video_url = $${i++}`); vals.push(videoUrl) }
  if (groupIds !== undefined) { sets.push(`group_ids = $${i++}`); vals.push(JSON.stringify(groupIds)) }
  if (category !== undefined) { sets.push(`category = $${i++}`); vals.push(category) }
  if (customThumb !== undefined) { sets.push(`custom_thumb = $${i++}`); vals.push(customThumb || null) }
  if (sets.length === 0) return res.json({ ok: true })
  vals.push(req.params.id)
  await pool.query(`UPDATE materials SET ${sets.join(', ')} WHERE id = $${i}`, vals)
  res.json({ ok: true })
}))

router.delete('/materials/:id', authMiddleware, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM materials WHERE id = $1', [req.params.id])
  res.json({ ok: true })
}))

// --- Clubs ---
router.post('/clubs', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
  const { name, city, sportTypes, headTrainerId } = req.body
  const id = genId()
  await pool.query('INSERT INTO clubs (id, name, city, sport_types, head_trainer_id) VALUES ($1,$2,$3,$4,$5)',
    [id, name, city || '', JSON.stringify(sportTypes || []), headTrainerId || null])
  // If head trainer, update their club_id and is_head_trainer
  if (headTrainerId) {
    await pool.query('UPDATE users SET club_id = $1, is_head_trainer = true WHERE id = $2', [id, headTrainerId])
  }
  res.json({ id, name, city, sportTypes: sportTypes || [], headTrainerId, createdAt: new Date().toISOString() })
}))

router.put('/clubs/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { name, city, sportTypes, headTrainerId } = req.body
  const sets = []
  const vals = []
  let i = 1
  if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name) }
  if (city !== undefined) { sets.push(`city = $${i++}`); vals.push(city) }
  if (sportTypes !== undefined) { sets.push(`sport_types = $${i++}`); vals.push(JSON.stringify(sportTypes)) }
  if (headTrainerId !== undefined) {
    sets.push(`head_trainer_id = $${i++}`); vals.push(headTrainerId)
    // Update old head trainer
    await pool.query('UPDATE users SET is_head_trainer = false WHERE club_id = $1 AND is_head_trainer = true', [req.params.id])
    if (headTrainerId) {
      await pool.query('UPDATE users SET club_id = $1, is_head_trainer = true WHERE id = $2', [req.params.id, headTrainerId])
    }
  }
  if (sets.length === 0) return res.json({ ok: true })
  vals.push(req.params.id)
  await pool.query(`UPDATE clubs SET ${sets.join(', ')} WHERE id = $${i}`, vals)
  res.json({ ok: true })
}))

router.delete('/clubs/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
  await pool.query('UPDATE users SET club_id = NULL, is_head_trainer = false WHERE club_id = $1', [req.params.id])
  await pool.query('DELETE FROM clubs WHERE id = $1', [req.params.id])
  res.json({ ok: true })
}))

// Assign trainer to club
router.post('/clubs/:id/trainers', authMiddleware, asyncHandler(async (req, res) => {
  const { trainerId } = req.body
  const { rows: [club] } = await pool.query('SELECT name FROM clubs WHERE id = $1', [req.params.id])
  await pool.query('UPDATE users SET club_id = $1, club_name = $2 WHERE id = $3', [req.params.id, club?.name || '', trainerId])
  res.json({ ok: true })
}))

// Remove trainer from club
router.delete('/clubs/:id/trainers/:trainerId', authMiddleware, asyncHandler(async (req, res) => {
  await pool.query('UPDATE users SET club_id = NULL, is_head_trainer = false, club_name = NULL WHERE id = $1 AND club_id = $2',
    [req.params.trainerId, req.params.id])
  res.json({ ok: true })
}))

// --- Pending Registrations (superadmin) ---
router.get('/registrations', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
  const { rows } = await pool.query("SELECT * FROM pending_registrations ORDER BY created_at DESC")
  res.json(rows.map(r => ({
    id: r.id, name: r.name, phone: r.phone, clubName: r.club_name,
    sportType: r.sport_type, city: r.city, plainPassword: decrypt(r.plain_password || ''),
    status: r.status, createdAt: r.created_at,
  })))
}))

router.post('/registrations/:id/approve', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
  const { rows: [reg] } = await pool.query('SELECT * FROM pending_registrations WHERE id = $1', [req.params.id])
  if (!reg) return res.status(404).json({ error: 'Заявка не найдена' })
  if (reg.status !== 'pending') return res.status(400).json({ error: 'Заявка уже обработана' })

  // Create trainer
  const id = genId()
  await pool.query(
    'INSERT INTO users (id, name, phone, password_hash, role, club_name, sport_type, city, plain_password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, reg.name, reg.phone, reg.password_hash, 'trainer', reg.club_name || '', reg.sport_type, reg.city, reg.plain_password]
  )

  // Mark as approved
  await pool.query("UPDATE pending_registrations SET status = 'approved' WHERE id = $1", [req.params.id])
  res.json({ ok: true, trainerId: id })
}))

router.post('/registrations/:id/reject', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
  await pool.query("UPDATE pending_registrations SET status = 'rejected' WHERE id = $1", [req.params.id])
  res.json({ ok: true })
}))

export default router
