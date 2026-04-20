/**
 * iBorcuha — Shared API Types
 *
 * TypeScript-типы для ответов API. Используются ОБЕИМИ платформами
 * (web и mobile) чтобы исключить расхождения в контрактах.
 *
 * Эти типы — ручная версия `components.schemas` из shared/openapi.json.
 * Для автогенерации: `npx openapi-typescript shared/openapi.json -o shared/api-types/generated.d.ts`
 */

export type Role = 'superadmin' | 'trainer' | 'student'

export type SportType =
  | 'bjj' | 'mma' | 'boxing' | 'wrestling' | 'judo'
  | 'karate' | 'kickboxing' | 'muaythai' | 'grappling' | 'other'

export type StudentStatus = 'sick' | 'injury' | 'skip' | null

export interface User {
  id: string
  name: string
  phone: string
  role: Role
  avatar: string | null
  clubName: string | null
  clubId: string | null
  isHeadTrainer: boolean
  sportType: SportType | null
  sportTypes: SportType[]
  city: string | null
  materialCategories?: string[]
  isDemo?: boolean
  plainPassword?: string // Только для superadmin-респонса
}

export interface Student {
  id: string
  trainerId: string
  groupId: string | null
  name: string
  phone: string
  weight: number | null
  belt: string | null
  birthDate: string | null
  avatar: string | null
  subscriptionExpiresAt: string | null
  status: StudentStatus
  trainingStartDate: string | null
  createdAt: string
  isDemo?: boolean
  plainPassword?: string
}

export interface Group {
  id: string
  trainerId: string
  name: string
  schedule: string
  subscriptionCost: number
  attendanceEnabled: boolean
  sportType: SportType | null
  pinnedMaterialId: string | null
}

export interface Transaction {
  id: string
  trainerId: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  studentId: string | null
  date: string
}

export interface Tournament {
  id: string
  title: string
  coverImage: string | null
  date: string
  location: string
  description: string
  createdBy: string | null
}

export interface Attendance {
  id: string
  groupId: string
  studentId: string
  date: string
  present: boolean
}

export interface News {
  id: string
  trainerId: string
  groupId: string | null
  title: string
  content: string
  date: string
}

export interface Material {
  id: string
  trainerId: string
  title: string
  description: string
  videoUrl: string
  groupIds: string[]
  category: string
  customThumb: string
  createdAt: string
}

export interface Club {
  id: string
  name: string
  city: string
  sportTypes: SportType[]
  headTrainerId: string | null
  createdAt: string
}

export interface InternalTournament {
  id: string
  trainerId: string
  title: string
  date: string | null
  status: string
  brackets: Record<string, unknown>
  sportType: SportType | null
  coverImage: string | null
  createdAt: string
}

export interface PendingRegistration {
  id: string
  name: string
  phone: string
  clubName: string | null
  sportType: SportType | null
  city: string | null
  plainPassword: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface AuthorInfo {
  name?: string
  instagram?: string
  website?: string
  description?: string
  phone?: string
}

export interface DataBundle {
  users: User[]
  students: Student[]
  groups: Group[]
  transactions: Transaction[]
  tournaments: Tournament[]
  news: News[]
  tournamentRegistrations: Array<{ tournamentId: string; studentId: string }>
  authorInfo: AuthorInfo
  internalTournaments: InternalTournament[]
  attendance: Attendance[]
  materials: Material[]
  clubs: Club[]
  pendingRegistrations?: PendingRegistration[]
}

export interface LoginResponse {
  token: string
  userId: string
  role: Role
  studentId?: string
  user: User
  student?: Student
}

export interface AuthMeResponse {
  userId: string
  role: Role
  studentId: string | null
  user: User
  student?: Student
}

export interface ApiError {
  error: string
  errorType?: string
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  database: { status: string; responseTime?: number; message?: string }
  memory: { heapUsed: string; heapTotal: string; rss: string }
}
