// Mock expo-secure-store before importing api
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve('test-token')),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { api } = require('../src/utils/api');

describe('API Client', () => {
  beforeEach(() => {
    global.fetch.mockClear();
  });

  test('api object has all required methods', () => {
    const requiredMethods = [
      'login', 'logout', 'me', 'getData',
      'addStudent', 'updateStudent', 'deleteStudent',
      'addGroup', 'updateGroup', 'deleteGroup',
      'addTransaction', 'updateTransaction', 'deleteTransaction',
      'addTournament', 'updateTournament', 'deleteTournament',
      'addNews', 'deleteNews',
      'addTrainer', 'updateTrainer', 'deleteTrainer',
      'addInternalTournament', 'updateInternalTournament', 'deleteInternalTournament',
      'saveAttendanceBulk', 'qrCheckin',
      'addMaterial', 'updateMaterial', 'deleteMaterial',
      'addClub', 'updateClub', 'deleteClub',
      'assignTrainerToClub', 'removeTrainerFromClub',
      'addParent', 'updateParent', 'deleteParent',
      'addBranch', 'updateBranch', 'deleteBranch',
      'approveRegistration', 'rejectRegistration',
      'register', 'uploadFile',
    ];
    for (const method of requiredMethods) {
      expect(typeof api[method]).toBe('function');
    }
  });

  test('login sends POST request with phone and password', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'test-token', userId: '1', role: 'trainer' }),
    });

    await api.login('89999999999', 'demo123');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://iborcuha.ru/api/auth/login');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ phone: '89999999999', password: 'demo123' });
  });

  test('login throws error on failed response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    });

    await expect(api.login('89999999999', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  test('getData calls correct endpoint', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ users: [], students: [], groups: [] }),
    });

    await api.getData();
    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe('https://iborcuha.ru/api/data');
  });

  test('addStudent sends POST to correct endpoint', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123', name: 'Test' }),
    });

    await api.addStudent({ name: 'Test', phone: '89990000001' });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://iborcuha.ru/api/data/students');
    expect(options.method).toBe('POST');
  });

  test('deleteStudent sends DELETE to correct endpoint', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await api.deleteStudent('123');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://iborcuha.ru/api/data/students/123');
    expect(options.method).toBe('DELETE');
  });

  test('approveRegistration sends POST', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await api.approveRegistration('reg-1');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://iborcuha.ru/api/data/registrations/reg-1/approve');
    expect(options.method).toBe('POST');
  });

  test('rejectRegistration sends POST', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await api.rejectRegistration('reg-2');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://iborcuha.ru/api/data/registrations/reg-2/reject');
    expect(options.method).toBe('POST');
  });

  test('request includes auth token in headers', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await api.getData();
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer test-token');
  });

  test('handles 401 by clearing stored tokens', async () => {
    const SecureStore = require('expo-secure-store');
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    await expect(api.getData()).rejects.toThrow('Unauthorized');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('iborcuha_token');
  });
});
