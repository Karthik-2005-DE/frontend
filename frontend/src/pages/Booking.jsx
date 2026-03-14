import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api/axios"

export default function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])

  // Fetch event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`)
        setEvent(res.data)
      } catch (error) {
        console.error("Error fetching event:", error)
      }
    }

    fetchEvent()
  }, [id])

  // Toggle seat selection
  const toggleSeat = (seat) => {
    setSelectedSeats((prev) =>
      prev.includes(seat)
        ? prev.filter((s) => s !== seat)
        : [...prev, seat]
    )
  }

  const seatPrice = Number(event?.price) || 0
  const total = selectedSeats.length * seatPrice

  const handlePayment = () => {
    if (selectedSeats.length === 0) return

    navigate(`/payment/${id}`, {
      state: {
        seats: selectedSeats,
        total,
        event
      }
    })
  }

  if (!event) {
    return <p className="text-center mt-20">Loading event...</p>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* Event Info */}
        <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 rounded-3xl p-8 shadow mb-10">
          <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400">
            {event.title}
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {event.description}
          </p>

          <p className="mt-3 text-sm text-gray-500">
            Location: {event.location} | Date:{" "}
            {new Date(event.date).toLocaleDateString()}
          </p>
        </div>

        {/* Seat Selection */}
        <h2 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-400">
          Select Seats
        </h2>

        <div className="grid grid-cols-8 gap-3 mb-10">
          {Array.from({ length: 40 }, (_, i) => {
            const seat = i + 1
            const selected = selectedSeats.includes(seat)

            return (
              <button
                key={seat}
                onClick={() => toggleSeat(seat)}
                className={`p-3 rounded-lg text-sm font-semibold transition 
                ${selected
                    ? "bg-purple-600 text-white"
                    : "bg-white dark:bg-zinc-900 border hover:bg-purple-100"
                  }`}
              >
                {seat}
              </button>
            )
          })}
        </div>

        {/* Booking Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 rounded-3xl p-8 shadow">
          <h3 className="text-xl font-bold mb-4 text-purple-700 dark:text-purple-400">
            Booking Summary
          </h3>

          <p className="mb-2">
            Seats Selected: <b>{selectedSeats.length}</b>
          </p>

          <p className="mb-4">
            Total Price: <b>₹ {total}</b>
          </p>

          <button
            onClick={handlePayment}
            disabled={!selectedSeats.length}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            Proceed to Payment
          </button>
        </div>

      </div>
    </div>
  )
}