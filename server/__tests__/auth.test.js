import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from './setup.js'
import pool, { initDB } from '../db.js'
import bcrypt from 'bcryptjs'

const app = createApp()
let testUserId
let testStudentId
let trainerToken
let studentToken

beforeAll(async () => {
  await initDB()
  // Clean test data
  await pool.query("DELETE FROM users WHERE phone LIKE '%9999999%'")
  await pool.query("DELETE FROM students WHERE phone LIKE '%9999999%'")
  await pool.query("DELETE FROM pending_registrations WHERE phone LIKE '%9999999%'")

  // Create test trainer
  testUserId = 'test-auth-trainer-' + Date.now()
  const hash = await bcrypt.hash('test123', 10)
  await pool.query(
    "INSERT INTO users (id, name, phone, password_hash, role, plain_password) VALUES ($1, 'Тест Тренер', '89999999001', $2, 'trainer', 'test123')",
    [testUserId, hash]
  )

  // Create test student
  testStudentId = 'test-auth-student-' + Date.now()
  const shash = await bcrypt.hash('student123', 10)
  await pool.query(
    "INSERT INTO students (id, trainer_id, name, phone, password_hash, plain_password) VALUES ($1, $2, 'Тест Ученик', '89999999002', $3, 'student123')",
    [testStudentId, testUserId, shash]
  )
})

afterAll(async () => {
  await pool.query('DELETE FROM students WHERE id = $1', [testStudentId])
  await pool.query('DELETE FROM users WHERE id = $1', [testUserId])
  await pool.query("DELETE FROM pending_registrations WHERE phone LIKE '%9999999%'")
  await pool.end()
})

describe('POST /api/auth/login', () => {
  it('should reject empty credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })

  it('should reject short phone number', async () => {
    const res = await request(app).post('/api/auth/login').send({ phone: '123', password: 'test' })
    expect(res.status).toBe(400)
  })

  it('should login trainer with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone: '89999999001',
      password: 'test123',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.role).toBe('trainer')
    expect(res.body.userId).toBe(testUserId)
    expect(res.body.user.name).toBe('Тест Тренер')
    trainerToken = res.body.token
  })

  it('should login student with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone: '89999999002',
      password: 'student123',
    })
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('student')
    expect(res.body.studentId).toBe(testStudentId)
    studentToken = res.body.token
  })

  it('should reject wrong password for known user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone: '89999999001',
      password: 'wrongpassword',
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toContain('пароль')
  })

  it('should return error for unknown phone', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone: '89999999099',
      password: 'anything',
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toContain('не найден')
  })

  it('should set httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone: '89999999001',
      password: 'test123',
    })
    const cookies = res.headers['set-cookie']
    expect(cookies).toBeTruthy()
    expect(cookies[0]).toContain('httpOnly')
  })
})

describe('GET /api/auth/me', () => {
  it('should return null without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })

  it('should return user data with valid trainer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${trainerToken}`)
    expect(res.status).toBe(200)
    expect(res.body.userId).toBe(testUserId)
    expect(res.body.role).toBe('trainer')
    expect(res.body.user.name).toBe('Тест Тренер')
  })

  it('should return student data with student token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('student')
    expect(res.body.student).toBeTruthy()
    expect(res.body.student.name).toBe('Тест Ученик')
  })

  it('should return null with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-xyz')
    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })
})

describe('POST /api/auth/register', () => {
  it('should reject empty fields', async () => {
    const res = await request(app).post('/api/auth/register').send({})
    expect(res.status).toBe(400)
  })

  it('should reject without consent', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test', phone: '89999999010', password: 'test123', consent: false,
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('согласие')
  })

  it('should create pending registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Новый Тренер', phone: '89999999010', password: 'new123',
      clubName: 'Test Club', sportType: 'bjj', city: 'Москва', consent: true,
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('should reject duplicate pending registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Другой', phone: '89999999010', password: 'test123', consent: true,
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('уже отправлена')
  })
})

describe('POST /api/auth/logout', () => {
  it('should clear cookie', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
