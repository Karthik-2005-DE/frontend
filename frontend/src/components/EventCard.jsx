export default function EventCard({ event }) {
  return (
    <div className="bg-white rounded-xl shadow hover:scale-105 transition">
      <img src={event.image} className="h-56 w-full object-cover rounded-t-xl" />
      <div className="p-4">
        <h2 className="font-bold">{event.title}</h2>
        <p className="text-gray-500">{event.location}</p>
        <button className="bg-pink-600 text-white w-full mt-2 py-1 rounded">
          Book Tickets
        </button>
      </div>
    </div>
  );
}