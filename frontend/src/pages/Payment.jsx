import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, LockKeyhole, MapPin, Receipt, ShieldCheck, Ticket } from "lucide-react"
import { useState } from "react"
import api from "../api/axios"
import { clearAuthSession, isAuthenticated } from "../utils/auth"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

const getStoredPayment = (id) => {
  if (!id) return null

  try {
    const stored = sessionStorage.getItem(`payment:${id}`)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const savePayment = (id, data) => {
  if (!id || !data) return
  sessionStorage.setItem(`payment:${id}`, JSON.stringify(data))
}

const isValidUrl = (url) => typeof url === "string" && /^https?:\/\//i.test(url)

function formatCurrency(value) {
  return `INR ${currencyFormatter.format(Number(value) || 0)}`
}

function formatDate(value) {
  if (!value) {
    return "Date to be announced"
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

function normalizeCreatedBooking(payload) {
  const bookingCandidates = [payload?.booking, payload?.data?.booking, payload?.data, payload]
  const booking =
    bookingCandidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate) &&
        (candidate._id || candidate.id || candidate.eventId)
    ) || null

  return {
    bookingId:
      booking?._id ||
      booking?.id ||
      payload?.bookingId ||
      payload?.data?.bookingId ||
      payload?._id ||
      null,
    totalAmount:
      Number(
        payload?.totalPrice ??
          payload?.data?.totalPrice ??
          booking?.totalPrice ??
          booking?.total ??
          payload?.amount ??
          payload?.data?.amount ??
          0
      ) || 0,
  }
}

function getCheckoutUrl(payload) {
  return (
    payload?.url ||
    payload?.checkoutUrl ||
    payload?.redirectUrl ||
    payload?.data?.url ||
    payload?.data?.checkoutUrl ||
    payload?.data?.redirectUrl ||
    ""
  )
}

export default function Payment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const restoredState = getStoredPayment(id) || {}
  const state = {
    ...restoredState,
    ...(location.state || {}),
  }

  const event = state.event || null
  const seats = Array.isArray(state.seats) ? state.seats : []

  const fallbackAmount = (Number(event?.price) || 0) * seats.length
  const totalAmount = Number(state.total) || fallbackAmount
  const seatLabels = seats.map((seat) => `Seat ${seat}`)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [bookingId, setBookingId] = useState(state.bookingId || null)

  if (!event || seats.length === 0 || totalAmount <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] px-6 py-10 dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
            <Receipt size={28} />
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            Booking details are missing.
          </h1>

          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            Go back to the event page, choose your seats again, and return here for checkout.
          </p>

          <button
            onClick={() => navigate(id ? `/booking/${id}` : "/events")}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            <ArrowLeft size={18} />
            Go back
          </button>
        </div>
      </div>
    )
  }

  const handlePayment = async () => {
    if (loading) return

    if (!isAuthenticated()) {
      savePayment(id, { event, seats, total: totalAmount })
      navigate("/login", { state: { redirectTo: `/payment/${id}` } })
      return
    }

    try {
      setLoading(true)
      setError("")

      let currentBookingId = bookingId
      let payableAmount = totalAmount

      if (!currentBookingId) {
        const bookingRes = await api.post("/bookings", {
          eventId: id,
          quantity: seats.length,
        })

        const { bookingId: nextBookingId, totalAmount: nextTotalAmount } = normalizeCreatedBooking(
          bookingRes?.data
        )

        currentBookingId = nextBookingId
        payableAmount = nextTotalAmount || totalAmount

        if (!currentBookingId) {
          throw new Error("Booking creation failed")
        }

        setBookingId(currentBookingId)
      }

      savePayment(id, {
        event,
        seats,
        total: payableAmount,
        bookingId: currentBookingId,
      })

      const res = await api.post("/payments/stripe-session", {
        bookingId: currentBookingId,
        amount: payableAmount,
      })

      const redirectUrl = getCheckoutUrl(res?.data)

      if (!isValidUrl(redirectUrl)) {
        throw new Error("Stripe checkout URL missing")
      }

      window.location.assign(redirectUrl)
    } catch (err) {
      console.log("Payment failed:", err)

      if (err?.response?.status === 401) {
        savePayment(id, { event, seats, total: totalAmount })
        clearAuthSession()
        navigate("/login", { state: { redirectTo: `/payment/${id}` } })
        return
      }

      setError(err?.response?.data?.message || err.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] px-6 py-10 dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d]">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.14),transparent_36%)]" />

            <div className="relative">
              <button
                onClick={() => navigate(`/booking/${id}`)}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-zinc-800 dark:bg-white/5 dark:text-zinc-200 dark:hover:border-violet-900 dark:hover:text-violet-300"
              >
                <ArrowLeft size={16} />
                Back to seats
              </button>

              <h1 className="mt-6 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                Review your booking before payment.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
                Your seats are ready. Confirm the summary below and continue to secure Stripe
                checkout when everything looks right.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    <CalendarDays size={18} className="text-violet-500" />
                    Event date
                  </div>
                  <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                    {formatDate(event.date)}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    <MapPin size={18} className="text-cyan-500" />
                    Location
                  </div>
                  <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                    {event.location || "Location to be announced"}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[1.75rem] bg-zinc-950 p-6 text-white shadow-2xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                      Booking summary
                    </p>
                    <h2 className="mt-3 text-2xl font-black tracking-tight">
                      {event.title || "Selected event"}
                    </h2>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Amount due</p>
                    <p className="mt-2 text-2xl font-black">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/50">Seats selected</p>
                    <p className="mt-2 text-lg font-semibold">
                      {seats.length} ticket{seats.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/50">Price per ticket</p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatCurrency(Number(event.price) || 0)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {seatLabels.map((seat) => (
                    <span
                      key={seat}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white/90"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <div className="rounded-[1.75rem] bg-gradient-to-br from-violet-600 text-white shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
                Ready to pay
              </p>
              <p className="mt-4 text-4xl font-black tracking-tight">{formatCurrency(totalAmount)}</p>
              <p className="mt-3 text-sm leading-6 text-white/80">
                Complete the payment in Stripe and you will be redirected back with your confirmed
                ticket.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/80 px-4 py-4 dark:border-zinc-800 dark:bg-white/5">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Tickets</span>
                <span className="font-semibold text-zinc-950 dark:text-white">{seats.length}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/80 px-4 py-4 dark:border-zinc-800 dark:bg-white/5">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Subtotal</span>
                <span className="font-semibold text-zinc-950 dark:text-white">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {bookingId && (
                <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/80 px-4 py-4 dark:border-zinc-800 dark:bg-white/5">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Draft booking</span>
                  <span className="max-w-[11rem] truncate font-semibold text-zinc-950 dark:text-white">
                    {bookingId}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-emerald-600 dark:text-emerald-300">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">Secure checkout</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                    Stripe handles the payment step. Your selected seats remain tied to this booking
                    while the payment is being completed.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-600 dark:hover:bg-violet-700"
            >
              <LockKeyhole size={18} />
              {loading ? "Redirecting to Stripe..." : "Continue to payment"}
            </button>

            <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Ticket size={16} />
              Seats are confirmed based on this order summary.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}