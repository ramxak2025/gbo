import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from './setup.js'
import pool, { initDB } from '../db.js'
import bcrypt from 'bcryptjs'
import { signToken } from '../auth.js'

const app = createApp()

let trainerId, trainerToken
let trainer2Id, trainer2Token
let adminToken
let studentToken, studentId

beforeAll(async () => {
  await initDB()

  // Create test trainer
  trainerId = 'test-data-trainer-' + Date.now()
  const hash = await bcrypt.hash('test123', 10)
  await pool.query(
    "INSERT INTO users (id, name, phone, password_hash, role) VALUES ($1, 'Дата Тренер', '89888888001', $2, 'trainer')",
    [trainerId, hash]
  )
  trainerToken = signToken({ userId: trainerId, role: 'trainer' })

  // Create second trainer (for authorization tests)
  trainer2Id = 'test-data-trainer2-' + Date.now()
  await pool.query(
    "INSERT INTO users (id, name, phone, password_hash, role) VALUES ($1, 'Другой Тренер', '89888888002', $2, 'trainer')",
    [trainer2Id, hash]
  )
  trainer2Token = signToken({ userId: trainer2Id, role: 'trainer' })

  // Create admin
  const adminId = 'test-data-admin-' + Date.now()
  await pool.query(
    "INSERT INTO users (id, name, phone, password_hash, role) VALUES ($1, 'Админ', '89888888003', $2, 'superadmin')",
    [adminId, hash]
  )
  adminToken = signToken({ userId: adminId, role: 'superadmin' })

  // Create student
  studentId = 'test-data-student-' + Date.now()
  await pool.query(
    "INSERT INTO students (id, trainer_id, name, phone, password_hash) VALUES ($1, $2, 'Ученик Тест', '89888888004', $3)",
    [studentId, trainerId, hash]
  )
  studentToken = signToken({ userId: trainerId, role: 'student', studentId })
})

afterAll(async () => {
  // Clean up in reverse order of dependencies
  await pool.query("DELETE FROM attendance WHERE student_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM student_groups WHERE student_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM tournament_registrations WHERE student_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM parents WHERE student_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM transactions WHERE trainer_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM news WHERE trainer_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM internal_tournaments WHERE trainer_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM materials WHERE trainer_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM qr_tokens WHERE trainer_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM trainer_qr_tokens WHERE trainer_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM students WHERE trainer_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM groups WHERE trainer_id LIKE 'test-data-%'")
  await pool.query("DELETE FROM users WHERE id LIKE 'test-data-%'")
  await pool.end()
})

describe('GET /api/data', () => {
  it('should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/data')
    expect(res.status).toBe(401)
  })

  it('should return all data for authenticated trainer', async () => {
    const res = await request(app)
      .get('/api/data')
      .set('Authorization', `Bearer ${trainerToken}`)
    expect(res.status).toBe(200)
    expect(res.body.users).toBeDefined()
    expect(res.body.groups).toBeDefined()
    expect(res.body.students).toBeDefined()
    expect(res.body.transactions).toBeDefined()
    expect(res.body.tournaments).toBeDefined()
    expect(res.body.news).toBeDefined()
    expect(res.body.materials).toBeDefined()
    expect(res.body.clubs).toBeDefined()
    expect(res.body.attendance).toBeDefined()
    expect(res.body.branches).toBeDefined()
    expect(res.body.studentGroups).toBeDefined()
    expect(res.body.parents).toBeDefined()
    expect(Array.isArray(res.body.users)).toBe(true)
  })

  it('should include pendingRegistrations for superadmin', async () => {
    const res = await request(app)
      .get('/api/data')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.pendingRegistrations).toBeDefined()
  })
})

