import { useEffect, useState } from "react"
import { CalendarDays, CreditCard, RefreshCcw, Undo2, UserRound, Wallet } from "lucide-react"
import api from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

function formatCurrency(value) {
  return `INR ${currencyFormatter.format(Number(value) || 0)}`
}

function formatDate(value) {
  if (!value) {
    return "Recently updated"
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

function normalizePaymentStatus(status) {
  if (typeof status !== "string" || !status.trim()) {
    return "Pending"
  }

  const normalized = status.trim().toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function normalizePayments(payload) {
  const candidates = [payload, payload?.payments, payload?.data, payload?.data?.payments]
  const payments = candidates.find(Array.isArray) || []

  return payments.map((payment) => ({
    ...payment,
    _id: payment?._id || payment?.id || "",
    amount: Number(payment?.amount ?? payment?.total ?? payment?.booking?.totalPrice ?? 0) || 0,
    paymentStatus: normalizePaymentStatus(payment?.paymentStatus || payment?.status),
  }))
}

function getStatusColor(status) {
  switch (status) {
    case "Success":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    case "Pending":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
    case "Failed":
      return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
    case "Refunded":
      return "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
  }
}

function getPaymentUser(payment) {
  return payment?.user || payment?.userId || payment?.booking?.user || {}
}

function getPaymentEvent(payment) {
  return payment?.event || payment?.eventId || payment?.booking?.event || payment?.booking?.eventId || {}
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState("")
  const [refundingId, setRefundingId] = useState("")

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get("/payments")
        setPayments(normalizePayments(res.data))
      } catch (err) {
        console.log(err)
        setError(err.response?.data?.message || "Unable to load payments.")
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const updateStatus = async (id, status) => {
    const normalizedStatus = normalizePaymentStatus(status)
    const currentPayment = payments.find((payment) => payment._id === id)

    if (!currentPayment || currentPayment.paymentStatus === normalizedStatus) {
      return
    }

    try {
      setUpdatingId(id)
      setError("")

      await api.put(`/payments/${id}`, { paymentStatus: normalizedStatus })

      setPayments((current) =>
        current.map((payment) =>
          payment._id === id ? { ...payment, paymentStatus: normalizedStatus } : payment
        )
      )
    } catch (err) {
      console.log(err)
      setError(err.response?.data?.message || "Failed to update payment status.")
    } finally {
      setUpdatingId("")
    }
  }

  const refundPayment = async (id) => {
    if (!window.confirm("Refund this payment?")) {
      return
    }

    try {
      setRefundingId(id)
      setError("")

      await api.post(`/payments/refund/${id}`)

      setPayments((current) =>
        current.map((payment) =>
          payment._id === id ? { ...payment, paymentStatus: "Refunded" } : payment
        )
      )
    } catch (err) {
      console.log(err)
      setError(err.response?.data?.message || "Refund failed.")
    } finally {
      setRefundingId("")
    }
  }

  const totalCollected = payments
    .filter((payment) => payment.paymentStatus === "Success")
    .reduce((sum, payment) => sum + payment.amount, 0)
  const pendingCount = payments.filter((payment) => payment.paymentStatus === "Pending").length
  const refundedCount = payments.filter((payment) => payment.paymentStatus === "Refunded").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d] md:flex">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.14),transparent_36%)]" />

          <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200">
                <CreditCard size={16} />
                Revenue desk
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                Review every transaction from one cleaner queue.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
                Track payment health, correct statuses, and issue refunds without bouncing between
                tables or raw records.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1 xl:gap-3">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <Wallet size={18} className="text-emerald-500" />
                  Captured revenue
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                  {formatCurrency(totalCollected)}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <RefreshCcw size={18} className="text-amber-500" />
                  Pending actions
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">{pendingCount}</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <Undo2 size={18} className="text-violet-500" />
                  Refunded
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">{refundedCount}</p>
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
                className="h-72 animate-pulse rounded-[2rem] border border-white/70 bg-white/80 dark:border-white/10 dark:bg-zinc-950/70"
              />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-white/70 bg-white/90 p-10 text-center shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
              No payments found.
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Transactions will appear here as soon as customers start paying for bookings.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {payments.map((payment) => {
              const paymentId = payment._id
              const user = getPaymentUser(payment)
              const event = getPaymentEvent(payment)
              const isUpdating = updatingId === paymentId
              const isRefunding = refundingId === paymentId

              return (
                <article
                  key={paymentId}
                  className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-500 dark:text-violet-300">
                        Payment record
                      </p>
                      <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                        {user.name || user.email || "Unknown customer"}
                      </h2>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {event.title || "Event details not attached"}
                      </p>
                    </div>

                    <span className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${getStatusColor(payment.paymentStatus)}`}>
                      {payment.paymentStatus}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-white/5">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Amount</p>
                      <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-white/5">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Updated</p>
                      <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                        {formatDate(payment.updatedAt || payment.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-white/5">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Customer</p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                        <UserRound size={16} className="text-violet-500" />
                        {user.email || "Email unavailable"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-white/5">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Event date</p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                        <CalendarDays size={16} className="text-cyan-500" />
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-end gap-3">
                    <label className="flex-1 min-w-[12rem] space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      Update status
                      <select
                        value={payment.paymentStatus}
                        disabled={isUpdating || isRefunding}
                        onChange={(event) => updateStatus(paymentId, event.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </label>

                    {payment.paymentStatus === "Success" && (
                      <button
                        onClick={() => refundPayment(paymentId)}
                        disabled={isRefunding || isUpdating}
                        className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Undo2 size={16} />
                        {isRefunding ? "Refunding..." : "Issue refund"}
                      </button>
                    )}
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