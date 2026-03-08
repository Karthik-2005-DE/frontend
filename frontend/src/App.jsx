import { Route, Routes } from "react-router-dom"

import Navbar from "./components/Navbar"
import ProtectedRouting from "./components/ProtectedRoute"

import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Events from "./pages/Events"
import EventDetails from "./pages/EventsDetails"
import Profile from "./pages/Profile"
import Booking from "./pages/Booking"
import MyBooking from "./pages/MyBookings"
import Payment from "./pages/Payment"
import Success from "./pages/Success"

import Dashboard from "./pages/admin/Dashboard"
import CreateEvent from "./pages/admin/CreateEvent"
import ManageEvents from "./pages/admin/ManageEvents"
import Payments from "./pages/admin/Payments"

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/event/:id" element={<EventDetails />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/mybooking" element={<MyBooking />} />
        <Route path="/payment/:id" element={<Payment />} />
        <Route path="/success" element={<Success />} />

        <Route
          path="/admin"
          element={
            <ProtectedRouting requireAdmin>
              <Dashboard />
            </ProtectedRouting>
          }
        />
        <Route
          path="/admin/create"
          element={
            <ProtectedRouting requireAdmin>
              <CreateEvent />
            </ProtectedRouting>
          }
        />
        <Route
          path="/admin/manage"
          element={
            <ProtectedRouting requireAdmin>
              <ManageEvents />
            </ProtectedRouting>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRouting requireAdmin>
              <Payments />
            </ProtectedRouting>
          }
        />
      </Routes>
    </>
  )
}