describe('Students CRUD', () => {
  let createdStudentId

  it('should reject student creation from student role', async () => {
    const res = await request(app)
      .post('/api/data/students')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Fake', phone: '89000000000' })
    expect(res.status).toBe(403)
  })

  it('should reject student creation without name', async () => {
    const res = await request(app)
      .post('/api/data/students')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ phone: '89000000000' })
    expect(res.status).toBe(400)
  })

  it('should create a student', async () => {
    const res = await request(app)
      .post('/api/data/students')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        name: 'Новый Ученик', phone: '89888888010',
        weight: 75, belt: 'Белый', birthDate: '2000-01-01',
      })
    expect(res.status).toBe(200)
    expect(res.body.id).toBeTruthy()
    expect(res.body.name).toBe('Новый Ученик')
    expect(res.body.trainerId).toBe(trainerId)
    createdStudentId = res.body.id
  })

  it('should update a student (own)', async () => {
    const res = await request(app)
      .put(`/api/data/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ belt: 'Синий', weight: 80 })
    expect(res.status).toBe(200)
    expect(res.body.belt).toBe('Синий')
  })

  it('should reject update from another trainer', async () => {
    const res = await request(app)
      .put(`/api/data/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${trainer2Token}`)
      .send({ belt: 'Чёрный' })
    expect(res.status).toBe(403)
  })

  it('should reject delete from another trainer', async () => {
    const res = await request(app)
      .delete(`/api/data/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${trainer2Token}`)
    expect(res.status).toBe(403)
  })

  it('should delete a student (own)', async () => {
    const res = await request(app)
      .delete(`/api/data/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

describe('Groups CRUD', () => {
  let createdGroupId

  it('should reject group creation from student role', async () => {
    const res = await request(app)
      .post('/api/data/groups')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Группа' })
    expect(res.status).toBe(403)
  })

  it('should reject group creation without name', async () => {
    const res = await request(app)
      .post('/api/data/groups')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('should create a group', async () => {
    const res = await request(app)
      .post('/api/data/groups')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ name: 'Тестовая группа', schedule: 'Пн, Ср — 18:00', subscriptionCost: 5000 })
    expect(res.status).toBe(200)
    expect(res.body.id).toBeTruthy()
    expect(res.body.name).toBe('Тестовая группа')
    createdGroupId = res.body.id
  })

  it('should update own group', async () => {
    const res = await request(app)
      .put(`/api/data/groups/${createdGroupId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ name: 'Обновлённая группа', subscriptionCost: 6000 })
    expect(res.status).toBe(200)
  })

  it('should reject update from another trainer', async () => {
    const res = await request(app)
      .put(`/api/data/groups/${createdGroupId}`)
      .set('Authorization', `Bearer ${trainer2Token}`)
      .send({ name: 'Взлом' })
    expect(res.status).toBe(403)
  })

  it('should delete own group', async () => {
    const res = await request(app)
      .delete(`/api/data/groups/${createdGroupId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
    expect(res.status).toBe(200)
  })
})

describe('Transactions CRUD', () => {
  let createdTxId

  it('should reject from student role', async () => {
    const res = await request(app)
      .post('/api/data/transactions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ type: 'income', amount: 1000 })
    expect(res.status).toBe(403)
  })

  it('should reject invalid type', async () => {
    const res = await request(app)
      .post('/api/data/transactions')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ type: 'hack', amount: 1000 })
    expect(res.status).toBe(400)
  })

  it('should create transaction', async () => {
    const res = await request(app)
      .post('/api/data/transactions')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ type: 'income', amount: 5000, category: 'Абонемент', description: 'Тест' })
    expect(res.status).toBe(200)
    expect(res.body.id).toBeTruthy()
    expect(res.body.amount).toBe(5000)
    createdTxId = res.body.id
  })

  it('should reject update from another trainer', async () => {
    const res = await request(app)
      .put(`/api/data/transactions/${createdTxId}`)
      .set('Authorization', `Bearer ${trainer2Token}`)
      .send({ amount: 9999 })
    expect(res.status).toBe(403)
  })

  it('should update own transaction', async () => {
    const res = await request(app)
      .put(`/api/data/transactions/${createdTxId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ amount: 6000 })
    expect(res.status).toBe(200)
  })

  it('should delete own transaction', async () => {
    const res = await request(app)
      .delete(`/api/data/transactions/${createdTxId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
    expect(res.status).toBe(200)
  })
})

describe('Attendance', () => {
  let testGroupId

  beforeAll(async () => {
    // Create test group
    const res = await request(app)
      .post('/api/data/groups')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ name: 'Группа для посещаемости' })
    testGroupId = res.body.id
  })

  it('should save single attendance', async () => {
    const res = await request(app)
      .post('/api/data/attendance')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ groupId: testGroupId, studentId, date: '2026-01-15', present: true })
    expect(res.status).toBe(200)
    expect(res.body.present).toBe(true)
  })

  it('should reject attendance without required fields', async () => {
    const res = await request(app)
      .post('/api/data/attendance')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ groupId: testGroupId })
    expect(res.status).toBe(400)
  })

  it('should save bulk attendance in transaction', async () => {
    const res = await request(app)
      .post('/api/data/attendance/bulk')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        groupId: testGroupId,
        date: '2026-01-16',
        records: [
          { studentId, present: true },
        ],
      })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('should reject bulk attendance without records array', async () => {
    const res = await request(app)
      .post('/api/data/attendance/bulk')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ groupId: testGroupId, date: '2026-01-16' })
    expect(res.status).toBe(400)
  })

  afterAll(async () => {
    await pool.query('DELETE FROM attendance WHERE group_id = $1', [testGroupId])
    await pool.query('DELETE FROM groups WHERE id = $1', [testGroupId])
  })
})

