import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children, onAuth }) {
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
            if (me) {
              setAuth(me);
              await SecureStore.setItemAsync('iborcuha_auth', JSON.stringify(me));
            } else {
              setAuth(null);
              await SecureStore.deleteItemAsync('iborcuha_auth');
              await SecureStore.deleteItemAsync('iborcuha_token');
            }
          } catch {}
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
    await SecureStore.setItemAsync('iborcuha_token', result.token);
    const authData = {
      userId: result.userId,
      role: result.role,
      studentId: result.studentId || null,
      user: result.user,
      student: result.student || null,
    };
    await SecureStore.setItemAsync('iborcuha_auth', JSON.stringify(authData));
    setAuth(authData);
    if (onAuth) onAuth();
    return result;
  }, [onAuth]);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    await SecureStore.deleteItemAsync('iborcuha_auth');
    await SecureStore.deleteItemAsync('iborcuha_token');
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
