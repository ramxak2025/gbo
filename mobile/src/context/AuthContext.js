import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { api } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(undefined);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('iborcuha_auth');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAuth(parsed);
          try {
            const me = await api.me();
            if (me?.user) {
              const authData = { userId: me.user.id || me.userId, role: me.user.role || me.role, studentId: me.studentId || null, user: me.user, student: me.student || null };
              setAuth(authData);
              await SecureStore.setItemAsync('iborcuha_auth', JSON.stringify(authData)).catch(() => {});
            }
          } catch {
            // keep cached
          }
        } else {
          setAuth(null);
        }
      } catch {
        setAuth(null);
      }
    })();
  }, []);

  const login = useCallback(async (phone, password) => {
    const result = await api.login(phone, password);
    if (!result || !result.token) {
      throw new Error('Сервер не вернул данные');
    }
    try {
      await SecureStore.setItemAsync('iborcuha_token', result.token);
    } catch (e) {
      console.warn('SecureStore save token failed:', e);
    }
    const authData = {
      userId: result.userId,
      role: result.role,
      studentId: result.studentId || null,
      user: result.user,
      student: result.student || null,
    };
    try {
      await SecureStore.setItemAsync('iborcuha_auth', JSON.stringify(authData));
    } catch (e) {
      console.warn('SecureStore save auth failed:', e);
    }
    setAuth(authData);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    try { await SecureStore.deleteItemAsync('iborcuha_auth'); } catch {}
    try { await SecureStore.deleteItemAsync('iborcuha_token'); } catch {}
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
