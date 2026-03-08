import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useState } from "react"
import api from "../api/axios"
import { clearAuthSession, isAuthenticated } from "../utils/auth"

const getStoredPaymentState = (id) => {
  if (typeof window === "undefined" || !id) {
    return null
  }

  try {
    const rawValue = window.sessionStorage.getItem(`payment:${id}`)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

const persistPaymentState = (id, value) => {
  if (typeof window === "undefined" || !id || !value) {
    return
  }

  window.sessionStorage.setItem(`payment:${id}`, JSON.stringify(value))
}

export default function Payment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state || getStoredPaymentState(id) || {}
  const event = state.event || null
  const normalizedSeats = Array.isArray(state.seats) ? state.seats : []
  const fallbackAmount = (Number(event?.price) || 0) * normalizedSeats.length
  const amount = Number(state.total) || fallbackAmount

  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState(state.bookingId || null)

  if (!event || normalizedSeats.length === 0 || amount <= 0) {
    return (
      <div className="text-center mt-20 space-y-4">
        <p>Booking data missing or invalid.</p>
        <button
          onClick={() => navigate(id ? `/booking/${id}` : "/events")}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white"
        >
          Go Back
        </button>
      </div>
    )
  }

  const handlePayment = async () => {
    if (loading) return

    if (!id) {
      alert("Invalid event id")
      return
    }

    const basePaymentState = {
      event,
      seats: normalizedSeats,
      total: amount,
      bookingId,
      booking: state.booking || null,
    }

    if (!isAuthenticated()) {
      persistPaymentState(id, basePaymentState)
      alert("Please login to continue payment")
      navigate("/login", { state: { redirectTo: `/payment/${id}` } })
      return
    }

    try {
      setLoading(true)

      let resolvedBookingId = bookingId
      let payableAmount = amount
      let bookingPayload =
        state.booking ||
        (resolvedBookingId
          ? {
              _id: resolvedBookingId,
              event,
              seats: normalizedSeats,
              quantity: normalizedSeats.length,
              totalPrice: payableAmount,
              total: payableAmount,
            }
          : null)

      if (!resolvedBookingId) {
        const bookingRes = await api.post("/bookings", {
          eventId: id,
          quantity: normalizedSeats.length,
        })

        resolvedBookingId = bookingRes?.data?._id || bookingRes?.data?.booking?._id
        payableAmount = Number(bookingRes?.data?.totalPrice) || amount

        if (!resolvedBookingId) {
          throw new Error("Booking id missing in booking response")
        }

        setBookingId(resolvedBookingId)

        bookingPayload = {
          ...bookingRes.data,
          _id: resolvedBookingId,
          event: bookingRes?.data?.event || event,
          seats: normalizedSeats,
          quantity: bookingRes?.data?.quantity || normalizedSeats.length,
          totalPrice: Number(bookingRes?.data?.totalPrice) || payableAmount,
          total: Number(bookingRes?.data?.totalPrice) || payableAmount,
        }
      }

      persistPaymentState(id, {
        event,
        seats: normalizedSeats,
        total: payableAmount,
        bookingId: resolvedBookingId,
        booking: bookingPayload,
      })

      const res = await api.post("/payments/stripe-session", {
        bookingId: resolvedBookingId,
        amount: payableAmount,
      })

      const redirectUrl =
        res?.data?.url ||
        res?.data?.checkoutUrl ||
        res?.data?.redirectUrl ||
        res?.data?.sessionUrl

      if (redirectUrl) {
        window.location.assign(redirectUrl)
        return
      }

      navigate(`/success?bookingId=${resolvedBookingId}`, {
        state: {
          bookingId: resolvedBookingId,
          booking: bookingPayload,
        },
      })
    } catch (err) {
      console.log("Payment failed:", err)

      if (err?.response?.status === 401) {
        persistPaymentState(id, basePaymentState)
        clearAuthSession()
        alert("Session expired. Please login again.")
        navigate("/login", { state: { redirectTo: `/payment/${id}` } })
        return
      }

      alert(err?.response?.data?.message || err?.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 flex items-center justify-center px-6">
      <div className="max-w-lg w-full backdrop-blur-lg bg-white/70 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-6 text-center">
          Payment Summary
        </h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold">{event.title || "Event"}</h2>
          <p className="text-sm text-gray-500">Location: {event.location || "N/A"}</p>
          <p className="text-sm text-gray-500">Date: {event.date || "N/A"}</p>
        </div>

        <div className="mb-4">
          <p className="font-semibold">Seats Selected</p>

          <div className="flex flex-wrap gap-2 mt-2">
            {normalizedSeats.map((seat) => (
              <span key={seat} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm">
                {seat}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-lg font-semibold">Total Amount</p>

          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            INR {amount}
          </p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  )
}
