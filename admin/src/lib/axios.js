import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_fittrack_token");
  const adminKey = localStorage.getItem("admin_key");
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (adminKey) {
    config.headers["x-admin-key"] = adminKey;
  }
  return config;
});

export default api;
