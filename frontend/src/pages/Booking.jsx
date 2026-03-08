import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api/axios"

export default function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`)
        setEvent(res.data)
      } catch (err) {
        console.log(err)
      }
    }

    fetchEvent()
  }, [id])

  const toggleSeat = (seat) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((selectedSeat) => selectedSeat !== seat))
      return
    }

    setSelectedSeats([...selectedSeats, seat])
  }

  const seatPrice = Number(event?.price) || 0
  const total = selectedSeats.length * seatPrice

  const handlePayment = () => {
    navigate(`/payment/${id}`, {
      state: {
        seats: selectedSeats,
        total,
        event,
      },
    })
  }

  if (!event) {
    return <p className="text-center mt-20">Loading...</p>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="backdrop-blur-lg bg-white/70 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-3xl p-8 shadow mb-10">
          <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-2">
            {event.title}
          </h1>

          <p className="text-gray-600 dark:text-gray-400">{event.description}</p>

          <p className="mt-3 text-sm text-gray-500">
            Location: {event.location} | Date: {event.date}
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-400">
          Select Seats
        </h2>

        <div className="grid grid-cols-8 gap-3 mb-10">
          {Array.from({ length: 40 }, (_, index) => {
            const seat = index + 1
            const selected = selectedSeats.includes(seat)

            return (
              <button
                key={seat}
                onClick={() => toggleSeat(seat)}
                className={`p-3 rounded-lg text-sm font-semibold ${
                  selected ? "bg-purple-600 text-white" : "bg-white dark:bg-zinc-900 border"
                }`}
              >
                {seat}
              </button>
            )
          })}
        </div>

        <div className="backdrop-blur-lg bg-white/70 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-3xl p-8 shadow">
          <h3 className="text-xl font-bold mb-4 text-purple-700 dark:text-purple-400">
            Booking Summary
          </h3>

          <p className="mb-2">
            Seats Selected: <b>{selectedSeats.length}</b>
          </p>

          <p className="mb-4">
            Total Price: <b>INR {total}</b>
          </p>

          <button
            onClick={handlePayment}
            disabled={selectedSeats.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  )
}
