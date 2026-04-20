/**
 * iBorcuha mobile — Auth store (Zustand)
 *
 * Single source of truth for auth state. Hydrated from SecureStore on app start.
 * Existing AuthContext (JS) delegates here via bridge in App.
 */
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { api, setToken as setApiToken, getToken } from '../lib/apiClient'

const USER_KEY = 'iborcuha_user'
const STUDENT_KEY = 'iborcuha_student'
const ROLE_KEY = 'iborcuha_role'

export interface AuthUser {
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

export interface AuthStudent {
  id: string
  name: string
  phone: string
  belt?: string | null
  weight?: number | null
  status?: string | null
  groupId?: string | null
  subscriptionExpiresAt?: string | null
}

export type AuthState = {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  role: 'superadmin' | 'trainer' | 'student' | null
  user: AuthUser | null
  student: AuthStudent | null
  studentId: string | null

  hydrate: () => Promise<void>
  login: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (patch: Partial<AuthUser>) => void
}

async function persist(user: AuthUser | null, student: AuthStudent | null, role: string | null) {
  if (user) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
  else await SecureStore.deleteItemAsync(USER_KEY).catch(() => undefined)
  if (student) await SecureStore.setItemAsync(STUDENT_KEY, JSON.stringify(student))
  else await SecureStore.deleteItemAsync(STUDENT_KEY).catch(() => undefined)
  if (role) await SecureStore.setItemAsync(ROLE_KEY, role)
  else await SecureStore.deleteItemAsync(ROLE_KEY).catch(() => undefined)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  role: null,
  user: null,
  student: null,
  studentId: null,

  async hydrate() {
    try {
      const token = await getToken()
      if (!token) {
        set({ status: 'unauthenticated' })
        return
      }
      const [userRaw, studentRaw, role] = await Promise.all([
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(STUDENT_KEY),
        SecureStore.getItemAsync(ROLE_KEY),
      ])
      const user: AuthUser | null = userRaw ? JSON.parse(userRaw) : null
      const student: AuthStudent | null = studentRaw ? JSON.parse(studentRaw) : null

      if (user) {
        set({
          status: 'authenticated',
          user,
          student,
          role: (role as AuthState['role']) ?? user.role,
          studentId: student?.id ?? null,
        })
      } else {
        // We have a token but no user — fetch /me to restore
        try {
          const me = (await api.me()) as {
            user?: AuthUser
            student?: AuthStudent
            role?: string
            studentId?: string | null
          } | null
          if (me?.user) {
            set({
              status: 'authenticated',
              user: me.user,
              student: me.student ?? null,
              role: (me.role as AuthState['role']) ?? me.user.role,
              studentId: me.studentId ?? null,
            })
            await persist(me.user, me.student ?? null, (me.role as string) ?? me.user.role)
          } else {
            await setApiToken(null)
            set({ status: 'unauthenticated' })
          }
        } catch {
          await setApiToken(null)
          set({ status: 'unauthenticated' })
        }
      }
    } catch {
      set({ status: 'unauthenticated' })
    }
  },

  async login(phone, password) {
    const res = (await api.login(phone, password)) as {
      token: string
      user: AuthUser
      role: AuthUser['role']
      student?: AuthStudent
      studentId?: string
    }
    await setApiToken(res.token)
    await persist(res.user, res.student ?? null, res.role)
    set({
      status: 'authenticated',
      user: res.user,
      student: res.student ?? null,
      role: res.role,
      studentId: res.studentId ?? null,
    })
  },

  async logout() {
    try { await api.logout() } catch { /* ignore */ }
    await setApiToken(null)
    await persist(null, null, null)
    set({ status: 'unauthenticated', user: null, student: null, role: null, studentId: null })
  },

  updateUser(patch) {
    const { user } = get()
    if (!user) return
    const next = { ...user, ...patch }
    set({ user: next })
    persist(next, get().student, get().role).catch(() => undefined)
  },
}))
