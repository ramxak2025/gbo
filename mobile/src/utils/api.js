import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://iborcuha.ru/api';

async function getToken() {
  try {
    return await SecureStore.getItemAsync('iborcuha_token');
  } catch {
    return null;
  }
}

async function request(url, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  if (res.status === 401) {
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
  const ext = filename.split('.').pop();
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';
  formData.append('file', { uri, name: filename, type });
  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

export const api = {
  uploadFile,

  login: async (phone, password) => {
    const token = await getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST', headers, body: JSON.stringify({ phone, password }),
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

  addStudent: (data) => request('/data/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/data/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/data/students/${id}`, { method: 'DELETE' }),

  addGroup: (data) => request('/data/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (id, data) => request(`/data/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroup: (id) => request(`/data/groups/${id}`, { method: 'DELETE' }),

  addTransaction: (data) => request('/data/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/data/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/data/transactions/${id}`, { method: 'DELETE' }),

  addTournament: (data) => request('/data/tournaments', { method: 'POST', body: JSON.stringify(data) }),
  updateTournament: (id, data) => request(`/data/tournaments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTournament: (id) => request(`/data/tournaments/${id}`, { method: 'DELETE' }),

  registerTournament: (tournamentId, studentId) => request('/data/tournament-registrations', { method: 'POST', body: JSON.stringify({ tournamentId, studentId }) }),
  unregisterTournament: (tournamentId, studentId) => request('/data/tournament-registrations', { method: 'DELETE', body: JSON.stringify({ tournamentId, studentId }) }),

  addNews: (data) => request('/data/news', { method: 'POST', body: JSON.stringify(data) }),
  deleteNews: (id) => request(`/data/news/${id}`, { method: 'DELETE' }),

  addTrainer: (data) => request('/data/trainers', { method: 'POST', body: JSON.stringify(data) }),
  updateTrainer: (id, data) => request(`/data/trainers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrainer: (id) => request(`/data/trainers/${id}`, { method: 'DELETE' }),

  updateAuthor: (data) => request('/data/author', { method: 'PUT', body: JSON.stringify(data) }),

  addInternalTournament: (data) => request('/data/internal-tournaments', { method: 'POST', body: JSON.stringify(data) }),
  updateInternalTournament: (id, data) => request(`/data/internal-tournaments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInternalTournament: (id) => request(`/data/internal-tournaments/${id}`, { method: 'DELETE' }),

  saveAttendanceBulk: (data) => request('/data/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
  getQrToken: (groupId) => request(`/data/qr-token/${groupId}`),
  regenerateQrToken: (groupId) => request(`/data/qr-token/${groupId}/regenerate`, { method: 'POST' }),
  qrCheckin: (token) => request('/data/attendance/qr-checkin', { method: 'POST', body: JSON.stringify({ token }) }),
  getTrainerQrToken: () => request('/data/trainer-qr-token'),
  regenerateTrainerQrToken: () => request('/data/trainer-qr-token/regenerate', { method: 'POST' }),
  updateStudentGroups: (studentId, groupIds) => request(`/data/student-groups/${studentId}`, { method: 'PUT', body: JSON.stringify({ groupIds }) }),

  addMaterial: (data) => request('/data/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => request(`/data/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => request(`/data/materials/${id}`, { method: 'DELETE' }),

  addClub: (data) => request('/data/clubs', { method: 'POST', body: JSON.stringify(data) }),
  updateClub: (id, data) => request(`/data/clubs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClub: (id) => request(`/data/clubs/${id}`, { method: 'DELETE' }),
  assignTrainerToClub: (clubId, trainerId) => request(`/data/clubs/${clubId}/trainers`, { method: 'POST', body: JSON.stringify({ trainerId }) }),
  removeTrainerFromClub: (clubId, trainerId) => request(`/data/clubs/${clubId}/trainers/${trainerId}`, { method: 'DELETE' }),

  addParent: (data) => request('/data/parents', { method: 'POST', body: JSON.stringify(data) }),
  updateParent: (id, data) => request(`/data/parents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteParent: (id) => request(`/data/parents/${id}`, { method: 'DELETE' }),

  addBranch: (data) => request('/data/branches', { method: 'POST', body: JSON.stringify(data) }),
  updateBranch: (id, data) => request(`/data/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBranch: (id) => request(`/data/branches/${id}`, { method: 'DELETE' }),

  register: (data) => {
    const headers = { 'Content-Type': 'application/json' };
    return fetch(`${BASE_URL}/auth/register`, { method: 'POST', headers, body: JSON.stringify(data) })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Ошибка'); return d; });
  },
  approveRegistration: (id) => request(`/data/registrations/${id}/approve`, { method: 'POST' }),
  rejectRegistration: (id) => request(`/data/registrations/${id}/reject`, { method: 'POST' }),
};
