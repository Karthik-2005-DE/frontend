import { useEffect, useState } from "react"
import { Ban, ShieldCheck, Trash2, UserRound, Users2 } from "lucide-react"
import api from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

function normalizeUsers(payload) {
  const candidates = [payload?.users, payload?.data?.users, payload?.data, payload]
  return candidates.find(Array.isArray) || []
}

function formatDate(value) {
  if (!value) {
    return "Recently active"
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function getRoleLabel(role) {
  if (typeof role !== "string" || !role.trim()) {
    return "User"
  }

  const normalized = role.trim().toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processingId, setProcessingId] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users")
        setUsers(normalizeUsers(res.data))
      } catch (err) {
        console.log(err)
        setError(err.response?.data?.message || "Unable to load users.")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) {
      return
    }

    try {
      setProcessingId(id)
      setError("")

      await api.put(`/admin/delete-user/${id}`)
      setUsers((current) => current.filter((user) => user._id !== id))
    } catch (err) {
      console.log(err)
      setError(err.response?.data?.message || "Failed to delete user.")
    } finally {
      setProcessingId("")
    }
  }

  const toggleBlock = async (user) => {
    try {
      setProcessingId(user._id)
      setError("")

      await api.put(`/admin/block-user/${user._id}`)

      setUsers((current) =>
        current.map((entry) =>
          entry._id === user._id ? { ...entry, isBlocked: !entry.isBlocked } : entry
        )
      )
    } catch (err) {
      console.log(err)
      setError(err.response?.data?.message || "Failed to update user status.")
    } finally {
      setProcessingId("")
    }
  }

  const adminCount = users.filter((user) => String(user.role).toLowerCase() === "admin").length
  const blockedCount = users.filter((user) => user.isBlocked).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d] md:flex">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.14),transparent_36%)]" />

          <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200">
                <Users2 size={16} />
                People directory
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                Keep user accounts clean, safe, and easy to scan.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
                Review user roles, spot blocked accounts quickly, and take action with clear,
                human-readable cards instead of a cramped table.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1 xl:gap-3">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <Users2 size={18} className="text-violet-500" />
                  Total users
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">{users.length}</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  Admin accounts
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">{adminCount}</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <Ban size={18} className="text-red-500" />
                  Blocked users
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">{blockedCount}</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-[2rem] border border-white/70 bg-white/80 dark:border-white/10 dark:bg-zinc-950/70"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-white/70 bg-white/90 p-10 text-center shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
              No users found.
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Accounts will appear here as soon as customers or admins sign up.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {users.map((user) => {
              const userId = user._id
              const isProcessing = processingId === userId
              const roleLabel = getRoleLabel(user.role)

              return (
                <article
                  key={userId}
                  className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-500 dark:text-violet-300">
                        Account profile
                      </p>
                      <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                        {user.name || "Unnamed user"}
                      </h2>
                      <p className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <UserRound size={16} className="text-violet-500" />
                        {user.email || "Email unavailable"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                        user.isBlocked
                          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-white/5">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Role</p>
                      <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">{roleLabel}</p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-white/5">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Joined</p>
                      <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => toggleBlock(user)}
                      disabled={isProcessing}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        user.isBlocked
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      <Ban size={16} />
                      {user.isBlocked ? "Unblock user" : "Block user"}
                    </button>

                    <button
                      onClick={() => deleteUser(userId)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    >
                      <Trash2 size={16} />
                      Delete user
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}