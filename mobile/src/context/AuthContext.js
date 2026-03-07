import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children, onAuth }) {
  const [auth, setAuth] = useState(undefined);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('iborcuha_auth');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAuth(parsed);
          try {
            const me = await api.me();
            if (me) {
              setAuth(me);
              await AsyncStorage.setItem('iborcuha_auth', JSON.stringify(me));
            } else {
              setAuth(null);
              await AsyncStorage.removeItem('iborcuha_auth');
              await AsyncStorage.removeItem('iborcuha_token');
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
    await AsyncStorage.setItem('iborcuha_token', result.token);
    const authData = {
      userId: result.userId,
      role: result.role,
      studentId: result.studentId || null,
      user: result.user,
      student: result.student || null,
    };
    await AsyncStorage.setItem('iborcuha_auth', JSON.stringify(authData));
    setAuth(authData);
    if (onAuth) onAuth();
    return result;
  }, [onAuth]);

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
