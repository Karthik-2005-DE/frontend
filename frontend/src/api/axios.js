import axios from "axios"
import { getAuthorizationToken } from "../utils/auth"

const DEFAULT_API_BASE_URL = "/api"
const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim() 
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "") 
export const API_ORIGIN = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL

export function resolveUploadUrl(path) {
  if (typeof path !== "string" || !path.trim()) {
    return ""
  }

  if (/^(?:https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path
  }

  const normalizedPath = path.replace(/^\/+/, "")
  const uploadsPath = normalizedPath.startsWith("uploads/")
    ? normalizedPath
    : `uploads/${normalizedPath}`

  return `${API_ORIGIN}/${uploadsPath}`
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getAuthorizationToken()

  if (token) {
    config.headers = config.headers || {}

    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

export default api