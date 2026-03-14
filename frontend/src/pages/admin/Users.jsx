import { useEffect, useState } from "react"
import api from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

export default function Users() {

  const [users,setUsers] = useState([])

  useEffect(()=>{
    const fetchUsers = async ()=>{
      const res = await api.get("/admin/users")
      setUsers(res.data.users)
    }
    fetchUsers()
  },[])

  const deleteUser = async(id)=>{
    if(!window.confirm("Delete user?")) return

    await api.put(`/admin/delete-user/${id}`)
    setUsers(users.filter(u=>u._id!==id))
  }

  return (
    <div className="min-h-screen md:flex">
      <AdminSidebar/>

      <div className="flex-1 p-8">

        <h1 className="text-2xl font-bold mb-6">
          Users
        </h1>

        <table className="w-full border">

          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

          {users.map(user=>(
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>

              <td>
                <button
                  onClick={()=>deleteUser(user._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          </tbody>

        </table>

      </div>
    </div>
  )
}