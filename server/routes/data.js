import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { authMiddleware } from '../auth.js'
import crypto from 'crypto'

const router = Router()
const genId = () => Date.now().toString(36) + crypto.randomBytes(4).toString('hex')

// --- Ownership verification helpers ---

async function verifyTrainerOwnsStudent(userId, role, studentId) {
  if (role === 'superadmin') return true
  // Parents are authenticated with userId = trainer's id, so trainer_id check works for them
  const { rows } = await pool.query('SELECT trainer_id FROM students WHERE id = $1', [studentId])
  return rows.length > 0 && rows[0].trainer_id === userId
}

async function verifyTrainerOwnsGroup(userId, role, groupId) {
  if (role === 'superadmin') return true
  const { rows } = await pool.query('SELECT trainer_id FROM groups WHERE id = $1', [groupId])
  return rows.length > 0 && rows[0].trainer_id === userId
}

async function verifyTrainerOwnsTransaction(userId, role, txId) {
  if (role === 'superadmin') return true
  const { rows } = await pool.query('SELECT trainer_id FROM transactions WHERE id = $1', [txId])
  return rows.length > 0 && rows[0].trainer_id === userId
}

async function verifyTrainerOwnsIntTournament(userId, role, tId) {
  if (role === 'superadmin') return true
  const { rows } = await pool.query('SELECT trainer_id FROM internal_tournaments WHERE id = $1', [tId])
  return rows.length > 0 && rows[0].trainer_id === userId
}

async function verifyTrainerOwnsMaterial(userId, role, mId) {
  if (role === 'superadmin') return true
  const { rows } = await pool.query('SELECT trainer_id FROM materials WHERE id = $1', [mId])
  return rows.length > 0 && rows[0].trainer_id === userId
}

// --- Mapping functions ---

function mapUser(u, includeSecrets = false) {
  const base = { id: u.id, name: u.name, phone: u.phone, role: u.role, avatar: u.avatar, clubName: u.club_name, sportType: u.sport_type, sportTypes: u.sport_types || [], city: u.city, isDemo: !!u.is_demo, materialCategories: u.material_categories || [], clubId: u.club_id || null, isHeadTrainer: !!u.is_head_trainer, rank: u.rank || '', achievements: u.achievements || '' }
  if (includeSecrets) base.plainPassword = u.plain_password || ''
  return base
}
function mapClub(c) {
  return { id: c.id, name: c.name, city: c.city || '', sportTypes: c.sport_types || [], headTrainerId: c.head_trainer_id || null, createdAt: c.created_at, phone: c.phone || '', vk: c.vk || '', address: c.address || '', logo: c.logo || null }
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
    discount: s.discount || 0,
  }
  if (includeSecrets) base.plainPassword = s.plain_password || ''
  return base
}
function mapGroup(g) {
  return { id: g.id, trainerId: g.trainer_id, name: g.name, schedule: g.schedule, subscriptionCost: g.subscription_cost, attendanceEnabled: !!g.attendance_enabled, sportType: g.sport_type || null, pinnedMaterialId: g.pinned_material_id || null, scheduleDays: g.schedule_days || [], timeFrom: g.time_from || null, timeTo: g.time_to || null }
}
function mapBranch(b) {
  return { id: b.id, clubId: b.club_id, name: b.name, city: b.city || '', address: b.address || '', createdAt: b.created_at }
}
function mapAttendance(a) {
  return { id: a.id, groupId: a.group_id, studentId: a.student_id, date: a.date, present: a.present }
}
function mapTx(t) {
  return { id: t.id, trainerId: t.trainer_id, type: t.type, amount: t.amount, category: t.category, description: t.description, studentId: t.student_id, date: t.date }
}
function mapTournament(t) {
  return { id: t.id, title: t.title, coverImage: t.cover_image, date: t.date, location: t.location, city: t.city || '', description: t.description, createdBy: t.created_by, regulations: t.regulations || '', weightCategories: t.weight_categories || [], prizes: t.prizes || '', rules: t.rules || '', sportType: t.sport_type || null, status: t.status || 'upcoming', brackets: t.brackets || {}, matsCount: t.mats_count || 1, ageGroups: t.age_groups || [] }
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
router.get('/', authMiddleware, async (req, res) => {
  try {
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
      pool.query('SELECT * FROM parents ORDER BY created_at DESC'),
      pool.query('SELECT * FROM student_groups'),
      pool.query('SELECT * FROM branches ORDER BY created_at DESC'),
    ]
    if (role === 'superadmin') queries.push(pool.query("SELECT * FROM pending_registrations WHERE status = 'pending' ORDER BY created_at DESC"))
    const results = await Promise.all(queries)
    const [users, groups, students, transactions, tournaments, news, regs, author, intTournaments, attendance, materials, clubs, parents, studentGroups, branches] = results
    const pendingRegs = results[15] || { rows: [] }

    const isSuperadmin = role === 'superadmin'
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
      parents: parents.rows.map(p => ({
        id: p.id, studentId: p.student_id, name: p.name, phone: p.phone,
        relation: p.relation, plainPassword: isSuperadmin ? (p.plain_password || '') : undefined,
      })),
      studentGroups: studentGroups.rows.map(sg => ({ studentId: sg.student_id, groupId: sg.group_id })),
      branches: branches.rows.map(mapBranch),
      ...(isSuperadmin ? {
        pendingRegistrations: pendingRegs.rows.map(r => ({
          id: r.id, name: r.name, phone: r.phone, clubName: r.club_name,
          sportType: r.sport_type, city: r.city, plainPassword: r.plain_password,
          status: r.status, createdAt: r.created_at,
        }))
      } : {}),
    })
  } catch (err) {
    console.error('GET /api/data error:', err)
    res.status(500).json({ error: 'Ошибка загрузки данных' })
  }
})

