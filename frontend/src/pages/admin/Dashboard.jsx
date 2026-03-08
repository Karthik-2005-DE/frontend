import { useEffect, useState } from "react"
import api from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

const emptyStats = {
  events: 0,
  bookings: 0,
  payments: 0,
  users: 0,
}

function normalizeStats(payload) {
  const sources = [payload, payload?.data, payload?.stats, payload?.data?.stats]
  const stats =
    sources.find(
      (candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate)
    ) || {}

  return {
    events: Number(stats.events ?? 0),
    bookings: Number(stats.bookings ?? 0),
    payments: Number(stats.payments ?? 0),
    users: Number(stats.users ?? 0),
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats")
        setStats(normalizeStats(res.data))
      } catch (err) {
        console.log(err)
        setError(err.response?.data?.message || "Unable to load dashboard stats.")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const cards = [
    { label: "Total Events", value: stats.events },
    { label: "Total Bookings", value: stats.bookings },
    { label: "Total Payments", value: stats.payments },
    { label: "Total Users", value: stats.users },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 md:flex">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-8">
        <h1 className="mb-3 text-3xl font-bold text-purple-700 dark:text-purple-400">
          Admin Dashboard
        </h1>

        <p className="mb-8 text-gray-600 dark:text-gray-300">
          Track the current platform totals in one place.
        </p>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-purple-100 backdrop-blur dark:bg-zinc-900/80 dark:ring-zinc-800"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {card.label}
              </h2>

              <p className="mt-4 text-3xl font-black text-purple-600 dark:text-purple-300">
                {loading ? "..." : card.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
