import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../utils/api';
import AsyncStorage from '../utils/asyncStorage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(undefined); // undefined = loading

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('iborcuha_auth');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAuth(parsed);
          api.me().then(me => {
            if (me) {
              const normalized = {
                userId: me.userId || me.id,
                role: me.role,
                studentId: me.studentId || null,
                parentId: me.parentId || null,
                user: me.user || me,
                student: me.student || null,
                parent: me.parent || null,
              };
              setAuth(normalized);
              AsyncStorage.setItem('iborcuha_auth', JSON.stringify(normalized));
            } else {
              setAuth(null);
              AsyncStorage.removeItem('iborcuha_auth');
              AsyncStorage.removeItem('iborcuha_token');
            }
          }).catch(() => {});
        } catch {
          setAuth(null);
        }
      } else {
        setAuth(null);
      }
    })();
  }, []);

  const login = useCallback(async (phone, password) => {
    const result = await api.login(phone, password);
    await AsyncStorage.setItem('iborcuha_token', result.token);
    const authData = {
      userId: result.userId,
      role: result.role,
      studentId: result.studentId || null,
      parentId: result.parentId || null,
      user: result.user,
      student: result.student || null,
      parent: result.parent || null,
    };
    await AsyncStorage.setItem('iborcuha_auth', JSON.stringify(authData));
    setAuth(authData);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    await AsyncStorage.removeItem('iborcuha_auth');
    await AsyncStorage.removeItem('iborcuha_token');
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