// --- Students ---
router.post('/students', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role === 'student' || role === 'parent') return res.status(403).json({ error: 'Нет доступа' })

    const { name, phone, weight, belt, birthDate, groupId, groupIds, password, avatar, subscriptionExpiresAt, trainerId, trainingStartDate } = req.body
    if (!name || !phone) return res.status(400).json({ error: 'Укажите имя и телефон ученика' })

    const id = genId()
    const pw = password || 'student123'
    const hash = await bcrypt.hash(pw, 10)
    const tid = trainerId || userId
    const allGroupIds = groupIds && groupIds.length > 0 ? groupIds : (groupId ? [groupId] : [])
    const primaryGroupId = allGroupIds[0] || null

    await pool.query(
      `INSERT INTO students (id, trainer_id, group_id, name, phone, password_hash, weight, belt, birth_date, avatar, subscription_expires_at, training_start_date, plain_password, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())`,
      [id, tid, primaryGroupId, name, phone, hash, weight || null, belt || null, birthDate || null, avatar || null, subscriptionExpiresAt || null, trainingStartDate || null, pw]
    )
    // Insert into student_groups junction table
    for (const gid of allGroupIds) {
      await pool.query('INSERT INTO student_groups (student_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, gid])
    }
    const { rows: [s] } = await pool.query('SELECT * FROM students WHERE id = $1', [id])
    res.json(mapStudent(s))
  } catch (err) {
    console.error('POST /students error:', err)
    res.status(500).json({ error: 'Ошибка создания ученика' })
  }
})

router.put('/students/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsStudent(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    // Parents can only change status
    if (role === 'parent') {
      const { status } = req.body
      if (status !== undefined) {
        await pool.query('UPDATE students SET status = $1 WHERE id = $2', [status, req.params.id])
      }
      const { rows: [updated] } = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id])
      return res.json(updated ? mapStudent(updated) : { ok: true })
    }

    const { name, phone, weight, belt, birthDate, avatar, subscriptionExpiresAt, status, groupId, groupIds, password, trainingStartDate } = req.body
    const sets = []
    const vals = []
    let i = 1
    const add = (col, val) => { if (val !== undefined) { sets.push(`${col} = $${i++}`); vals.push(val) } }
    add('name', name); add('phone', phone); add('weight', weight); add('belt', belt)
    add('birth_date', birthDate); add('avatar', avatar); add('subscription_expires_at', subscriptionExpiresAt)
    add('status', status); add('training_start_date', trainingStartDate)
    if (req.body.discount !== undefined) { add('discount', req.body.discount) }
    if (groupIds !== undefined) {
      sets.push(`group_id = $${i++}`)
      vals.push(groupIds.length > 0 ? groupIds[0] : null)
      await pool.query('DELETE FROM student_groups WHERE student_id = $1', [req.params.id])
      for (const gid of groupIds) {
        await pool.query('INSERT INTO student_groups (student_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, gid])
      }
    } else if (groupId !== undefined) {
      add('group_id', groupId)
      await pool.query('DELETE FROM student_groups WHERE student_id = $1', [req.params.id])
      if (groupId) {
        await pool.query('INSERT INTO student_groups (student_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, groupId])
      }
    }
    if (password) { add('password_hash', await bcrypt.hash(password, 10)); add('plain_password', password) }
    if (sets.length === 0) return res.json({ ok: true })
    vals.push(req.params.id)
    await pool.query(`UPDATE students SET ${sets.join(', ')} WHERE id = $${i}`, vals)
    const { rows: [s] } = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id])
    res.json(mapStudent(s))
  } catch (err) {
    console.error('PUT /students error:', err)
    res.status(500).json({ error: 'Ошибка обновления ученика' })
  }
})

router.delete('/students/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsStudent(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    await pool.query('DELETE FROM student_groups WHERE student_id = $1', [req.params.id])
    await pool.query('DELETE FROM transactions WHERE student_id = $1', [req.params.id])
    await pool.query('DELETE FROM tournament_registrations WHERE student_id = $1', [req.params.id])
    await pool.query('DELETE FROM parents WHERE student_id = $1', [req.params.id])
    await pool.query('DELETE FROM attendance WHERE student_id = $1', [req.params.id])
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /students error:', err)
    res.status(500).json({ error: 'Ошибка удаления ученика' })
  }
})

// --- Groups ---
router.post('/groups', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role === 'student' || role === 'parent') return res.status(403).json({ error: 'Нет доступа' })

    const { name, schedule, subscriptionCost, trainerId, sportType, scheduleDays, timeFrom, timeTo } = req.body
    if (!name) return res.status(400).json({ error: 'Укажите название группы' })

    const id = genId()
    const tid = trainerId || userId
    await pool.query('INSERT INTO groups (id, trainer_id, name, schedule, subscription_cost, sport_type, schedule_days, time_from, time_to) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, tid, name, schedule || '', subscriptionCost || 0, sportType || null, JSON.stringify(scheduleDays || []), timeFrom || null, timeTo || null])
    res.json({ id, trainerId: tid, name, schedule: schedule || '', subscriptionCost: subscriptionCost || 0, sportType: sportType || null, scheduleDays: scheduleDays || [], timeFrom: timeFrom || null, timeTo: timeTo || null })
  } catch (err) {
    console.error('POST /groups error:', err)
    res.status(500).json({ error: 'Ошибка создания группы' })
  }
})

