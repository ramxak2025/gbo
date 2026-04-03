jest.mock('expo-secure-store', () => {
  const store = {};
  return {
    getItemAsync: jest.fn((key) => Promise.resolve(store[key] || null)),
    setItemAsync: jest.fn((key, value) => { store[key] = value; return Promise.resolve(); }),
    deleteItemAsync: jest.fn((key) => { delete store[key]; return Promise.resolve(); }),
  };
});

const AsyncStorage = require('../src/utils/asyncStorage').default;

describe('AsyncStorage wrapper', () => {
  test('getItem returns null for missing key', async () => {
    const result = await AsyncStorage.getItem('nonexistent');
    expect(result).toBeNull();
  });

  test('setItem and getItem work together', async () => {
    await AsyncStorage.setItem('test-key', 'test-value');
    const result = await AsyncStorage.getItem('test-key');
    expect(result).toBe('test-value');
  });

  test('removeItem deletes stored value', async () => {
    await AsyncStorage.setItem('remove-key', 'value');
    await AsyncStorage.removeItem('remove-key');
    const result = await AsyncStorage.getItem('remove-key');
    expect(result).toBeNull();
  });
});
