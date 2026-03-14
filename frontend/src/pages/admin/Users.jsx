import { useEffect, useState } from "react"
import api from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

export default function Users() {

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users")
        setUsers(res.data.users || [])
      } catch (err) {
        console.log(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return

    try {
      await api.put(`/admin/delete-user/${id}`)
      setUsers(prev => prev.filter(user => user._id !== id))
    } catch (err) {
      console.log(err)
      alert("Failed to delete user")
    }
  }

  const toggleBlock = async (user) => {
    try {

      await api.put(`/admin/block-user/${user._id}`)

      setUsers(prev =>
        prev.map(u =>
          u._id === user._id
            ? { ...u, isBlocked: !u.isBlocked }
            : u
        )
      )

    } catch (err) {
      console.log(err)
      alert("Failed to update user status")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 md:flex">

      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">

        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-8">
          User Management
        </h1>

        {loading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (

          <div className="overflow-x-auto rounded-3xl bg-white/80 shadow-lg ring-1 ring-purple-100 backdrop-blur dark:bg-zinc-900/80 dark:ring-zinc-800">

            <table className="w-full min-w-[600px]">

              <thead>
                <tr className="bg-purple-100 dark:bg-purple-950/50 text-left">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>

                {users.map(user => (

                  <tr
                    key={user._id}
                    className="border-t border-purple-100 dark:border-zinc-800 hover:bg-purple-50 dark:hover:bg-zinc-800/40 transition"
                  >

                    <td className="px-5 py-3 font-medium">
                      {user.name}
                    </td>

                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                      {user.email}
                    </td>

                    <td className="px-5 py-3">
                      <span className="px-3 py-1 text-xs rounded-full bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      {user.isBlocked ? (
                        <span className="text-red-500 font-semibold">
                          Blocked
                        </span>
                      ) : (
                        <span className="text-green-500 font-semibold">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3 flex gap-2">

                      <button
                        onClick={() => toggleBlock(user)}
                        className={`px-4 py-1 rounded-lg text-sm font-semibold transition
                          ${user.isBlocked
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                          }`}
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </button>

                      <button
                        onClick={() => deleteUser(user._id)}
                        className="px-4 py-1 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-black text-white"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>
    </div>
  )
}