module.exports = {
  openURL: jest.fn(),
  createURL: jest.fn((path) => `exp://localhost/${path}`),
};
