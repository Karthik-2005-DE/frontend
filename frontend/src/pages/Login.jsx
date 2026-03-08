import { useLocation, useNavigate, Link } from "react-router-dom"
import { useState } from "react"
import api from "../api/axios"
import {
  extractAuthRole,
  persistAuthRole,
  persistAuthSession,
  SESSION_AUTH_TOKEN,
} from "../utils/auth"

function isAdminRole(role) {
  return role === "admin" || role === "superadmin" || role === "super_admin"
}

function getNextRoute(redirectTo, role) {
  if (isAdminRole(role)) {
    return "/admin"
  }

  if (
    typeof redirectTo === "string" &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("/admin")
  ) {
    return redirectTo
  }

  return "/"
}

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.redirectTo || "/"

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const res = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      })

      const storedToken = persistAuthSession(res.data)
      let role = persistAuthRole(res.data)

      if (storedToken === SESSION_AUTH_TOKEN) {
        console.warn("Login response did not include a token. Using session auth.")
      }

      if (!role) {
        try {
          const profileRes = await api.get("/auth/profile")
          role = persistAuthRole(profileRes.data)
        } catch (profileError) {
          console.warn("Unable to resolve user role after login.", profileError)
          role = extractAuthRole(res.data)
        }
      }

      navigate(getNextRoute(redirectTo, role), { replace: true })
    } catch (err) {
      console.log(err.response?.data)
      alert(err.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900">
      <form
        onSubmit={handleLogin}
        className="w-[400px] backdrop-blur-xl bg-white/60 dark:bg-black/40 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-2xl p-8"
      >
        <h2 className="text-3xl font-bold text-center text-purple-700 dark:text-purple-400 mb-6">
          Welcome Back
        </h2>

        <input
          type="email"
          placeholder="Email Address"
          className="w-full p-3 rounded-lg border mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-900"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-lg border mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          New user?{" "}
          <Link to="/register" className="text-purple-600 font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </div>
  )
}
