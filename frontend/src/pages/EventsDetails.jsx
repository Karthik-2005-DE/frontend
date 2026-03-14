import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api, { resolveUploadUrl } from "../api/axios"
import { Calendar, MapPin, Ticket, Share2, Info } from "lucide-react"

import { isAuthenticated } from "../utils/auth"

const fallbackImage =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80"

function getImageUrl(image) {
  if (typeof image !== "string" || !image.trim()) {
    return fallbackImage
  }

  return resolveUploadUrl(image)
}

export default function EventDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const selectedSeats = []

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`)
        setEvent(res.data)
      } catch (error) {
        console.error("Failed to load event:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  const bookSeats = () => {
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { redirectTo: `/booking/${event._id}` },
      })

      return
    }

    navigate(`/booking/${event._id}`, {
      state: {
        seats: selectedSeats,
        event,
      },
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-purple-600">
        Loading Event...
      </div>
    )
  }

  if (!event) {
    return <div className="py-20 text-center text-red-500">Event not found</div>
  }

  const imageUrl = getImageUrl(event.image)

  return (
    
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="relative h-[350px] overflow-hidden rounded-3xl bg-black">
          <img
            src={imageUrl}
            alt={event.title}
            className="absolute h-full w-full scale-110 object-cover opacity-60 blur-sm"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent" />

          <div className="relative z-10 flex h-full flex-col items-end gap-8 p-8 md:flex-row">
            <img
              src={imageUrl}
              alt={event.title}
              className="hidden h-96 w-60 rounded-xl border border-white/20 object-cover shadow-xl md:block"
            />

            <div className="flex-1 text-white">
              <span className="rounded bg-purple-600 px-3 py-1 text-xs font-bold uppercase">
                {event.category || "Live Event"}
              </span>

              <h1 className="mt-4 text-4xl font-black md:text-5xl">{event.title}</h1>

              <div className="mt-4 flex gap-6 text-sm opacity-90">
                <span className="flex items-center gap-2">
                  <Calendar size={18} className="text-purple-400" />
                  {new Date(event.date).toDateString()}
                </span>

                <span className="flex items-center gap-2">
                  <MapPin size={18} className="text-purple-400" />
                  {event.location}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold dark:text-white">
                <Info className="text-purple-500" />
                About the Event
              </h2>

              <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                {event.description || "Details for this event will be updated soon."}
              </p>
            </div>
          </div>

          <div className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-2 text-xs uppercase text-gray-500">Price</p>

              <h2 className="mb-6 text-4xl font-black text-black dark:text-white">
                INR{event.price}
              </h2>

              <button
                onClick={bookSeats}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-purple-600 py-4 font-bold text-white hover:bg-purple-700"
              >
                <Ticket size={20} />
                Book Now
              </button>

              <button className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-gray-500 hover:text-purple-600">
                <Share2 size={16} />
                Share Event
              </button>
            </div>
          </div>
        </div>
      </div>
    
  )
}
