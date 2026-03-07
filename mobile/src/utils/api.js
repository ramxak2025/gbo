import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Change this to your server's URL
const BASE_URL = 'https://iborcuha.ru';
const API = `${BASE_URL}/api`;

async function request(url, options = {}) {
  const token = await AsyncStorage.getItem('iborcuha_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${url}`, { ...options, headers });
  if (res.status === 401) {
    await AsyncStorage.removeItem('iborcuha_token');
    await AsyncStorage.removeItem('iborcuha_auth');
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Server error');
  return data;
}

async function uploadFile(uri) {
  const token = await AsyncStorage.getItem('iborcuha_token');
  const formData = new FormData();
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('file', { uri, name: filename, type });

  const res = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  // Return full URL for images
  return data.url.startsWith('http') ? data.url : `${BASE_URL}${data.url}`;
}

export function getFullUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

export const api = {
  uploadFile,

  login: async (phone, password) => {
    const token = await AsyncStorage.getItem('iborcuha_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers, body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Login error');
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

  addMaterial: (data) => request('/data/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => request(`/data/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => request(`/data/materials/${id}`, { method: 'DELETE' }),

  addClub: (data) => request('/data/clubs', { method: 'POST', body: JSON.stringify(data) }),
  updateClub: (id, data) => request(`/data/clubs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClub: (id) => request(`/data/clubs/${id}`, { method: 'DELETE' }),
  assignTrainerToClub: (clubId, trainerId) => request(`/data/clubs/${clubId}/trainers`, { method: 'POST', body: JSON.stringify({ trainerId }) }),
  removeTrainerFromClub: (clubId, trainerId) => request(`/data/clubs/${clubId}/trainers/${trainerId}`, { method: 'DELETE' }),

  register: (data) => {
    const headers = { 'Content-Type': 'application/json' };
    return fetch(`${API}/auth/register`, { method: 'POST', headers, body: JSON.stringify(data) })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Error'); return d; });
  },
  approveRegistration: (id) => request(`/data/registrations/${id}/approve`, { method: 'POST' }),
  rejectRegistration: (id) => request(`/data/registrations/${id}/reject`, { method: 'POST' }),
};
