// Small wrapper around fetch() that talks to the Spring Boot REST API.
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const TOKEN_KEY = 'smartdesk_token';
const USER_KEY = 'smartdesk_user';

export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields || null;
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function saveSession(token, user) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* storage unavailable */ }
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(window.localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Cannot reach the server at ${API_URL}. Is the backend running?`);
  }

  if (res.status === 401 && token) {
    // token expired or invalid → log out
    clearSession();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login?expired=1';
    }
  }

  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, (data && data.message) || `Request failed (${res.status})`, data && data.fields);
  }
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { message: text }; }
}

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const api = {
  // auth
  login: (email, password) => request('POST', '/api/auth/login', { email, password }),
  register: (data) => request('POST', '/api/auth/register', data),
  me: () => request('GET', '/api/auth/me'),
  updateProfile: (data) => request('PUT', '/api/auth/me', data),
  changePassword: (currentPassword, newPassword) =>
    request('PUT', '/api/auth/me/password', { currentPassword, newPassword }),

  // tickets
  listTickets: (filters) => request('GET', `/api/tickets${qs(filters)}`),
  getTicket: (id) => request('GET', `/api/tickets/${id}`),
  createTicket: (data) => request('POST', '/api/tickets', data),
  updateTicket: (id, data) => request('PUT', `/api/tickets/${id}`, data),
  assignTicket: (id, technicianId) => request('PUT', `/api/tickets/${id}/assign`, { technicianId }),
  updateStatus: (id, status, resolution) => request('PUT', `/api/tickets/${id}/status`, { status, resolution }),
  updatePriority: (id, priority) => request('PUT', `/api/tickets/${id}/priority`, { priority }),
  deleteTicket: (id) => request('DELETE', `/api/tickets/${id}`),
  comments: (id) => request('GET', `/api/tickets/${id}/comments`),
  addComment: (id, body, internal) => request('POST', `/api/tickets/${id}/comments`, { body, internal }),
  history: (id) => request('GET', `/api/tickets/${id}/history`),

  // categories
  categories: () => request('GET', '/api/categories'),
  createCategory: (data) => request('POST', '/api/categories', data),
  updateCategory: (id, data) => request('PUT', `/api/categories/${id}`, data),
  deleteCategory: (id) => request('DELETE', `/api/categories/${id}`),

  // users (admin)
  users: () => request('GET', '/api/users'),
  technicians: () => request('GET', '/api/users/technicians'),
  createUser: (data) => request('POST', '/api/users', data),
  updateUser: (id, data) => request('PUT', `/api/users/${id}`, data),
  resetPassword: (id, password) => request('PUT', `/api/users/${id}/password`, { password }),
  deleteUser: (id) => request('DELETE', `/api/users/${id}`),

  // admin statistics
  stats: () => request('GET', '/api/stats'),
};
