import axios from "axios";

/** Dev: same-origin `/api` via Vite proxy (avoids Private Network Access blocks). Prod: set VITE_API_BASE_URL in Vercel, e.g. https://your-api.com/api */
function apiBaseURL() {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  if (import.meta.env.DEV) return "/api";
  return "/api";
}

/** For static files (uploads) in production — strip trailing /api from VITE_API_BASE_URL */
export function backendPublicOrigin() {
  if (import.meta.env.DEV) return "";
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return base.replace(/\/api\/?$/i, "") || "";
}

export function assetUrl(path) {
  if (!path) return "";
  const p = path.startsWith("/") ? path : `/${path}`;
  const origin = backendPublicOrigin();
  return origin ? `${origin}${p}` : p;
}

const api = axios.create({
  baseURL: apiBaseURL(),
  withCredentials: true,
});

api.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default api;
