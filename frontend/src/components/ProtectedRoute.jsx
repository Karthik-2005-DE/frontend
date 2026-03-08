import { Navigate, useLocation } from "react-router-dom"
import { hasAdminRole, isAuthenticated } from "../utils/auth"

export default function ProtectedRouting({ children, requireAdmin = false }) {
  const hasValidToken = isAuthenticated()
  const location = useLocation()

  if (!hasValidToken) {
    return (
      <Navigate
        to="/login"
        state={{ redirectTo: location.pathname }}
        replace
      />
    )
  }

  if (requireAdmin && !hasAdminRole()) {
    return <Navigate to="/" replace />
  }

  return children
}
