import { Link } from "react-router-dom"
import { MapPin, Calendar, IndianRupee } from "lucide-react"
import { resolveUploadUrl } from "../api/axios"

const fallbackImage =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80"

function getImageUrl(image) {
  if (typeof image !== "string" || !image.trim()) {
    return fallbackImage
  }

  return resolveUploadUrl(image)
}

const EventCard = ({ event }) => {
  const imageUrl = getImageUrl(event.image)

  return (
    <Link
      to={`/event/${event._id}`}
      className="group block overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-pink-500/10 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={imageUrl}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute left-3 top-3 rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
          {event.category || "Live Event"}
        </div>
      </div>

      <div className="p-4">
        <h3 className="truncate text-lg font-bold text-black transition-colors group-hover:text-primary dark:text-white">
          {event.title}
        </h3>

        <div className="mt-2 space-y-1">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin size={14} className="mr-1 text-primary" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar size={14} className="mr-1 text-primary" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-pink-50 pt-4 dark:border-zinc-800">
          <div className="flex items-center font-bold text-primary text-purple-700">
            <IndianRupee size={16} />
            <span>{event.price}</span>
          </div>

          <span className="text-xs font-semibold uppercase tracking-tighter text-primary text-purple-700 group-hover:underline">
            Book Now
          </span>
        </div>
      </div>
    </Link>
  )
}

export default EventCard