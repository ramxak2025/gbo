import * as SecureStore from 'expo-secure-store';

// Simple async storage wrapper using SecureStore for small values
const AsyncStorage = {
  async getItem(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  async removeItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

export default AsyncStorage;
