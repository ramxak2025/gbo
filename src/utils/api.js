const BASE = '/api'

async function request(url, options = {}) {
  const token = localStorage.getItem('iborcuha_token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${url}`, { ...options, headers, credentials: 'include' })
  if (res.status === 401) {
    localStorage.removeItem('iborcuha_token')
    localStorage.removeItem('iborcuha_auth')
    window.location.reload()
    throw new Error('Unauthorized')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера')
  return data
}

export const api = {
  // Auth
  login: (phone, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Data (full load)
  getData: () => request('/data'),

  // Students
  addStudent: (data) => request('/data/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/data/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/data/students/${id}`, { method: 'DELETE' }),

  // Groups
  addGroup: (data) => request('/data/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (id, data) => request(`/data/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroup: (id) => request(`/data/groups/${id}`, { method: 'DELETE' }),

  // Transactions
  addTransaction: (data) => request('/data/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/data/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/data/transactions/${id}`, { method: 'DELETE' }),

  // Tournaments
  addTournament: (data) => request('/data/tournaments', { method: 'POST', body: JSON.stringify(data) }),
  updateTournament: (id, data) => request(`/data/tournaments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTournament: (id) => request(`/data/tournaments/${id}`, { method: 'DELETE' }),

  // Tournament Registrations
  registerTournament: (tournamentId, studentId) => request('/data/tournament-registrations', { method: 'POST', body: JSON.stringify({ tournamentId, studentId }) }),
  unregisterTournament: (tournamentId, studentId) => request('/data/tournament-registrations', { method: 'DELETE', body: JSON.stringify({ tournamentId, studentId }) }),

  // News
  addNews: (data) => request('/data/news', { method: 'POST', body: JSON.stringify(data) }),
  deleteNews: (id) => request(`/data/news/${id}`, { method: 'DELETE' }),

  // Trainers
  addTrainer: (data) => request('/data/trainers', { method: 'POST', body: JSON.stringify(data) }),
  updateTrainer: (id, data) => request(`/data/trainers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrainer: (id) => request(`/data/trainers/${id}`, { method: 'DELETE' }),

  // Author
  updateAuthor: (data) => request('/data/author', { method: 'PUT', body: JSON.stringify(data) }),
}
