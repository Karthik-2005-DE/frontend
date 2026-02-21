import EventCard from "../components/EventCard";

const events = [
  { id:1, title:"Music Fest", location:"Kochi", image:"https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2" },
  { id:2, title:"Tech Conference", location:"Bangalore", image:"https://images.unsplash.com/photo-1540575467063-178a50c2df87" },
  { id:3, title:"Comedy Night", location:"Delhi", image:"https://images.unsplash.com/photo-1520975922284-4d9b8c0b99d3" }
];

export default function Events() {
  return (
    <div className="grid md:grid-cols-3 gap-6 p-8">
      {events.map(e => <EventCard key={e.id} event={e} />)}
    </div>
  );
}