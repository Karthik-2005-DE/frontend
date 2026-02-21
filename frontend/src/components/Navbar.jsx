import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="bg-white shadow p-4 flex justify-between">
      <h1 className="text-pink-600 font-bold text-xl">EventEase</h1>
      <div className="flex gap-6">
        <Link to="/">Home</Link>
        <Link to="/events">Events</Link>
        <Link to="/my-bookings">My Bookings</Link>
        <Link to="/login">Login</Link>
      </div>
    </div>
  );
}