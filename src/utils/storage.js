import { seedData } from './seedData'

const STORAGE_KEY = 'iborcuha_data'
const AUTH_KEY = 'iborcuha_auth'

function isValidData(data) {
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray(data.users) ||
    !Array.isArray(data.groups) ||
    !Array.isArray(data.students) ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.tournaments) ||
    !Array.isArray(data.news)
  ) return false
  if (!Array.isArray(data.tournamentRegistrations)) data.tournamentRegistrations = []
  if (!data.authorInfo) data.authorInfo = { ...seedData.authorInfo }
  // Migrate: ensure students have password and phone (phone-based login)
  data.students.forEach(s => {
    if (!s.password) s.password = 'student123'
    if (!s.phone) s.phone = ''
  })
  return true
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isValidData(parsed)) return parsed
    }
  } catch {
    // corrupted data — fall through to seed
  }
  const data = JSON.parse(JSON.stringify(seedData))
  saveData(data)
  return data
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(AUTH_KEY)
  const data = JSON.parse(JSON.stringify(seedData))
  saveData(data)
  return data
}

export function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return null
}

export function saveAuth(auth) {
  if (auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  } else {
    localStorage.removeItem(AUTH_KEY)
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
