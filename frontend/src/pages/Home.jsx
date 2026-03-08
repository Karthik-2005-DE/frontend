import { useEffect, useState } from "react"
import api from "../api/axios"
import EventCard from "../components/EventCard"
import { Calendar, Ticket, Star } from "lucide-react"
import { Link } from "react-router-dom"

export default function Home() {

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchEvents = async () => {
      try {

        const res = await api.get("/events")
        setEvents(res.data.slice(0, 6))

      } catch (err) {

        console.log(err)

      } finally {

        setLoading(false)

      }
    }

    fetchEvents()

  }, [])


  return (

    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900">

      {/* HERO SECTION */}

      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20">

        <div className="grid md:grid-cols-2 gap-10 items-center">

          <div>

            <h1 className="text-5xl font-black text-purple-700 dark:text-purple-400 leading-tight">
              Book Amazing <br /> Live Events
            </h1>

            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
              Discover concerts, tech conferences, stand-up shows and more.
              Reserve your seat instantly.
            </p>

            <Link
              to="/events"
              className="inline-block mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition"
            >
              Explore Events
            </Link>

          </div>

          <div className="flex justify-center">

            <img
              src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4"
              alt="event"
              className="rounded-2xl shadow-2xl"
            />

          </div>

        </div>

      </section>


      {/* FEATURES */}

      <section className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">

        <div className="backdrop-blur-lg bg-white/60 dark:bg-purple-900/30 p-6 rounded-2xl shadow">

          <Calendar className="text-purple-600 mb-3" />

          <h3 className="font-bold text-lg dark:text-white">
            Discover Events
          </h3>

          <p className="text-gray-600 dark:text-gray-400">
            Browse concerts, tech events, comedy shows and more.
          </p>

        </div>


        <div className="backdrop-blur-lg bg-white/60 dark:bg-purple-900/30 p-6 rounded-2xl shadow">

          <Ticket className="text-purple-600 mb-3" />

          <h3 className="font-bold text-lg dark:text-white">
            Instant Booking
          </h3>

          <p className="text-gray-600 dark:text-gray-400">
            Book seats instantly with secure payment.
          </p>

        </div>


        <div className="backdrop-blur-lg bg-white/60 dark:bg-purple-900/30 p-6 rounded-2xl shadow">

          <Star className="text-purple-600 mb-3" />

          <h3 className="font-bold text-lg dark:text-white">
            Top Rated Events
          </h3>

          <p className="text-gray-600 dark:text-gray-400">
            Explore the most popular events near you.
          </p>

        </div>

      </section>


      {/* FEATURED EVENTS */}

      <section className="max-w-7xl mx-auto px-6 py-16">

        <h2 className="text-3xl font-bold mb-8 text-purple-700 dark:text-purple-400">
          Featured Events
        </h2>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">

          {loading ? (
            <p className="col-span-4 text-center text-gray-500">
              Loading events...
            </p>
          ) : (
            events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))
          )}

        </div>

      </section>


      {/* CTA SECTION */}

      <section className="max-w-7xl mx-auto px-6 pb-20">

        <div className="bg-purple-600 text-white rounded-3xl p-12 text-center shadow-xl">

          <h2 className="text-3xl font-bold mb-4">
            Ready for Your Next Event?
          </h2>

          <p className="opacity-90 mb-6">
            Find and book tickets for the best events happening around you.
          </p>

          <Link
            to="/events"
            className="bg-white text-purple-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
          >
            Browse Events
          </Link>

        </div>

      </section>

    </div>
  )
}