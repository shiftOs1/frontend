import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
});

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle 401 + token refresh ─────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth endpoints ─────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; timezone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// ── Shift endpoints ───────────────────────────────────────────────────────────
export const shiftApi = {
  getAll: (params?: Record<string, string>) => api.get('/shifts', { params }),
  getMy: (params?: Record<string, string>) => api.get('/shifts/my', { params }),
  getById: (id: string) => api.get(`/shifts/${id}`),
  create: (data: unknown) => api.post('/shifts', data),
  createRecurring: (data: unknown) => api.post('/shifts/recurring', data),
  update: (id: string, data: unknown) => api.patch(`/shifts/${id}`, data),
  delete: (id: string) => api.delete(`/shifts/${id}`),
  assign: (id: string, userId: string) => api.post(`/shifts/${id}/assign`, { userId }),
  unassign: (id: string) => api.post(`/shifts/${id}/unassign`),
};

// ── Availability endpoints ────────────────────────────────────────────────────
export const availabilityApi = {
  getMy: () => api.get('/availability'),
  getAll: () => api.get('/availability/all'),
  add: (data: unknown) => api.post('/availability', data),
  update: (id: string, data: unknown) => api.patch(`/availability/${id}`, data),
  delete: (id: string) => api.delete(`/availability/${id}`),
  respond: (id: string, status: string, adminComment?: string) =>
    api.patch(`/availability/${id}/respond`, { status, adminComment }),
};

// ── Work session endpoints ────────────────────────────────────────────────────
export const sessionApi = {
  clockIn: (shiftId?: string) => api.post('/sessions/clock-in', { shiftId }),
  clockOut: (breakMinutes?: number) => api.post('/sessions/clock-out', { breakMinutes }),
  getMy: (params?: Record<string, string>) => api.get('/sessions/my', { params }),
  getAll: (params?: Record<string, string>) => api.get('/sessions', { params }),
  getActive: () => api.get('/sessions/active'),
  approve: (id: string, comment?: string) => api.patch(`/sessions/${id}/approve`, { comment }),
  reject: (id: string, comment: string) => api.patch(`/sessions/${id}/reject`, { comment }),
};

// ── Exchange endpoints ────────────────────────────────────────────────────────
export const exchangeApi = {
  getMy: () => api.get('/exchanges'),
  request: (data: unknown) => api.post('/exchanges', data),
  respond: (id: string, response: 'accepted' | 'rejected') =>
    api.patch(`/exchanges/${id}/respond`, { response }),
  approve: (id: string, status: string, adminComment?: string) =>
    api.patch(`/exchanges/${id}/approve`, { status, adminComment }),
};

// ── Leave endpoints ───────────────────────────────────────────────────────────
export const leaveApi = {
  getMy: () => api.get('/leaves'),
  getAll: () => api.get('/leaves/all'),
  request: (data: unknown) => api.post('/leaves', data),
  respond: (id: string, status: string, adminComment?: string) =>
    api.patch(`/leaves/${id}/respond`, { status, adminComment }),
};

// ── Notification endpoints ────────────────────────────────────────────────────
export const notificationApi = {
  getMy: (params?: Record<string, string>) => api.get('/notifications', { params }),
  markAllRead: () => api.patch('/notifications/read-all'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

// ── Analytics endpoints ───────────────────────────────────────────────────────
export const analyticsApi = {
  getSummary: () => api.get('/analytics/summary'),
  getHours: (params?: Record<string, string>) => api.get('/analytics/hours', { params }),
  getUsers: (params?: Record<string, string>) => api.get('/analytics/users', { params }),
  getAttendance: (params?: Record<string, string>) => api.get('/analytics/attendance', { params }),
  getShiftStats: (params?: Record<string, string>) => api.get('/analytics/shifts', { params }),
  getMyStats: () => api.get('/analytics/me'),
};