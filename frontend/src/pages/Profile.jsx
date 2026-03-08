import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { clearAuthSession } from "../utils/auth"

function pickValue(...values) {
  const value = values.find((candidate) => {
    if (candidate === null || candidate === undefined) {
      return false
    }

    return String(candidate).trim() !== ""
  })

  return value === null || value === undefined ? "" : String(value).trim()
}

function normalizeUserProfile(payload) {
  const sources = [
    payload,
    payload?.data,
    payload?.user,
    payload?.data?.user,
    payload?.profile,
    payload?.result,
    payload?.result?.user,
  ].filter(Boolean)

  const name = pickValue(
    ...sources.map((source) => source?.name),
    ...sources.map((source) => source?.fullName),
    ...sources.map((source) => source?.username)
  )

  const email = pickValue(
    ...sources.map((source) => source?.email),
    ...sources.map((source) => source?.emailAddress),
    ...sources.map((source) => source?.mail)
  )

  const phonenumber = pickValue(
    ...sources.map((source) => source?.phonenumber),
    ...sources.map((source) => source?.phoneNumber),
    ...sources.map((source) => source?.phone),
    ...sources.map((source) => source?.mobile),
    ...sources.map((source) => source?.mobileNumber)
  )

  const role = pickValue(
    ...sources.map((source) => source?.role),
    ...sources.map((source) => source?.userRole),
    ...sources.map((source) => source?.accountType),
    ...sources.map((source) => source?.type)
  )

  if (!name && !email && !phonenumber && !role) {
    return null
  }

  return {
    name: name || "User",
    email,
    phonenumber,
    role: role || "user",
  }
}

export default function Profile() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/profile")
        const userData = normalizeUserProfile(res.data)

        if (!userData) {
          throw new Error("User data not found")
        }

        setUser(userData)
      } catch (err) {
        console.error("Profile fetch error:", err)
        setError("Unable to load profile")

        setTimeout(() => {
          navigate("/login")
        }, 2000)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleLogout = () => {
    clearAuthSession()
    navigate("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900">
        <div className="animate-pulse text-purple-600 text-lg font-semibold">
          Loading Profile...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full backdrop-blur-lg bg-white/70 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-purple-600 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {user?.name || "User"}
          </h2>

          <p className="text-gray-500">{user?.email || "No email"}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Phone</span>
            <span className="text-right">{user?.phonenumber || "N/A"}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Role</span>
            <span className="capitalize text-right">{user?.role || "user"}</span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/mybooking")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition"
          >
            My Bookings
          </button>

          <button
            onClick={handleLogout}
            className="w-full border border-red-400 text-red-500 py-3 rounded-xl font-semibold hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
