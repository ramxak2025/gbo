import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setLogoutCallback } from '../api/client';
import { storage } from '../utils/storage';

const AuthContext = createContext();

export function AuthProvider({ children, onAuth }) {
  // undefined = loading, null = not logged in, object = logged in
  const [auth, setAuth] = useState(undefined);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await storage.getAuth();
      const token = await storage.getToken();
      if (saved && token) {
        if (mounted) setAuth(saved);
        // Verify token in background
        try {
          const me = await api.me();
          if (mounted && me) {
            const updated = {
              ...saved,
              userId: me.id || saved.userId,
              role: me.role || saved.role,
              user: me,
            };
            setAuth(updated);
            await storage.setAuth(updated);
          }
        } catch {
          if (mounted) {
            setAuth(null);
            await storage.removeToken();
            await storage.removeAuth();
          }
        }
      } else {
        if (mounted) setAuth(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setLogoutCallback(() => setAuth(null));
  }, []);

  const login = useCallback(async (phone, password) => {
    const result = await api.login(phone, password);
    if (result.token) {
      await storage.setToken(result.token);
      const authData = {
        userId: result.userId,
        role: result.role,
        studentId: result.studentId,
        parentId: result.parentId,
        user: result.user,
        student: result.student,
        parent: result.parent,
      };
      setAuth(authData);
      await storage.setAuth(authData);
      if (onAuth) onAuth();
      return result;
    }
    throw new Error(result.error || 'Login failed');
  }, [onAuth]);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    await storage.removeToken();
    await storage.removeAuth();
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
