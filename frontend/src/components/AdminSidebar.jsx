import { createElement } from "react"
import { CreditCard, LayoutDashboard, ListChecks, PlusCircle, Users2 } from "lucide-react"
import { NavLink } from "react-router-dom"

const adminLinks = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/create",
    label: "Create Event",
    icon: PlusCircle,
  },
  {
    to: "/admin/manage",
    label: "Manage Events",
    icon: ListChecks,
  },
  {
    to: "/admin/payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users2,
  },
]

function getLinkClassName(isActive) {
  return [
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
    isActive
      ? "bg-purple-600 text-white shadow-lg"
      : "text-gray-700 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-purple-900/40",
  ].join(" ")
}

export default function AdminSidebar() {
  return (
    <aside className="w-full border-b border-purple-100 bg-white/80 backdrop-blur-lg dark:border-purple-900 dark:bg-zinc-950/70 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="p-6 md:sticky md:top-0">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
            Admin Panel
          </p>

          <h2 className="mt-2 text-2xl font-black text-purple-700 dark:text-purple-300">
            EventBook
          </h2>
        </div>

        <nav className="grid gap-2">
          {adminLinks.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              className={({ isActive }) => getLinkClassName(isActive)}
            >
              {createElement(icon, { size: 18 })}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
