/**
 * iBorcuha mobile — Data hooks (TanStack Query)
 *
 * Загружают /api/data снапшот и публикуют типизированные срезы.
 * Все мутации инвалидируют `['data']` один раз — ответ сервера возвращает
 * актуальный список после каждого изменения.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

// Типы структур данных — зеркалируют shared/api-types/index.d.ts
// (в mobile локальная копия, чтобы не требовать ts-path `@shared` для корневых импортов)

export interface User {
  id: string
  name: string
  phone: string
  role: 'superadmin' | 'trainer' | 'student'
  avatar: string | null
  clubName: string | null
  clubId: string | null
  isHeadTrainer: boolean
  sportType: string | null
  sportTypes: string[]
  city: string | null
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
  status: 'sick' | 'injury' | 'skip' | null
  trainingStartDate: string | null
  createdAt: string
}

export interface Group {
  id: string
  trainerId: string
  name: string
  schedule: string
  subscriptionCost: number
  attendanceEnabled: boolean
  sportType: string | null
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

export interface Club {
  id: string
  name: string
  city: string
  sportTypes: string[]
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
  sportType: string | null
  coverImage: string | null
  createdAt: string
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

export interface News {
  id: string
  trainerId: string
  groupId: string | null
  title: string
  content: string
  date: string
}

export interface DataBundle {
  users: User[]
  students: Student[]
  groups: Group[]
  transactions: Transaction[]
  tournaments: Tournament[]
  news: News[]
  tournamentRegistrations: Array<{ tournamentId: string; studentId: string }>
  authorInfo: {
    name?: string
    instagram?: string
    website?: string
    description?: string
    phone?: string
  }
  internalTournaments: InternalTournament[]
  attendance: Attendance[]
  materials: Material[]
  clubs: Club[]
}

const EMPTY_BUNDLE: DataBundle = {
  users: [], students: [], groups: [], transactions: [],
  tournaments: [], news: [], tournamentRegistrations: [],
  authorInfo: {}, internalTournaments: [], attendance: [],
  materials: [], clubs: [],
}

export const DATA_QUERY_KEY = ['data'] as const

export function useDataBundle() {
  return useQuery<DataBundle>({
    queryKey: DATA_QUERY_KEY,
    queryFn: () => api.get<DataBundle>('/data'),
    initialData: EMPTY_BUNDLE,
  })
}

// ---------- Students ----------
export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<Student> & { password?: string }) =>
      api.post<Student>('/data/students', input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: DATA_QUERY_KEY }) },
  })
}

export function useUpdateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Student> & { password?: string } }) =>
      api.put<Student>(`/data/students/${id}`, patch),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: DATA_QUERY_KEY }) },
  })
}

export function useDeleteStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: true }>(`/data/students/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: DATA_QUERY_KEY }) },
  })
}

// ---------- Attendance ----------
export function useMarkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { groupId: string; studentId: string; date: string; present: boolean }) =>
      api.post<Attendance>('/data/attendance', input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: DATA_QUERY_KEY }) },
  })
}

export function useBulkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { groupId: string; date: string; records: Array<{ studentId: string; present: boolean }> }) =>
      api.post<{ ok: true }>('/data/attendance/bulk', input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: DATA_QUERY_KEY }) },
  })
}

// ---------- Transactions ----------
export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<Transaction>) => api.post<Transaction>('/data/transactions', input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: DATA_QUERY_KEY }) },
  })
}

// ---------- Tournaments ----------
export function useTournamentRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { tournamentId: string; studentId: string }) =>
      api.post<{ ok: true }>('/data/tournament-registrations', input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: DATA_QUERY_KEY }) },
  })
}

export function useTournamentUnregister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { tournamentId: string; studentId: string }) =>
      api.del<{ ok: true }>('/data/tournament-registrations', input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: DATA_QUERY_KEY }) },
  })
}
