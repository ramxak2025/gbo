module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.js'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-secure-store|expo-modules-core|@expo/vector-icons|react-native)/)',
  ],
  moduleNameMapper: {
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
