import { Link, useNavigate } from "react-router-dom"
import {
  Home,
  Calendar,
  User,
  Ticket,
  LogIn,
  UserPlus,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react"

import { useEffect, useState } from "react"

import { clearAuthSession, isAuthenticated, subscribeToAuthChanges } from "../utils/auth"

export default function Navbar() {


  const navigate = useNavigate()

  const [loggedIn, setLoggedIn] = useState(isAuthenticated())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    return subscribeToAuthChanges(() => {
      setLoggedIn(isAuthenticated())
    })
  }, [])

  const logout = () => {
    clearAuthSession()
    setOpen(false)
    navigate("/login")
  }

  const linkStyle = "flex items-center gap-2 transition hover:text-purple-600"

  return (
    <nav className="sticky top-0 z-50 border-b border-purple-100 bg-white/60 backdrop-blur-lg dark:border-purple-900 dark:bg-black/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-purple-600">
          EventBook
        </Link>

        <div className="hidden items-center gap-6 text-gray-800 dark:text-white md:flex">
          <Link to="/" className={linkStyle}>
            <Home size={20} /> Home
          </Link>

          <Link to="/events" className={linkStyle}>
            <Calendar size={20} /> Events
          </Link>

          {loggedIn && (
            <Link to="/mybooking" className={linkStyle}>
              <Ticket size={20} /> Bookings
            </Link>
          )}

          {!loggedIn && (
            <>
              <Link to="/login" className={linkStyle}>
                <LogIn size={20} /> Login
              </Link>

              <Link to="/register" className={linkStyle}>
                <UserPlus size={20} /> Register
              </Link>
            </>
          )}

          {loggedIn && (
            <>
              <Link to="/profile" className={linkStyle}>
                <User size={20} /> Profile
              </Link>

              <button onClick={logout} className="flex items-center gap-2 text-red-500">
                <LogOut size={20} /> Logout
              </button>
            </>
          )}

          
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="text-gray-800 dark:text-white md:hidden"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 px-6 pb-6 text-gray-800 dark:text-white md:hidden">
          <Link to="/" className={linkStyle} onClick={() => setOpen(false)}>
            <Home size={20} /> Home
          </Link>

          <Link to="/events" className={linkStyle} onClick={() => setOpen(false)}>
            <Calendar size={20} /> Events
          </Link>

          {loggedIn && (
            <Link to="/mybooking" className={linkStyle} onClick={() => setOpen(false)}>
              <Ticket size={20} /> Bookings
            </Link>
          )}

          {!loggedIn && (
            <>
              <Link to="/login" className={linkStyle} onClick={() => setOpen(false)}>
                <LogIn size={20} /> Login
              </Link>

              <Link to="/register" className={linkStyle} onClick={() => setOpen(false)}>
                <UserPlus size={20} /> Register
              </Link>
            </>
          )}

          {loggedIn && (
            <>
              <Link to="/profile" className={linkStyle} onClick={() => setOpen(false)}>
                <User size={20} /> Profile
              </Link>

              <button onClick={logout} className="flex items-center gap-2 text-red-500">
                <LogOut size={20} /> Logout
              </button>
            </>
          )}

        
        </div>
      )}
    </nav>
  )
}
