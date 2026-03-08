import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import api from "../api/axios"

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/bookings/my-bookings")
        setBookings(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.log("Booking error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  if (loading) {
    return <div className="flex justify-center mt-20">Loading bookings...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-purple-700 dark:text-purple-400">
          My Bookings
        </h1>

        {bookings.length === 0 && <p className="text-gray-500">No bookings yet</p>}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bookings.map((booking) => {
            const ticketSummary =
              Array.isArray(booking.seats) && booking.seats.length > 0
                ? booking.seats.join(", ")
                : `${booking.quantity || 0} ticket${booking.quantity === 1 ? "" : "s"}`

            const totalAmount = booking.totalPrice ?? booking.total ?? 0

            return (
              <div
                key={booking._id}
                className="bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-2xl p-6 shadow-lg"
              >
                <h2 className="text-xl font-bold mb-2">{booking.event?.title || "Event"}</h2>

                <p className="text-gray-500 text-sm">
                  Location: {booking.event?.location || "N/A"}
                </p>

                <p className="text-gray-500 text-sm mb-2">
                  Date: {booking.event?.date || "N/A"}
                </p>

                <p className="text-sm">Tickets: {ticketSummary}</p>

                <p className="font-semibold mt-2">Total: INR {totalAmount}</p>

                <p className="text-sm text-purple-600 dark:text-purple-300 mb-4">
                  Status: {booking.paymentStatus || "Pending"}
                </p>

                <div className="flex justify-center">
                  <QRCodeCanvas value={`BookingID:${booking._id}`} size={110} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