describe('Internal Tournaments', () => {
  let intTourneyId

  it('should reject from student', async () => {
    const res = await request(app)
      .post('/api/data/internal-tournaments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Test' })
    expect(res.status).toBe(403)
  })

  it('should create internal tournament', async () => {
    const res = await request(app)
      .post('/api/data/internal-tournaments')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ title: 'Тестовый турнир', date: '2026-03-20', sportType: 'bjj' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Тестовый турнир')
    intTourneyId = res.body.id
  })

  it('should reject update from another trainer', async () => {
    const res = await request(app)
      .put(`/api/data/internal-tournaments/${intTourneyId}`)
      .set('Authorization', `Bearer ${trainer2Token}`)
      .send({ title: 'Hack' })
    expect(res.status).toBe(403)
  })

  it('should update own internal tournament', async () => {
    const res = await request(app)
      .put(`/api/data/internal-tournaments/${intTourneyId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ title: 'Обновлённый', status: 'finished' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Обновлённый')
  })

  it('should delete own internal tournament', async () => {
    const res = await request(app)
      .delete(`/api/data/internal-tournaments/${intTourneyId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
    expect(res.status).toBe(200)
  })
})

describe('Materials CRUD', () => {
  let matId

  it('should create material', async () => {
    const res = await request(app)
      .post('/api/data/materials')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ title: 'Техника', videoUrl: 'https://youtube.com/test', category: 'strikes' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Техника')
    matId = res.body.id
  })

  it('should reject material without title', async () => {
    const res = await request(app)
      .post('/api/data/materials')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ videoUrl: 'https://youtube.com/test' })
    expect(res.status).toBe(400)
  })

  it('should reject update from another trainer', async () => {
    const res = await request(app)
      .put(`/api/data/materials/${matId}`)
      .set('Authorization', `Bearer ${trainer2Token}`)
      .send({ title: 'Hack' })
    expect(res.status).toBe(403)
  })

  it('should delete own material', async () => {
    const res = await request(app)
      .delete(`/api/data/materials/${matId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
    expect(res.status).toBe(200)
  })
})

describe('News', () => {
  let newsId

  it('should reject from student', async () => {
    const res = await request(app)
      .post('/api/data/news')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Hack' })
    expect(res.status).toBe(403)
  })

  it('should create news', async () => {
    const res = await request(app)
      .post('/api/data/news')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ title: 'Тест новость', content: 'Контент' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Тест новость')
    newsId = res.body.id
  })

  it('should delete news', async () => {
    const res = await request(app)
      .delete(`/api/data/news/${newsId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
    expect(res.status).toBe(200)
  })
})

describe('Trainers (admin only)', () => {
  let newTrainerId

  it('should reject trainer creation from non-admin', async () => {
    const res = await request(app)
      .post('/api/data/trainers')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ name: 'Fake', phone: '89888888020' })
    expect(res.status).toBe(403)
  })

  it('should create trainer as admin', async () => {
    const res = await request(app)
      .post('/api/data/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Новый Тренер', phone: '89888888020', password: 'test' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Новый Тренер')
    newTrainerId = res.body.id
  })

  it('should allow trainer to edit themselves', async () => {
    const selfToken = signToken({ userId: newTrainerId, role: 'trainer' })
    const res = await request(app)
      .put(`/api/data/trainers/${newTrainerId}`)
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ city: 'Москва' })
    expect(res.status).toBe(200)
  })

  it('should reject trainer editing another trainer', async () => {
    const res = await request(app)
      .put(`/api/data/trainers/${newTrainerId}`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ name: 'Hack' })
    expect(res.status).toBe(403)
  })

  it('should delete trainer as admin', async () => {
    const res = await request(app)
      .delete(`/api/data/trainers/${newTrainerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})

describe('Clubs (admin only)', () => {
  let clubId

  it('should reject club creation from non-admin', async () => {
    const res = await request(app)
      .post('/api/data/clubs')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ name: 'Club' })
    expect(res.status).toBe(403)
  })

  it('should create club as admin', async () => {
    const res = await request(app)
      .post('/api/data/clubs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Тест Клуб', city: 'Москва', sportTypes: ['bjj'] })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Тест Клуб')
    clubId = res.body.id
  })

  it('should update club', async () => {
    const res = await request(app)
      .put(`/api/data/clubs/${clubId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ city: 'СПб' })
    expect(res.status).toBe(200)
  })

  it('should delete club as admin', async () => {
    const res = await request(app)
      .delete(`/api/data/clubs/${clubId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})
