import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext()

export function AuthProvider({ children, onAuth }) {
  const [auth, setAuth] = useState(undefined) // undefined = loading, null = not logged in

  useEffect(() => {
    const saved = localStorage.getItem('iborcuha_auth')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setAuth(parsed)
        // Verify token is still valid in background
        api.me().then(me => {
          if (me) {
            setAuth(me)
            localStorage.setItem('iborcuha_auth', JSON.stringify(me))
          } else {
            setAuth(null)
            localStorage.removeItem('iborcuha_auth')
            localStorage.removeItem('iborcuha_token')
          }
        }).catch(() => {})
      } catch {
        setAuth(null)
      }
    } else {
      setAuth(null)
    }
  }, [])

  const login = useCallback(async (phone, password) => {
    const result = await api.login(phone, password)
    localStorage.setItem('iborcuha_token', result.token)
    const authData = {
      userId: result.userId,
      role: result.role,
      studentId: result.studentId || null,
      parentId: result.parentId || null,
      user: result.user,
      student: result.student || null,
      parent: result.parent || null,
    }
    localStorage.setItem('iborcuha_auth', JSON.stringify(authData))
    setAuth(authData)
    if (onAuth) onAuth()
    return result
  }, [onAuth])

  const logout = useCallback(async () => {
    try { await api.logout() } catch {}
    localStorage.removeItem('iborcuha_auth')
    localStorage.removeItem('iborcuha_token')
    setAuth(null)
    // Notify Flutter native app about logout
    if (window.__flutterNative?.logout) {
      window.__flutterNative.logout()
    }
  }, [])

  // Show nothing while checking auth
  if (auth === undefined) {
    return null
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
