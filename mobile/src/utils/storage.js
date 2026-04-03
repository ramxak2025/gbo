import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'iborcuha_token';
const AUTH_KEY = 'iborcuha_auth';
const THEME_KEY = 'iborcuha_theme';

export const storage = {
  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {}
  },

  async removeToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {}
  },

  async getAuth() {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setAuth(auth) {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } catch {}
  },

  async removeAuth() {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch {}
  },

  async getTheme() {
    try {
      return await AsyncStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  },

  async setTheme(theme) {
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
    } catch {}
  },
};
