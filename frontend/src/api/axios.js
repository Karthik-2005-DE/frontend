import axios from "axios"
import { getAuthorizationToken } from "../utils/auth"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
