const AUTH_STORAGE_KEY = "token"
const AUTH_ROLE_STORAGE_KEY = "auth-role"
const AUTH_CHANGE_EVENT = "authchange"

export const SESSION_AUTH_TOKEN = "session-auth"

function notifyAuthChange() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

function normalizeRoleValue(role) {
  if (typeof role !== "string") {
    return ""
  }

  return role.trim().toLowerCase()
}

export function subscribeToAuthChanges(callback) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handler = () => callback()

  window.addEventListener(AUTH_CHANGE_EVENT, handler)
  window.addEventListener("storage", handler)

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}

export function extractAuthToken(payload) {
  const candidates = [
    payload?.token,
    payload?.accessToken,
    payload?.access_token,
    payload?.jwt,
    payload?.data?.token,
    payload?.data?.accessToken,
    payload?.data?.access_token,
    payload?.data?.jwt,
    payload?.data?.user?.token,
    payload?.data?.user?.accessToken,
    payload?.user?.token,
    payload?.user?.accessToken,
    payload?.user?.access_token,
    payload?.user?.jwt,
  ]

  const token = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim()
  )

  return token?.trim() || ""
}

export function extractAuthRole(payload) {
  const sources = [
    payload,
    payload?.data,
    payload?.user,
    payload?.data?.user,
    payload?.profile,
    payload?.result,
    payload?.result?.user,
  ].filter(Boolean)

  for (const source of sources) {
    const candidates = [
      source?.role,
      source?.userRole,
      source?.accountType,
      source?.type,
    ]

    for (const candidate of candidates) {
      const role = normalizeRoleValue(candidate)

      if (role) {
        return role
      }
    }

    if (source?.isAdmin === true) {
      return "admin"
    }
  }

  return ""
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return ""
  }

  const token = window.localStorage.getItem(AUTH_STORAGE_KEY)
  return typeof token === "string" ? token.trim() : ""
}

export function getAuthorizationToken() {
  const token = getStoredAuthToken()
  return token && token !== SESSION_AUTH_TOKEN ? token : ""
}

export function getStoredUserRole() {
  if (typeof window === "undefined") {
    return ""
  }

  return normalizeRoleValue(window.localStorage.getItem(AUTH_ROLE_STORAGE_KEY))
}

export function hasAdminRole() {
  const role = getStoredUserRole()
  return role === "admin" || role === "superadmin" || role === "super_admin"
}

export function isAuthenticated() {
  return !!getStoredAuthToken()
}

export function persistAuthRole(payloadOrRole) {
  if (typeof window === "undefined") {
    return ""
  }

  const role =
    typeof payloadOrRole === "string"
      ? normalizeRoleValue(payloadOrRole)
      : extractAuthRole(payloadOrRole)

  if (role) {
    window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, role)
  } else {
    window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY)
  }

  notifyAuthChange()

  return role
}

export function persistAuthSession(payload) {
  if (typeof window === "undefined") {
    return ""
  }

  const token = extractAuthToken(payload)
  const storedToken = token || SESSION_AUTH_TOKEN

  window.localStorage.setItem(AUTH_STORAGE_KEY, storedToken)
  notifyAuthChange()

  return storedToken
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY)
  notifyAuthChange()
}