router.put('/groups/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsGroup(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    const { name, schedule, subscriptionCost, attendanceEnabled, sportType, pinnedMaterialId, scheduleDays, timeFrom, timeTo } = req.body
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
    if (scheduleDays !== undefined) {
      sets.push(`schedule_days = $${vals.length + 1}`)
      vals.push(JSON.stringify(scheduleDays))
    }
    if (timeFrom !== undefined) {
      sets.push(`time_from = $${vals.length + 1}`)
      vals.push(timeFrom)
    }
    if (timeTo !== undefined) {
      sets.push(`time_to = $${vals.length + 1}`)
      vals.push(timeTo)
    }
    vals.push(req.params.id)
    await pool.query(`UPDATE groups SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals)
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /groups error:', err)
    res.status(500).json({ error: 'Ошибка обновления группы' })
  }
})

router.delete('/groups/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsGroup(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    await pool.query('DELETE FROM student_groups WHERE group_id = $1', [req.params.id])
    await pool.query('UPDATE students SET group_id = NULL WHERE group_id = $1', [req.params.id])
    await pool.query('DELETE FROM attendance WHERE group_id = $1', [req.params.id])
    await pool.query('DELETE FROM qr_tokens WHERE group_id = $1', [req.params.id])
    await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /groups error:', err)
    res.status(500).json({ error: 'Ошибка удаления группы' })
  }
})

// --- Transactions ---
router.post('/transactions', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role === 'student' || role === 'parent') return res.status(403).json({ error: 'Нет доступа' })

    const { type, amount, category, description, studentId, trainerId } = req.body
    if (!type || amount === undefined) return res.status(400).json({ error: 'Укажите тип и сумму' })
    if (!['income', 'expense'].includes(type)) return res.status(400).json({ error: 'Тип должен быть income или expense' })

    const id = genId()
    const tid = trainerId || userId
    await pool.query('INSERT INTO transactions (id, trainer_id, type, amount, category, description, student_id, date) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())',
      [id, tid, type, amount, category || '', description || '', studentId || null])
    res.json({ id, trainerId: tid, type, amount, category, description, studentId, date: new Date().toISOString() })
  } catch (err) {
    console.error('POST /transactions error:', err)
    res.status(500).json({ error: 'Ошибка создания транзакции' })
  }
})

router.put('/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsTransaction(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    const { type, amount, category, description } = req.body
    await pool.query('UPDATE transactions SET type=COALESCE($1,type), amount=COALESCE($2,amount), category=COALESCE($3,category), description=COALESCE($4,description) WHERE id=$5',
      [type, amount, category, description, req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /transactions error:', err)
    res.status(500).json({ error: 'Ошибка обновления транзакции' })
  }
})

router.delete('/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsTransaction(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /transactions error:', err)
    res.status(500).json({ error: 'Ошибка удаления транзакции' })
  }
})

// --- Tournaments ---
router.post('/tournaments', authMiddleware, async (req, res) => {
  try {
    const r = req.user.role
    if (r !== 'superadmin' && r !== 'organizer') return res.status(403).json({ error: 'Нет доступа' })
    const { title, date, location, city, description, coverImage, regulations, weightCategories, prizes, rules, sportType, matsCount, ageGroups } = req.body
    if (!title || !date) return res.status(400).json({ error: 'Укажите название и дату турнира' })

    const id = genId()
    await pool.query('INSERT INTO tournaments (id, title, date, location, city, description, cover_image, created_by, regulations, weight_categories, prizes, rules, sport_type, mats_count, age_groups) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',
      [id, title, date, location || '', city || '', description || '', coverImage || null, req.user.userId, regulations || '', JSON.stringify(weightCategories || []), prizes || '', rules || '', sportType || null, matsCount || 1, JSON.stringify(ageGroups || [])])
    res.json(mapTournament({ id, title, date, location, city, description, cover_image: coverImage, created_by: req.user.userId, regulations, weight_categories: weightCategories || [], prizes, rules, sport_type: sportType, status: 'upcoming', brackets: {}, mats_count: matsCount || 1, age_groups: ageGroups || [], created_at: new Date() }))
  } catch (err) {
    console.error('POST /tournaments error:', err)
    res.status(500).json({ error: 'Ошибка создания турнира' })
  }
})

router.put('/tournaments/:id', authMiddleware, async (req, res) => {
  try {
    const { title, date, location, city, description, coverImage, regulations, weightCategories, prizes, rules, sportType, status, brackets, matsCount, ageGroups } = req.body
    const sets = []
    const vals = []
    let i = 1
    if (title !== undefined) { sets.push(`title = $${i++}`); vals.push(title) }
    if (date !== undefined) { sets.push(`date = $${i++}`); vals.push(date) }
    if (location !== undefined) { sets.push(`location = $${i++}`); vals.push(location) }
    if (city !== undefined) { sets.push(`city = $${i++}`); vals.push(city) }
    if (description !== undefined) { sets.push(`description = $${i++}`); vals.push(description) }
    if (coverImage !== undefined) { sets.push(`cover_image = $${i++}`); vals.push(coverImage) }
    if (regulations !== undefined) { sets.push(`regulations = $${i++}`); vals.push(regulations) }
    if (weightCategories !== undefined) { sets.push(`weight_categories = $${i++}`); vals.push(JSON.stringify(weightCategories)) }
    if (prizes !== undefined) { sets.push(`prizes = $${i++}`); vals.push(prizes) }
    if (rules !== undefined) { sets.push(`rules = $${i++}`); vals.push(rules) }
    if (sportType !== undefined) { sets.push(`sport_type = $${i++}`); vals.push(sportType) }
    if (status !== undefined) { sets.push(`status = $${i++}`); vals.push(status) }
    if (brackets !== undefined) { sets.push(`brackets = $${i++}`); vals.push(JSON.stringify(brackets)) }
    if (matsCount !== undefined) { sets.push(`mats_count = $${i++}`); vals.push(matsCount) }
    if (ageGroups !== undefined) { sets.push(`age_groups = $${i++}`); vals.push(JSON.stringify(ageGroups)) }
    if (sets.length === 0) return res.json({ ok: true })
    vals.push(req.params.id)
    await pool.query(`UPDATE tournaments SET ${sets.join(', ')} WHERE id = $${i}`, vals)
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /tournaments error:', err)
    res.status(500).json({ error: 'Ошибка обновления турнира' })
  }
})

router.delete('/tournaments/:id', authMiddleware, async (req, res) => {
  try {
    const r = req.user.role
    if (r !== 'superadmin' && r !== 'organizer') return res.status(403).json({ error: 'Нет доступа' })
    await pool.query('DELETE FROM tournament_registrations WHERE tournament_id = $1', [req.params.id])
    await pool.query('DELETE FROM tournaments WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /tournaments error:', err)
    res.status(500).json({ error: 'Ошибка удаления турнира' })
  }
})

// --- Tournament Registrations ---
router.post('/tournament-registrations', authMiddleware, async (req, res) => {
  try {
    const { tournamentId, studentId } = req.body
    if (!tournamentId || !studentId) return res.status(400).json({ error: 'Укажите турнир и ученика' })
    await pool.query('INSERT INTO tournament_registrations (tournament_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [tournamentId, studentId])
    res.json({ ok: true })
  } catch (err) {
    console.error('POST /tournament-registrations error:', err)
    res.status(500).json({ error: 'Ошибка регистрации на турнир' })
  }
})

router.delete('/tournament-registrations', authMiddleware, async (req, res) => {
  try {
    const { tournamentId, studentId } = req.body
    if (!tournamentId || !studentId) return res.status(400).json({ error: 'Укажите турнир и ученика' })
    await pool.query('DELETE FROM tournament_registrations WHERE tournament_id = $1 AND student_id = $2',
      [tournamentId, studentId])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /tournament-registrations error:', err)
    res.status(500).json({ error: 'Ошибка отмены регистрации' })
  }
})

// --- Attendance ---
router.post('/attendance', authMiddleware, async (req, res) => {
  try {
    const { groupId, studentId, date, present } = req.body
    if (!groupId || !studentId || !date) return res.status(400).json({ error: 'Укажите группу, ученика и дату' })
    const id = genId()
    await pool.query(
      `INSERT INTO attendance (id, group_id, student_id, date, present)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (group_id, student_id, date)
       DO UPDATE SET present = $5`,
      [id, groupId, studentId, date, present !== false]
    )
    res.json({ id, groupId, studentId, date, present: present !== false })
  } catch (err) {
    console.error('POST /attendance error:', err)
    res.status(500).json({ error: 'Ошибка сохранения посещаемости' })
  }
})

router.post('/attendance/bulk', authMiddleware, async (req, res) => {
  try {
    const { groupId, date, records } = req.body
    if (!groupId || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Укажите группу, дату и записи' })
    }

    // Use a single transaction for atomicity and performance
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const r of records) {
        const id = genId()
        await client.query(
          `INSERT INTO attendance (id, group_id, student_id, date, present)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (group_id, student_id, date)
           DO UPDATE SET present = $5`,
          [id, groupId, r.studentId, date, r.present !== false]
        )
      }
      await client.query('COMMIT')
    } catch (txErr) {
      await client.query('ROLLBACK')
      throw txErr
    } finally {
      client.release()
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('POST /attendance/bulk error:', err)
    res.status(500).json({ error: 'Ошибка сохранения посещаемости' })
  }
})

router.delete('/attendance', authMiddleware, async (req, res) => {
  try {
    const { groupId, studentId, date } = req.body
    if (!groupId || !studentId || !date) return res.status(400).json({ error: 'Укажите группу, ученика и дату' })
    await pool.query('DELETE FROM attendance WHERE group_id = $1 AND student_id = $2 AND date = $3',
      [groupId, studentId, date])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /attendance error:', err)
    res.status(500).json({ error: 'Ошибка удаления посещаемости' })
  }
})

// --- QR Attendance ---
router.get('/qr-token/:groupId', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role !== 'trainer' && role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    const groupId = req.params.groupId
    const { rows: [group] } = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId])
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })
    if (group.trainer_id !== userId && role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    let { rows: [existing] } = await pool.query('SELECT * FROM qr_tokens WHERE group_id = $1', [groupId])
    if (!existing) {
      const id = genId()
      const token = crypto.randomBytes(32).toString('hex')
      await pool.query('INSERT INTO qr_tokens (id, group_id, trainer_id, token) VALUES ($1,$2,$3,$4)', [id, groupId, userId, token])
      existing = { id, group_id: groupId, trainer_id: userId, token, created_at: new Date() }
    }
    res.json({ token: existing.token, createdAt: existing.created_at })
  } catch (err) {
    console.error('GET /qr-token error:', err)
    res.status(500).json({ error: 'Ошибка получения QR токена' })
  }
})

router.post('/qr-token/:groupId/regenerate', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role !== 'trainer' && role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    const groupId = req.params.groupId
    const { rows: [group] } = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId])
    if (!group || (group.trainer_id !== userId && role !== 'superadmin')) return res.status(403).json({ error: 'Нет доступа' })
    await pool.query('DELETE FROM qr_tokens WHERE group_id = $1', [groupId])
    const id = genId()
    const token = crypto.randomBytes(32).toString('hex')
    await pool.query('INSERT INTO qr_tokens (id, group_id, trainer_id, token) VALUES ($1,$2,$3,$4)', [id, groupId, userId, token])
    res.json({ token, createdAt: new Date() })
  } catch (err) {
    console.error('POST /qr-token/regenerate error:', err)
    res.status(500).json({ error: 'Ошибка обновления QR токена' })
  }
})

// --- Shared Trainer QR ---
router.get('/trainer-qr-token', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role !== 'trainer' && role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    let { rows: [existing] } = await pool.query('SELECT * FROM trainer_qr_tokens WHERE trainer_id = $1', [userId])
    if (!existing) {
      const id = genId()
      const token = crypto.randomBytes(32).toString('hex')
      await pool.query('INSERT INTO trainer_qr_tokens (id, trainer_id, token) VALUES ($1,$2,$3)', [id, userId, token])
      existing = { id, trainer_id: userId, token, created_at: new Date() }
    }
    res.json({ token: existing.token, createdAt: existing.created_at })
  } catch (err) {
    console.error('GET /trainer-qr-token error:', err)
    res.status(500).json({ error: 'Ошибка получения QR токена' })
  }
})

router.post('/trainer-qr-token/regenerate', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role !== 'trainer' && role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    await pool.query('DELETE FROM trainer_qr_tokens WHERE trainer_id = $1', [userId])
    const id = genId()
    const token = crypto.randomBytes(32).toString('hex')
    await pool.query('INSERT INTO trainer_qr_tokens (id, trainer_id, token) VALUES ($1,$2,$3)', [id, userId, token])
    res.json({ token, createdAt: new Date() })
  } catch (err) {
    console.error('POST /trainer-qr-token/regenerate error:', err)
    res.status(500).json({ error: 'Ошибка обновления QR токена' })
  }
})

// Parse schedule string to extract time
function parseSchedule(schedule) {
  if (!schedule) return { days: [], time: null, minutes: null }
  const dayMap = { 'пн': 1, 'вт': 2, 'ср': 3, 'чт': 4, 'пт': 5, 'сб': 6, 'вс': 0 }
  const days = []
  const lower = schedule.toLowerCase()
  for (const [abbr, num] of Object.entries(dayMap)) {
    if (lower.includes(abbr)) days.push(num)
  }
  const timeMatch = schedule.match(/(\d{1,2}):(\d{2})/)
  const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : null
  const minutes = timeMatch ? parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]) : null
  return { days, time, minutes }
}

router.post('/attendance/qr-checkin', authMiddleware, async (req, res) => {
  try {
    const { role, studentId } = req.user
    if (role !== 'student' || !studentId) return res.status(403).json({ error: 'Только ученики могут отмечаться' })
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'Токен не указан' })

    // Check trainer-level QR token first
    const { rows: [trainerQr] } = await pool.query('SELECT * FROM trainer_qr_tokens WHERE token = $1', [token])
    if (trainerQr) {
      const { rows: [student] } = await pool.query('SELECT * FROM students WHERE id = $1', [studentId])
      if (!student) return res.status(404).json({ error: 'Ученик не найден' })
      if (student.trainer_id !== trainerQr.trainer_id) return res.status(400).json({ error: 'Вы не являетесь учеником этого тренера' })

      const { rows: sgRows } = await pool.query('SELECT group_id FROM student_groups WHERE student_id = $1', [studentId])
      let studentGroupIds = sgRows.map(r => r.group_id)
      if (studentGroupIds.length === 0 && student.group_id) {
        studentGroupIds = [student.group_id]
      }
      if (studentGroupIds.length === 0) return res.status(400).json({ error: 'Вы не состоите ни в одной группе' })

      const { rows: groups } = await pool.query('SELECT * FROM groups WHERE trainer_id = $1', [trainerQr.trainer_id])
      const myGroups = groups.filter(g => studentGroupIds.includes(g.id))
      if (myGroups.length === 0) return res.status(400).json({ error: 'Вы не состоите ни в одной группе этого тренера' })

      const now = new Date()
      const currentDay = now.getDay()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      let bestGroup = null
      let bestDiff = Infinity

      for (const g of myGroups) {
        const { days, minutes } = parseSchedule(g.schedule)
        if (minutes === null) continue
        const isTrainingDay = days.length === 0 || days.includes(currentDay)
        if (!isTrainingDay) continue
        const diff = Math.abs(currentMinutes - minutes)
        if (diff < bestDiff) {
          bestDiff = diff
          bestGroup = g
        }
      }

      if (!bestGroup) {
        const todayGroups = myGroups.filter(g => {
          const { days } = parseSchedule(g.schedule)
          return days.length === 0 || days.includes(currentDay)
        })
        bestGroup = todayGroups[0] || myGroups[0]
      }

      const today = now.toISOString().split('T')[0]
      const id = genId()
      await pool.query(
        `INSERT INTO attendance (id, group_id, student_id, date, present)
         VALUES ($1,$2,$3,$4,true)
         ON CONFLICT (group_id, student_id, date)
         DO UPDATE SET present = true`,
        [id, bestGroup.id, studentId, today]
      )
      return res.json({ ok: true, groupId: bestGroup.id, groupName: bestGroup.name, date: today })
    }

    // Fallback: check group-level QR token
    const { rows: [qr] } = await pool.query('SELECT * FROM qr_tokens WHERE token = $1', [token])
    if (!qr) return res.status(400).json({ error: 'Недействительный QR-код. Попросите тренера сгенерировать новый.' })
    const { rows: [student] } = await pool.query('SELECT * FROM students WHERE id = $1', [studentId])
    if (!student) return res.status(404).json({ error: 'Ученик не найден' })

    const { rows: sgCheck } = await pool.query('SELECT 1 FROM student_groups WHERE student_id = $1 AND group_id = $2', [studentId, qr.group_id])
    if (sgCheck.length === 0 && student.group_id !== qr.group_id) {
      return res.status(400).json({ error: 'Вы не состоите в этой группе' })
    }

    const today = new Date().toISOString().split('T')[0]
    const id = genId()
    await pool.query(
      `INSERT INTO attendance (id, group_id, student_id, date, present)
       VALUES ($1,$2,$3,$4,true)
       ON CONFLICT (group_id, student_id, date)
       DO UPDATE SET present = true`,
      [id, qr.group_id, studentId, today]
    )
    res.json({ ok: true, groupId: qr.group_id, date: today })
  } catch (err) {
    console.error('POST /attendance/qr-checkin error:', err)
    res.status(500).json({ error: 'Ошибка отметки посещаемости' })
  }
})

// --- Parents ---
router.post('/parents', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role === 'student' || role === 'parent') return res.status(403).json({ error: 'Нет доступа' })

    const { studentId, name, phone, password, relation } = req.body
    if (!studentId || !name || !phone) return res.status(400).json({ error: 'Заполните все обязательные поля' })

    if (!await verifyTrainerOwnsStudent(userId, role, studentId)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    const id = genId()
    const pw = password || 'parent123'
    const hash = await bcrypt.hash(pw, 10)
    await pool.query(
      'INSERT INTO parents (id, student_id, name, phone, password_hash, plain_password, relation) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, studentId, name, phone, hash, pw, relation || 'parent']
    )
    res.json({ id, studentId, name, phone, relation: relation || 'parent', plainPassword: pw })
  } catch (err) {
    console.error('POST /parents error:', err)
    res.status(500).json({ error: 'Ошибка добавления родителя' })
  }
})

router.put('/parents/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, relation, password } = req.body
    const sets = []
    const vals = []
    let i = 1
    if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name) }
    if (phone !== undefined) { sets.push(`phone = $${i++}`); vals.push(phone) }
    if (relation !== undefined) { sets.push(`relation = $${i++}`); vals.push(relation) }
    if (password) { sets.push(`password_hash = $${i++}`); vals.push(await bcrypt.hash(password, 10)); sets.push(`plain_password = $${i++}`); vals.push(password) }
    if (sets.length === 0) return res.json({ ok: true })
    vals.push(req.params.id)
    await pool.query(`UPDATE parents SET ${sets.join(', ')} WHERE id = $${i}`, vals)
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /parents error:', err)
    res.status(500).json({ error: 'Ошибка обновления родителя' })
  }
})

router.delete('/parents/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM parents WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /parents error:', err)
    res.status(500).json({ error: 'Ошибка удаления родителя' })
  }
})

// --- Student Groups (multi-group) ---
router.put('/student-groups/:studentId', authMiddleware, async (req, res) => {
  try {
    const { groupIds } = req.body
    if (!Array.isArray(groupIds)) return res.status(400).json({ error: 'groupIds must be an array' })

    const { userId, role } = req.user
    if (!await verifyTrainerOwnsStudent(userId, role, req.params.studentId)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    const studentId = req.params.studentId
    await pool.query('DELETE FROM student_groups WHERE student_id = $1', [studentId])
    for (const gid of groupIds) {
      await pool.query('INSERT INTO student_groups (student_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [studentId, gid])
    }
    await pool.query('UPDATE students SET group_id = $1 WHERE id = $2', [groupIds[0] || null, studentId])
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /student-groups error:', err)
    res.status(500).json({ error: 'Ошибка обновления групп ученика' })
  }
})

// --- News ---
router.post('/news', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role === 'student' || role === 'parent') return res.status(403).json({ error: 'Нет доступа' })

    const { title, content, groupId, trainerId } = req.body
    if (!title) return res.status(400).json({ error: 'Укажите заголовок' })

    const id = genId()
    const tid = trainerId || userId
    await pool.query('INSERT INTO news (id, trainer_id, group_id, title, content, date) VALUES ($1,$2,$3,$4,$5,NOW())',
      [id, tid, groupId || null, title, content || ''])
    res.json({ id, trainerId: tid, groupId, title, content, date: new Date().toISOString() })
  } catch (err) {
    console.error('POST /news error:', err)
    res.status(500).json({ error: 'Ошибка создания новости' })
  }
})

router.delete('/news/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM news WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /news error:', err)
    res.status(500).json({ error: 'Ошибка удаления новости' })
  }
})

// --- Trainers (admin only) ---
router.post('/trainers', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })

    const { name, phone, password, clubName, avatar, sportType, sportTypes, city, userRole, rank, achievements } = req.body
    if (!name || !phone) return res.status(400).json({ error: 'Укажите имя и телефон' })

    const id = genId()
    const pw = password || 'trainer123'
    const hash = await bcrypt.hash(pw, 10)
    const sTypes = sportTypes || (sportType ? [sportType] : [])
    const sType = sportType || (sTypes[0] || null)
    const validRoles = ['trainer', 'club_owner', 'club_admin', 'organizer']
    const assignRole = validRoles.includes(userRole) ? userRole : 'trainer'
    await pool.query('INSERT INTO users (id, name, phone, password_hash, role, club_name, avatar, sport_type, sport_types, city, plain_password, rank, achievements) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [id, name, phone, hash, assignRole, clubName || '', avatar || null, sType, JSON.stringify(sTypes), city || null, pw, rank || null, achievements || null])
    res.json({ id, name, phone, role: assignRole, clubName, avatar, sportType: sType, sportTypes: sTypes, city, plainPassword: pw, rank: rank || '', achievements: achievements || '' })
  } catch (err) {
    console.error('POST /trainers error:', err)
    res.status(500).json({ error: 'Ошибка создания тренера' })
  }
})

router.put('/trainers/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    // Trainers can edit themselves, superadmin can edit anyone
    if (role !== 'superadmin' && userId !== req.params.id) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

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
    if (req.body.rank !== undefined) {
      sets.push(`rank = $${vals.length + 1}`)
      vals.push(req.body.rank)
    }
    if (req.body.achievements !== undefined) {
      sets.push(`achievements = $${vals.length + 1}`)
      vals.push(req.body.achievements)
    }
    if (password) {
      sets.push(`password_hash = $${vals.length + 1}`, `plain_password = $${vals.length + 2}`)
      vals.push(await bcrypt.hash(password, 10), password)
    }
    vals.push(req.params.id)
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals)
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /trainers error:', err)
    res.status(500).json({ error: 'Ошибка обновления тренера' })
  }
})

router.delete('/trainers/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })

    // Use transaction for atomic delete
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM news WHERE trainer_id = $1', [req.params.id])
      await client.query('DELETE FROM transactions WHERE trainer_id = $1', [req.params.id])
      await client.query('DELETE FROM internal_tournaments WHERE trainer_id = $1', [req.params.id])
      await client.query('DELETE FROM materials WHERE trainer_id = $1', [req.params.id])
      await client.query('DELETE FROM qr_tokens WHERE trainer_id = $1', [req.params.id])
      await client.query('DELETE FROM trainer_qr_tokens WHERE trainer_id = $1', [req.params.id])
      const { rows: students } = await client.query('SELECT id FROM students WHERE trainer_id = $1', [req.params.id])
      for (const s of students) {
        await client.query('DELETE FROM tournament_registrations WHERE student_id = $1', [s.id])
        await client.query('DELETE FROM attendance WHERE student_id = $1', [s.id])
        await client.query('DELETE FROM student_groups WHERE student_id = $1', [s.id])
        await client.query('DELETE FROM parents WHERE student_id = $1', [s.id])
      }
      await client.query('DELETE FROM students WHERE trainer_id = $1', [req.params.id])
      await client.query('DELETE FROM groups WHERE trainer_id = $1', [req.params.id])
      await client.query('DELETE FROM users WHERE id = $1', [req.params.id])
      await client.query('COMMIT')
    } catch (txErr) {
      await client.query('ROLLBACK')
      throw txErr
    } finally {
      client.release()
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /trainers error:', err)
    res.status(500).json({ error: 'Ошибка удаления тренера' })
  }
})

// --- Author Info ---
router.put('/author', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    const { name, instagram, website, description, phone } = req.body
    await pool.query(
      `INSERT INTO author_info (id, name, instagram, website, description, phone) VALUES (1,$1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET name=$1, instagram=$2, website=$3, description=$4, phone=$5`,
      [name, instagram, website, description, phone])
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /author error:', err)
    res.status(500).json({ error: 'Ошибка обновления информации' })
  }
})

// --- Internal Tournaments (trainer brackets) ---
router.post('/internal-tournaments', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role === 'student' || role === 'parent') return res.status(403).json({ error: 'Нет доступа' })

    const { title, date, brackets, sportType, coverImage } = req.body
    if (!title) return res.status(400).json({ error: 'Укажите название турнира' })

    const id = genId()
    await pool.query('INSERT INTO internal_tournaments (id, trainer_id, title, date, brackets, sport_type, cover_image) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, userId, title, date || null, JSON.stringify(brackets || {}), sportType || null, coverImage || null])
    const { rows: [t] } = await pool.query('SELECT * FROM internal_tournaments WHERE id = $1', [id])
    res.json(mapInternalTournament(t))
  } catch (err) {
    console.error('POST /internal-tournaments error:', err)
    res.status(500).json({ error: 'Ошибка создания внутреннего турнира' })
  }
})

router.put('/internal-tournaments/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsIntTournament(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

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
  } catch (err) {
    console.error('PUT /internal-tournaments error:', err)
    res.status(500).json({ error: 'Ошибка обновления внутреннего турнира' })
  }
})

router.delete('/internal-tournaments/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsIntTournament(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    await pool.query('DELETE FROM internal_tournaments WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /internal-tournaments error:', err)
    res.status(500).json({ error: 'Ошибка удаления внутреннего турнира' })
  }
})

// --- Materials ---
router.post('/materials', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (role === 'student' || role === 'parent') return res.status(403).json({ error: 'Нет доступа' })

    const { title, description, videoUrl, groupIds, trainerId, category, customThumb } = req.body
    if (!title || !videoUrl) return res.status(400).json({ error: 'Укажите название и ссылку на видео' })

    const id = genId()
    const tid = trainerId || userId
    await pool.query(
      'INSERT INTO materials (id, trainer_id, title, description, video_url, group_ids, category, custom_thumb, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())',
      [id, tid, title, description || '', videoUrl, JSON.stringify(groupIds || []), category || 'other', customThumb || null]
    )
    res.json({ id, trainerId: tid, title, description: description || '', videoUrl, groupIds: groupIds || [], category: category || 'other', customThumb: customThumb || '', createdAt: new Date().toISOString() })
  } catch (err) {
    console.error('POST /materials error:', err)
    res.status(500).json({ error: 'Ошибка создания материала' })
  }
})

router.put('/materials/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsMaterial(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

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
  } catch (err) {
    console.error('PUT /materials error:', err)
    res.status(500).json({ error: 'Ошибка обновления материала' })
  }
})

router.delete('/materials/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user
    if (!await verifyTrainerOwnsMaterial(userId, role, req.params.id)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    await pool.query('DELETE FROM materials WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /materials error:', err)
    res.status(500).json({ error: 'Ошибка удаления материала' })
  }
})

// --- Clubs ---
router.post('/clubs', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    const { name, city, sportTypes, headTrainerId, phone, vk, address, logo } = req.body
    if (!name) return res.status(400).json({ error: 'Укажите название клуба' })

    const id = genId()
    await pool.query('INSERT INTO clubs (id, name, city, sport_types, head_trainer_id, phone, vk, address, logo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, name, city || '', JSON.stringify(sportTypes || []), headTrainerId || null, phone || null, vk || null, address || null, logo || null])
    if (headTrainerId) {
      await pool.query('UPDATE users SET club_id = $1, is_head_trainer = true WHERE id = $2', [id, headTrainerId])
    }
    res.json({ id, name, city, sportTypes: sportTypes || [], headTrainerId, phone: phone || '', vk: vk || '', address: address || '', logo: logo || null, createdAt: new Date().toISOString() })
  } catch (err) {
    console.error('POST /clubs error:', err)
    res.status(500).json({ error: 'Ошибка создания клуба' })
  }
})

router.put('/clubs/:id', authMiddleware, async (req, res) => {
  try {
    const { name, city, sportTypes, headTrainerId, phone, vk, address, logo } = req.body
    const sets = []
    const vals = []
    let i = 1
    if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name) }
    if (city !== undefined) { sets.push(`city = $${i++}`); vals.push(city) }
    if (sportTypes !== undefined) { sets.push(`sport_types = $${i++}`); vals.push(JSON.stringify(sportTypes)) }
    if (phone !== undefined) { sets.push(`phone = $${i++}`); vals.push(phone) }
    if (vk !== undefined) { sets.push(`vk = $${i++}`); vals.push(vk) }
    if (address !== undefined) { sets.push(`address = $${i++}`); vals.push(address) }
    if (logo !== undefined) { sets.push(`logo = $${i++}`); vals.push(logo) }
    if (headTrainerId !== undefined) {
      sets.push(`head_trainer_id = $${i++}`); vals.push(headTrainerId)
      await pool.query('UPDATE users SET is_head_trainer = false WHERE club_id = $1 AND is_head_trainer = true', [req.params.id])
      if (headTrainerId) {
        await pool.query('UPDATE users SET club_id = $1, is_head_trainer = true WHERE id = $2', [req.params.id, headTrainerId])
      }
    }
    if (sets.length === 0) return res.json({ ok: true })
    vals.push(req.params.id)
    await pool.query(`UPDATE clubs SET ${sets.join(', ')} WHERE id = $${i}`, vals)
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /clubs error:', err)
    res.status(500).json({ error: 'Ошибка обновления клуба' })
  }
})

router.delete('/clubs/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    await pool.query('UPDATE users SET club_id = NULL, is_head_trainer = false WHERE club_id = $1', [req.params.id])
    await pool.query('DELETE FROM branches WHERE club_id = $1', [req.params.id])
    await pool.query('DELETE FROM clubs WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /clubs error:', err)
    res.status(500).json({ error: 'Ошибка удаления клуба' })
  }
})

// Assign trainer to club
router.post('/clubs/:id/trainers', authMiddleware, async (req, res) => {
  try {
    const { trainerId } = req.body
    if (!trainerId) return res.status(400).json({ error: 'Укажите тренера' })
    const { rows: [club] } = await pool.query('SELECT name FROM clubs WHERE id = $1', [req.params.id])
    if (!club) return res.status(404).json({ error: 'Клуб не найден' })
    await pool.query('UPDATE users SET club_id = $1, club_name = $2 WHERE id = $3', [req.params.id, club.name, trainerId])
    res.json({ ok: true })
  } catch (err) {
    console.error('POST /clubs/:id/trainers error:', err)
    res.status(500).json({ error: 'Ошибка привязки тренера' })
  }
})

// Remove trainer from club
router.delete('/clubs/:id/trainers/:trainerId', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE users SET club_id = NULL, is_head_trainer = false, club_name = NULL WHERE id = $1 AND club_id = $2',
      [req.params.trainerId, req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /clubs/:id/trainers error:', err)
    res.status(500).json({ error: 'Ошибка удаления тренера из клуба' })
  }
})

// --- Branches ---
router.post('/branches', authMiddleware, async (req, res) => {
  try {
    const { clubId, name, city, address } = req.body
    if (!clubId || !name) return res.status(400).json({ error: 'Укажите клуб и название' })
    const { role } = req.user
    if (role !== 'superadmin' && role !== 'club_owner' && role !== 'club_admin') return res.status(403).json({ error: 'Нет доступа' })
    const id = genId()
    await pool.query('INSERT INTO branches (id, club_id, name, city, address) VALUES ($1,$2,$3,$4,$5)',
      [id, clubId, name, city || '', address || ''])
    res.json({ id, clubId, name, city: city || '', address: address || '', createdAt: new Date().toISOString() })
  } catch (err) {
    console.error('POST /branches error:', err)
    res.status(500).json({ error: 'Ошибка создания филиала' })
  }
})

router.put('/branches/:id', authMiddleware, async (req, res) => {
  try {
    const { name, city, address } = req.body
    const { role } = req.user
    if (role !== 'superadmin' && role !== 'club_owner' && role !== 'club_admin') return res.status(403).json({ error: 'Нет доступа' })
    const sets = []
    const vals = []
    let i = 1
    if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name) }
    if (city !== undefined) { sets.push(`city = $${i++}`); vals.push(city) }
    if (address !== undefined) { sets.push(`address = $${i++}`); vals.push(address) }
    if (sets.length === 0) return res.json({ ok: true })
    vals.push(req.params.id)
    await pool.query(`UPDATE branches SET ${sets.join(', ')} WHERE id = $${i}`, vals)
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /branches error:', err)
    res.status(500).json({ error: 'Ошибка обновления филиала' })
  }
})

router.delete('/branches/:id', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user
    if (role !== 'superadmin' && role !== 'club_owner' && role !== 'club_admin') return res.status(403).json({ error: 'Нет доступа' })
    await pool.query('DELETE FROM branches WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /branches error:', err)
    res.status(500).json({ error: 'Ошибка удаления филиала' })
  }
})

// --- Pending Registrations (superadmin) ---
router.get('/registrations', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    const { rows } = await pool.query("SELECT * FROM pending_registrations ORDER BY created_at DESC")
    res.json(rows.map(r => ({
      id: r.id, name: r.name, phone: r.phone, clubName: r.club_name,
      sportType: r.sport_type, city: r.city, plainPassword: r.plain_password,
      status: r.status, createdAt: r.created_at,
    })))
  } catch (err) {
    console.error('GET /registrations error:', err)
    res.status(500).json({ error: 'Ошибка загрузки заявок' })
  }
})

router.post('/registrations/:id/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    const { rows: [reg] } = await pool.query('SELECT * FROM pending_registrations WHERE id = $1', [req.params.id])
    if (!reg) return res.status(404).json({ error: 'Заявка не найдена' })
    if (reg.status !== 'pending') return res.status(400).json({ error: 'Заявка уже обработана' })

    const id = genId()
    await pool.query(
      'INSERT INTO users (id, name, phone, password_hash, role, club_name, sport_type, city, plain_password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, reg.name, reg.phone, reg.password_hash, 'trainer', reg.club_name || '', reg.sport_type, reg.city, reg.plain_password]
    )
    await pool.query("UPDATE pending_registrations SET status = 'approved' WHERE id = $1", [req.params.id])
    res.json({ ok: true, trainerId: id })
  } catch (err) {
    console.error('POST /registrations/approve error:', err)
    res.status(500).json({ error: 'Ошибка одобрения заявки' })
  }
})

router.post('/registrations/:id/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Нет доступа' })
    await pool.query("UPDATE pending_registrations SET status = 'rejected' WHERE id = $1", [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('POST /registrations/reject error:', err)
    res.status(500).json({ error: 'Ошибка отклонения заявки' })
  }
})

export default router
