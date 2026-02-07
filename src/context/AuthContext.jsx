import { createContext, useContext, useState, useCallback } from 'react'
import { loadAuth, saveAuth } from '../utils/storage'

const AuthContext = createContext()

export function AuthProvider({ children, data }) {
  const [auth, setAuth] = useState(() => {
    const saved = loadAuth()
    if (!saved) return null
    // validate user still exists
    const user = data.users.find(u => u.id === saved.userId)
    if (!user) { saveAuth(null); return null }
    if (saved.role === 'student') {
      const student = data.students.find(s => s.id === saved.studentId)
      if (!student) { saveAuth(null); return null }
      return { ...saved, user, student }
    }
    return { ...saved, user }
  })

  const login = useCallback((userId, role, studentId = null) => {
    const user = data.users.find(u => u.id === userId)
    const student = studentId ? data.students.find(s => s.id === studentId) : null
    const payload = { userId, role, studentId }
    saveAuth(payload)
    setAuth({ ...payload, user, student })
  }, [data])

  const logout = useCallback(() => {
    saveAuth(null)
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
