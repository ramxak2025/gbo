import * as SecureStore from 'expo-secure-store';

// Change this to your server URL
const BASE = 'https://iborcuha.ru/api';

async function getToken() {
  try {
    return await SecureStore.getItemAsync('iborcuha_token');
  } catch {
    return null;
  }
}

// Single-flight refresh (shared with TanStack Query client in ../lib/apiClient.ts)
let refreshPromise = null;
async function tryRefresh() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const current = await getToken();
    if (!current) return null;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${current}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.token) {
        await SecureStore.setItemAsync('iborcuha_token', data.token);
        return data.token;
      }
      return null;
    } catch { return null; }
    finally { setTimeout(() => { refreshPromise = null; }, 0); }
  })();
  return refreshPromise;
}

async function request(url, options = {}, retry = true) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await tryRefresh();
    if (newToken) return request(url, options, false);
    await SecureStore.deleteItemAsync('iborcuha_token');
    await SecureStore.deleteItemAsync('iborcuha_auth');
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

async function uploadFile(uri) {
  const token = await getToken();
  const formData = new FormData();
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('file', { uri, name: filename, type });

  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

export function getFullUrl(path) {
  return 'https://iborcuha.ru' + (path?.startsWith('/') ? path : '/' + path);
}

export const api = {
  uploadFile,
  login: async (phone, password) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Ошибка входа');
      err.errorType = data.errorType || null;
      throw err;
    }
    return data;
  },
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  getData: () => request('/data'),
  addStudent: (d) => request('/data/students', { method: 'POST', body: JSON.stringify(d) }),
  updateStudent: (id, d) => request(`/data/students/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteStudent: (id) => request(`/data/students/${id}`, { method: 'DELETE' }),
  addGroup: (d) => request('/data/groups', { method: 'POST', body: JSON.stringify(d) }),
  updateGroup: (id, d) => request(`/data/groups/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteGroup: (id) => request(`/data/groups/${id}`, { method: 'DELETE' }),
  addTransaction: (d) => request('/data/transactions', { method: 'POST', body: JSON.stringify(d) }),
  updateTransaction: (id, d) => request(`/data/transactions/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteTransaction: (id) => request(`/data/transactions/${id}`, { method: 'DELETE' }),
  addTournament: (d) => request('/data/tournaments', { method: 'POST', body: JSON.stringify(d) }),
  updateTournament: (id, d) => request(`/data/tournaments/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteTournament: (id) => request(`/data/tournaments/${id}`, { method: 'DELETE' }),
  registerTournament: (tId, sId) => request('/data/tournament-registrations', { method: 'POST', body: JSON.stringify({ tournamentId: tId, studentId: sId }) }),
  unregisterTournament: (tId, sId) => request('/data/tournament-registrations', { method: 'DELETE', body: JSON.stringify({ tournamentId: tId, studentId: sId }) }),
  addNews: (d) => request('/data/news', { method: 'POST', body: JSON.stringify(d) }),
  deleteNews: (id) => request(`/data/news/${id}`, { method: 'DELETE' }),
  addTrainer: (d) => request('/data/trainers', { method: 'POST', body: JSON.stringify(d) }),
  updateTrainer: (id, d) => request(`/data/trainers/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteTrainer: (id) => request(`/data/trainers/${id}`, { method: 'DELETE' }),
  updateAuthor: (d) => request('/data/author', { method: 'PUT', body: JSON.stringify(d) }),
  addInternalTournament: (d) => request('/data/internal-tournaments', { method: 'POST', body: JSON.stringify(d) }),
  updateInternalTournament: (id, d) => request(`/data/internal-tournaments/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteInternalTournament: (id) => request(`/data/internal-tournaments/${id}`, { method: 'DELETE' }),
  saveAttendanceBulk: (d) => request('/data/attendance/bulk', { method: 'POST', body: JSON.stringify(d) }),
  saveAttendance: (d) => request('/data/attendance', { method: 'POST', body: JSON.stringify(d) }),
  deleteAttendance: (d) => request('/data/attendance', { method: 'DELETE', body: JSON.stringify(d) }),
  registerPushToken: (token, platform) => request('/push/register-token', { method: 'POST', body: JSON.stringify({ token, platform }) }),
  unregisterPushToken: (token) => request('/push/unregister-token', { method: 'POST', body: JSON.stringify({ token }) }),
  addMaterial: (d) => request('/data/materials', { method: 'POST', body: JSON.stringify(d) }),
  updateMaterial: (id, d) => request(`/data/materials/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteMaterial: (id) => request(`/data/materials/${id}`, { method: 'DELETE' }),
  addClub: (d) => request('/data/clubs', { method: 'POST', body: JSON.stringify(d) }),
  updateClub: (id, d) => request(`/data/clubs/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteClub: (id) => request(`/data/clubs/${id}`, { method: 'DELETE' }),
  assignTrainerToClub: (cId, tId) => request(`/data/clubs/${cId}/trainers`, { method: 'POST', body: JSON.stringify({ trainerId: tId }) }),
  removeTrainerFromClub: (cId, tId) => request(`/data/clubs/${cId}/trainers/${tId}`, { method: 'DELETE' }),
  approveRegistration: (id) => request(`/data/registrations/${id}/approve`, { method: 'POST' }),
  rejectRegistration: (id) => request(`/data/registrations/${id}/reject`, { method: 'POST' }),
  register: (d) => fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Ошибка'); return data; }),
};
