import { API_BASE } from '../utils/constants';
import { storage } from '../utils/storage';

let logoutCallback = null;

export function setLogoutCallback(cb) {
  logoutCallback = cb;
}

async function request(url, options = {}) {
  const token = await storage.getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (res.status === 401) {
    await storage.removeToken();
    await storage.removeAuth();
    if (logoutCallback) logoutCallback();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export const api = {
  // Auth
  login: (phone, password) => request('/auth/login', {
    method: 'POST', body: JSON.stringify({ phone, password }),
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  register: (data) => request('/auth/register', {
    method: 'POST', body: JSON.stringify(data),
  }),

  // Data
  getData: () => request('/data'),

  // Students
  addStudent: (data) => request('/data/students', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateStudent: (id, data) => request(`/data/students/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteStudent: (id) => request(`/data/students/${id}`, { method: 'DELETE' }),

  // Groups
  addGroup: (data) => request('/data/groups', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateGroup: (id, data) => request(`/data/groups/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteGroup: (id) => request(`/data/groups/${id}`, { method: 'DELETE' }),

  // Transactions
  addTransaction: (data) => request('/data/transactions', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateTransaction: (id, data) => request(`/data/transactions/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteTransaction: (id) => request(`/data/transactions/${id}`, { method: 'DELETE' }),

  // Tournaments
  addTournament: (data) => request('/data/tournaments', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateTournament: (id, data) => request(`/data/tournaments/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteTournament: (id) => request(`/data/tournaments/${id}`, { method: 'DELETE' }),

  // Tournament registrations
  registerTournament: (tournamentId, studentId) => request('/data/tournament-registrations', {
    method: 'POST', body: JSON.stringify({ tournamentId, studentId }),
  }),
  unregisterTournament: (tournamentId, studentId) => request('/data/tournament-registrations', {
    method: 'DELETE', body: JSON.stringify({ tournamentId, studentId }),
  }),

  // News
  addNews: (data) => request('/data/news', {
    method: 'POST', body: JSON.stringify(data),
  }),
  deleteNews: (id) => request(`/data/news/${id}`, { method: 'DELETE' }),

  // Trainers
  addTrainer: (data) => request('/data/trainers', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateTrainer: (id, data) => request(`/data/trainers/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteTrainer: (id) => request(`/data/trainers/${id}`, { method: 'DELETE' }),

  // Author
  updateAuthor: (data) => request('/data/author', {
    method: 'PUT', body: JSON.stringify(data),
  }),

  // Internal tournaments
  addInternalTournament: (data) => request('/data/internal-tournaments', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateInternalTournament: (id, data) => request(`/data/internal-tournaments/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteInternalTournament: (id) => request(`/data/internal-tournaments/${id}`, { method: 'DELETE' }),

  // Attendance
  saveAttendanceBulk: (data) => request('/data/attendance/bulk', {
    method: 'POST', body: JSON.stringify(data),
  }),
  qrCheckin: (token) => request('/data/attendance/qr-checkin', {
    method: 'POST', body: JSON.stringify({ token }),
  }),

  // QR tokens
  getQrToken: (groupId) => request(`/data/qr-token/${groupId}`),
  regenerateQrToken: (groupId) => request(`/data/qr-token/${groupId}/regenerate`, { method: 'POST' }),
  getTrainerQrToken: () => request('/data/trainer-qr-token'),
  regenerateTrainerQrToken: () => request('/data/trainer-qr-token/regenerate', { method: 'POST' }),

  // Student groups
  updateStudentGroups: (studentId, groupIds) => request(`/data/student-groups/${studentId}`, {
    method: 'PUT', body: JSON.stringify({ groupIds }),
  }),

  // Materials
  addMaterial: (data) => request('/data/materials', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateMaterial: (id, data) => request(`/data/materials/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteMaterial: (id) => request(`/data/materials/${id}`, { method: 'DELETE' }),

  // Clubs
  addClub: (data) => request('/data/clubs', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateClub: (id, data) => request(`/data/clubs/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteClub: (id) => request(`/data/clubs/${id}`, { method: 'DELETE' }),
  assignTrainerToClub: (clubId, trainerId) => request(`/data/clubs/${clubId}/trainers`, {
    method: 'POST', body: JSON.stringify({ trainerId }),
  }),
  removeTrainerFromClub: (clubId, trainerId) => request(`/data/clubs/${clubId}/trainers/${trainerId}`, {
    method: 'DELETE',
  }),

  // Parents
  addParent: (data) => request('/data/parents', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateParent: (id, data) => request(`/data/parents/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteParent: (id) => request(`/data/parents/${id}`, { method: 'DELETE' }),

  // Branches
  addBranch: (data) => request('/data/branches', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateBranch: (id, data) => request(`/data/branches/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteBranch: (id) => request(`/data/branches/${id}`, { method: 'DELETE' }),

  // Registrations
  approveRegistration: (id) => request(`/data/registrations/${id}/approve`, { method: 'POST' }),
  rejectRegistration: (id) => request(`/data/registrations/${id}/reject`, { method: 'POST' }),

  // File upload
  uploadFile: async (uri, filename) => {
    const formData = new FormData();
    formData.append('file', { uri, name: filename || 'upload.jpg', type: 'image/jpeg' });
    return request('/upload', { method: 'POST', body: formData });
  },

  // Notifications
  getNotificationSettings: () => request('/push/settings'),
  updateNotificationSettings: (data) => request('/push/settings', {
    method: 'PUT', body: JSON.stringify(data),
  }),
};
