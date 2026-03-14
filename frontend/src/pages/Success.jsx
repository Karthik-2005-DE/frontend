import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BadgeCheck, CalendarDays, MapPin, Receipt, Sparkles, Ticket } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import api, { API_BASE_URL } from "../api/axios"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

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

function normalizeBookingPayload(payload) {
  const candidates = [
    payload?.booking,
    payload?.data?.booking,
    payload?.data?.data?.booking,
    payload?.data,
    payload?.result?.booking,
    payload?.result,
    payload,
  ]

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate) &&
        (candidate._id || candidate.id || candidate.event || candidate.eventId || candidate.quantity)
    ) || null
  )
}

function getBookingEvent(booking) {
  return booking?.event || booking?.eventId || booking?.eventDetails || null
}

function getPaymentStatus(status) {
  if (typeof status !== "string" || !status.trim()) {
    return "Confirmed"
  }

  const normalized = status.trim().toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function findBookingIdFromSession() {
  if (typeof window === "undefined") {
    return null
  }

  const paymentKeys = Object.keys(window.sessionStorage).filter((key) => key.startsWith("payment:"))

  for (let index = paymentKeys.length - 1; index >= 0; index -= 1) {
    try {
      const rawValue = window.sessionStorage.getItem(paymentKeys[index])

      if (!rawValue) {
        continue
      }

      const parsed = JSON.parse(rawValue)

      if (parsed?.bookingId) {
        return parsed.bookingId
      }
    } catch {
      // Ignore invalid session records and keep searching.
    }
  }

  return null
}

function getVerifyUrl(sessionId) {
  const separator = API_BASE_URL.includes("?") ? "&" : "?"
  return `${API_BASE_URL}/payments/verify${separator}session_id=${encodeURIComponent(sessionId)}`
}

export default function Success() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const initialBooking = normalizeBookingPayload(location.state?.booking)
  const [booking, setBooking] = useState(initialBooking)
  const [loading, setLoading] = useState(!initialBooking)
  const [error, setError] = useState("")

  const sessionId = searchParams.get("session_id") || searchParams.get("sessionId")
  const bookingId =
    initialBooking?._id ||
    location.state?.bookingId ||
    searchParams.get("bookingId") ||
    searchParams.get("booking_id") ||
    findBookingIdFromSession()

  useEffect(() => {
    if (initialBooking) {
      setBooking(initialBooking)
      setLoading(false)
      setError("")
      return
    }

    if (bookingId) {
      const fetchBooking = async () => {
        try {
          setLoading(true)
          const res = await api.get(`/bookings/${bookingId}`)
          const bookingPayload = normalizeBookingPayload(res.data)

          if (!bookingPayload?._id) {
            throw new Error("Invalid booking payload")
          }

          setBooking(bookingPayload)
          setError("")
        } catch (err) {
          console.log("Booking fetch failed:", err)
          setError(err?.response?.data?.message || "Booking not found")
        } finally {
          setLoading(false)
        }
      }

      fetchBooking()
      return
    }

    if (sessionId && typeof window !== "undefined") {
      window.location.replace(getVerifyUrl(sessionId))
      return
    }

    setError("Booking details could not be recovered from the payment redirect.")
    setLoading(false)
  }, [bookingId, initialBooking, sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] px-6 py-10 dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d]">
        <div className="mx-auto max-w-6xl animate-pulse rounded-[2rem] border border-white/70 bg-white/85 p-8 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
          <div className="h-6 w-40 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-6 h-12 w-72 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-4 h-5 w-full rounded-full bg-zinc-100 dark:bg-zinc-900" />
          <div className="mt-2 h-5 w-5/6 rounded-full bg-zinc-100 dark:bg-zinc-900" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-900" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] px-6 py-10 dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300">
            <Receipt size={28} />
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            We could not load your ticket.
          </h1>

          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {error || "Booking not found"}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/mybooking")}
              className="rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
            >
              Open my bookings
            </button>

            <button
              onClick={() => navigate("/events")}
              className="rounded-2xl border border-zinc-300 px-5 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Browse events
            </button>
          </div>
        </div>
      </div>
    )
  }

  const bookingEvent = getBookingEvent(booking)
  const ticketSummary =
    Array.isArray(booking.seats) && booking.seats.length > 0
      ? booking.seats.map((seat) => `Seat ${seat}`)
      : [`${booking.quantity || 0} ticket${booking.quantity === 1 ? "" : "s"}`]
  const totalAmount = booking.totalPrice ?? booking.total ?? booking.amount ?? 0
  const paymentStatus = getPaymentStatus(booking.paymentStatus)
  const bookingReference = booking._id || bookingId

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] px-6 py-10 dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d]">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.16),transparent_35%)]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                <BadgeCheck size={16} />
                Payment successful
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                You are booked in.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
                Your order is confirmed and the digital ticket is ready. Keep the booking ID and QR
                code handy for a smoother entry experience.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    <CalendarDays size={18} className="text-violet-500" />
                    Event date
                  </div>
                  <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                    {formatDate(bookingEvent?.date)}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    <MapPin size={18} className="text-cyan-500" />
                    Venue
                  </div>
                  <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                    {bookingEvent?.location || "Location to be shared"}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    <Ticket size={18} className="text-amber-500" />
                    Amount paid
                  </div>
                  <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[1.75rem] bg-zinc-950 p-6 text-white shadow-2xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                      <Sparkles size={14} />
                      Event pass
                    </p>
                    <h2 className="mt-3 text-2xl font-black tracking-tight">
                      {bookingEvent?.title || "Event ticket"}
                    </h2>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                    {paymentStatus}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/50">Booking ID</p>
                    <p className="mt-2 break-all text-lg font-semibold">{bookingReference}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/50">Ticket summary</p>
                    <p className="mt-2 text-lg font-semibold">
                      {Array.isArray(booking.seats) && booking.seats.length > 0
                        ? `${booking.seats.length} seats selected`
                        : `${booking.quantity || 0} ticket${booking.quantity === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {ticketSummary.map((seat) => (
                    <span
                      key={seat}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white/90"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/mybooking")}
                  className="rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
                >
                  Open my bookings
                </button>

                <button
                  onClick={() => navigate("/events")}
                  className="rounded-2xl border border-zinc-300 px-5 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Browse more events
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-500 dark:text-violet-300">
              Digital ticket
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
              Scan and enter.
            </h2>

            <div className="mt-8 flex items-center justify-center rounded-[1.75rem] border border-dashed border-violet-200 bg-violet-50 p-6 dark:border-violet-900 dark:bg-violet-950/20">
              <QRCodeCanvas value={`BookingID:${bookingReference}`} size={190} />
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Guest</p>
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
                  {booking.user?.name || booking.user?.email || "Primary attendee"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Payment status</p>
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
                  {paymentStatus}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Show this QR code at the venue entrance for a quicker check-in. If you refresh the
              page later, your booking remains available from the bookings section as well.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}