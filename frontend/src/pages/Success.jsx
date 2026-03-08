import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { QRCodeCanvas } from "qrcode.react"
import api from "../api/axios"

export default function Success() {
  const navigate = useNavigate()
  const location = useLocation()

  const initialBooking = location.state?.booking || null
  const [booking, setBooking] = useState(initialBooking)
  const [loading, setLoading] = useState(!initialBooking)
  const [error, setError] = useState("")

  const bookingId =
    location.state?.booking?._id ||
    location.state?.bookingId ||
    new URLSearchParams(location.search).get("bookingId")

  useEffect(() => {
    if (initialBooking) {
      setBooking(initialBooking)
      setLoading(false)
      return
    }

    if (!bookingId) {
      setError("Booking not found")
      setLoading(false)
      return
    }

    const fetchBooking = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/bookings/${bookingId}`)
        setBooking(res.data)
        setError("")
      } catch (err) {
        console.log("Booking fetch failed:", err)
        setError(err?.response?.data?.message || "Booking not found")
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId, initialBooking])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading booking...</p>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">{error || "Booking not found"}</p>
      </div>
    )
  }

  const ticketSummary =
    Array.isArray(booking.seats) && booking.seats.length > 0
      ? booking.seats.join(", ")
      : `${booking.quantity || 0} ticket${booking.quantity === 1 ? "" : "s"}`

  const totalAmount = booking.totalPrice ?? booking.total ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full backdrop-blur-lg bg-white/70 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-3xl p-8 shadow-xl text-center">
        <div className="text-green-500 text-5xl mb-4">Success</div>

        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-2">
          Payment Successful
        </h1>

        <p className="text-gray-500 mb-6">Your booking has been confirmed</p>

        <div className="mb-6 text-left">
          <h2 className="font-bold text-lg">{booking.event?.title || "Event"}</h2>
          <p className="text-gray-500 text-sm">Location: {booking.event?.location || "N/A"}</p>
          <p className="text-gray-500 text-sm">Date: {booking.event?.date || "N/A"}</p>
        </div>

        <p className="mb-2">
          Tickets: <b>{ticketSummary}</b>
        </p>

        <p className="mb-6">
          Total Paid: <b>INR {totalAmount}</b>
        </p>

        <div className="flex justify-center mb-6">
          <QRCodeCanvas value={`BookingID:${booking._id}`} size={120} />
        </div>

        <button
          onClick={() => navigate("/events")}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold"
        >
          Browse More Events
        </button>
      </div>
    </div>
  )
}
