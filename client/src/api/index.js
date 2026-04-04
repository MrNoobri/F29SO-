import api from "./axios";

// Auth APIs
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  setPassword: (data) => api.post("/auth/set-password", data),
  updatePreferences: (data) => api.patch("/auth/preferences", data),
  getCurrentUser: () => api.get("/auth/me"),
  refreshToken: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  getProviders: () => api.get("/auth/providers"),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, data) =>
    api.post(`/auth/reset-password/${token}`, data),
  updateProfile: (data) => api.patch("/auth/profile", data),
  changePassword: (data) => api.patch("/auth/change-password", data),
  deleteAccount: () => api.delete("/auth/account"),
};

// Health Metrics APIs
export const healthMetricsAPI = {
  create: (data) => api.post("/health-metrics", data),
  getAll: (params) => api.get("/health-metrics", { params }),
  getByUser: (userId, params) =>
    api.get(`/health-metrics/user/${userId}`, { params }),
  getLatest: (userId) =>
    api.get(`/health-metrics/latest${userId ? `/${userId}` : ""}`),
  getDailyTotals: (userId) =>
    api.get(`/health-metrics/daily-totals${userId ? `/${userId}` : ""}`),
  getStats: (params) => api.get("/health-metrics/stats", { params }),
  getAIInsights: () => api.get("/health-metrics/insights"),
  delete: (id) => api.delete(`/health-metrics/${id}`),
};

// Appointments APIs
export const appointmentsAPI = {
  create: (data) => api.post("/appointments", data),
  getAll: (params) => api.get("/appointments", { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  update: (id, data) => api.patch(`/appointments/${id}`, data),
  cancel: (id, reason) => api.post(`/appointments/${id}/cancel`, { reason }),
  getProviderAvailability: (providerId, date) =>
    api.get(`/appointments/availability/${providerId}`, { params: { date } }),
  getProviderPatients: () => api.get("/appointments/provider/patients"),
};

// Alerts APIs
export const alertsAPI = {
  getAll: (params) => api.get("/alerts", { params }),
  getUnreadCount: () => api.get("/alerts/unread-count"),
  markAsRead: (id) => api.patch(`/alerts/${id}/read`),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// Messages APIs
export const messagesAPI = {
  send: (data) => api.post("/messages", data),
  getConversations: () => api.get("/messages/conversations"),
  getAll: (params) => api.get("/messages", { params }),
  getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
  getUnreadCount: () => api.get("/messages/unread-count"),
  delete: (id) => api.delete(`/messages/${id}`),
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/messages/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Chatbot APIs
export const chatbotAPI = {
  sendMessage: (data) => {
    const body = typeof data === "string" ? { message: data } : data;
    return api.post("/chatbot/message", body);
  },
  getSuggestions: () => api.get("/chatbot/suggestions"),
};

// Google Fit APIs
export const googleFitAPI = {
  getStatus: () => api.get("/googlefit/status"),
  getAuthUrl: () => api.get("/googlefit/auth"),
  sync: () => api.post("/googlefit/sync"),
  disconnect: () => api.post("/googlefit/disconnect"),
};

// Medication APIs
export const medicationAPI = {
  create: (data) => api.post("/medications", data),
  getAll: (params) => api.get("/medications", { params }),
  getToday: () => api.get("/medications/today"),
  getByUser: (userId) => api.get(`/medications/user/${userId}`),
  update: (id, data) => api.put(`/medications/${id}`, data),
  delete: (id) => api.delete(`/medications/${id}`),
  hardDelete: (id) => api.delete(`/medications/${id}/permanent`),
  logAdherence: (id, data) => api.post(`/medications/${id}/log`, data),
  getStats: (params) => api.get("/medications/stats", { params }),
  getStatsByUser: (userId) => api.get(`/medications/stats/${userId}`),
};

// Gamification APIs
export const gamificationAPI = {
  getStats: () => api.get("/gamification/stats"),
  getPatientStats: (userId) => api.get(`/gamification/stats/${userId}`),
  getLeaderboard: () => api.get("/gamification/leaderboard"),
  claimChallenge: (id) => api.post(`/gamification/challenges/${id}/claim`),
};

// Export APIs — use axios so the Bearer token is attached, then trigger blob download
export const exportAPI = {
  downloadCSV: (params) => api.get("/export/csv", { params, responseType: "blob" }),
  downloadPDF: (params) => api.get("/export/pdf", { params, responseType: "blob" }),
};

// Feedback APIs
export const feedbackAPI = {
  submit: (data) => api.post("/feedback", data),
};

// Admin APIs
export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params) => api.get("/admin/users", { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAuditLogs: (params) => api.get("/admin/audit-logs", { params }),
  getSystemMetrics: () => api.get("/admin/system-metrics"),
};
