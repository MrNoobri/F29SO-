import api from "./axios";

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getCurrentUser: () => api.get("/auth/me"),
};

export const chatbotAPI = {
  sendMessage: (data) => api.post("/chatbot/message", data),
};

export const googleFitAPI = {
  getStatus: () => api.get("/googlefit/status"),
  getAuthUrl: () => api.get("/googlefit/auth"),
  sync: () => api.post("/googlefit/sync"),
  disconnect: () => api.post("/googlefit/disconnect"),
};

export default api;
