import { CalendarDays, CreditCard, Sparkles, Ticket, Users2 } from "lucide-react"
import { useEffect, useState } from "react"
import api from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

const emptyStats = {
  events: 0,
  bookings: 0,
  payments: 0,
  users: 0,
}

const statAliases = {
  events: ["events", "totalEvents", "eventCount"],
  bookings: ["bookings", "totalBookings", "bookingCount"],
  payments: ["payments", "totalPayments", "paymentCount"],
  users: ["users", "totalUsers", "userCount"],
}

function getFirstNumericValue(source, keys) {
  for (const key of keys) {
    const value = source?.[key]

    if (value !== undefined && value !== null && value !== "") {
      return Number(value) || 0
    }
  }

  return 0
}

function pickStatsSource(payload) {
  const candidates = [payload?.stats, payload?.data?.stats, payload?.data, payload]

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate) &&
        Object.values(statAliases).some((keys) => keys.some((key) => key in candidate))
    ) || {}
  )
}

function normalizeStats(payload) {
  const stats = pickStatsSource(payload)

  return {
    events: getFirstNumericValue(stats, statAliases.events),
    bookings: getFirstNumericValue(stats, statAliases.bookings),
    payments: getFirstNumericValue(stats, statAliases.payments),
    users: getFirstNumericValue(stats, statAliases.users),
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
    {
      label: "Live events",
      value: stats.events,
      icon: CalendarDays,
      caption: "Published experiences ready for booking.",
      accent: "from-violet-500 to-fuchsia-500",
    },
    {
      label: "Bookings",
      value: stats.bookings,
      icon: Ticket,
      caption: "Confirmed reservations across the platform.",
      accent: "from-sky-500 to-cyan-500",
    },
    {
      label: "Payments",
      value: stats.payments,
      icon: CreditCard,
      caption: "Transactions currently tracked in the system.",
      accent: "from-emerald-500 to-teal-500",
    },
    {
      label: "Users",
      value: stats.users,
      icon: Users2,
      caption: "Customers and admins with active accounts.",
      accent: "from-amber-500 to-orange-500",
    },
  ]

  const totalActivity = cards.reduce((sum, card) => sum + card.value, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d] md:flex">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_30%)]" />

          <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200">
                <Sparkles size={16} />
                Admin overview
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                A clearer view of what is happening across EventBook.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
                Review the health of the platform at a glance, then move into events, payments,
                or users only where action is needed.
              </p>
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-zinc-200/70 bg-zinc-950 p-6 text-white shadow-2xl dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                Platform activity
              </p>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-white/70">Combined tracked records</p>
                  <p className="mt-2 text-5xl font-black">{loading ? "..." : totalActivity}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right text-sm text-white/80">
                  Monitoring events, bookings, payments, and users in one place.
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon

            return (
              <article
                key={card.label}
                className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_-45px_rgba(76,29,149,0.7)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
                      {card.label}
                    </p>
                    <p className="mt-4 text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
                      {loading ? "..." : card.value}
                    </p>
                  </div>

                  <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-lg`}>
                    <Icon size={20} />
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {card.caption}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}