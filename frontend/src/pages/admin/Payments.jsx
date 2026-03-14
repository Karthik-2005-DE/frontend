import { useEffect, useState } from "react"
import api from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

function normalizePayments(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.payments)) return payload.payments
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.payments)) return payload.data.payments
  return []
}

const getStatusColor = (status) => {
  switch (status) {
    case "Success":
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
    case "Pending":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
    case "Failed":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    case "Refunded":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export default function Payments() {

  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {

    const fetchPayments = async () => {
      try {
        const res = await api.get("/payments")
        setPayments(normalizePayments(res.data))
      } catch (err) {
        console.log(err)
        setError("Unable to load payments.")
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()

  }, [])

  const updateStatus = async (id, status) => {
    try {

      await api.put(`/payments/${id}`, { paymentStatus: status })

      setPayments(prev =>
        prev.map(p =>
          p._id === id ? { ...p, paymentStatus: status } : p
        )
      )

    } catch (error) {
      console.log(error)
      alert("Failed to update status")
    }
  }

  const refundPayment = async (id) => {

    if (!window.confirm("Refund this payment?")) return

    try {

      await api.post(`/payments/refund/${id}`)

      setPayments(prev =>
        prev.map(p =>
          p._id === id ? { ...p, paymentStatus: "Refunded" } : p
        )
      )

    } catch (error) {
      console.log(error)
      alert("Refund failed")
    }

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 md:flex">

      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">

        <h1 className="mb-8 text-3xl font-bold text-purple-700 dark:text-purple-400">
          Payments
        </h1>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:bg-red-950/40 dark:border-red-900">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 dark:text-gray-300">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-300">No payments found.</p>
        ) : (

          <div className="overflow-x-auto rounded-3xl bg-white/80 shadow-lg ring-1 ring-purple-100 backdrop-blur dark:bg-zinc-900/80 dark:ring-zinc-800">

            <table className="w-full min-w-[600px]">

              <thead>
                <tr className="bg-purple-100 dark:bg-purple-950/50 text-left">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>

                {payments.map(payment => (

                  <tr
                    key={payment._id}
                    className="border-t border-purple-100 dark:border-zinc-800 hover:bg-purple-50 dark:hover:bg-zinc-800/40 transition"
                  >

                    <td className="px-5 py-3">
                      {payment.user?.name ||
                       payment.user?.email ||
                       "Unknown user"}
                    </td>

                    <td className="px-5 py-3 font-semibold">
                      ₹{Number(payment.amount ?? 0)}
                    </td>

                    <td className="px-5 py-3">

                      <select
                        value={payment.paymentStatus || "Pending"}
                        onChange={(e) =>
                          updateStatus(payment._id, e.target.value)
                        }
                        className={`px-3 py-1 rounded-full text-sm font-semibold border-0 ${getStatusColor(payment.paymentStatus)}`}
                      >

                        <option value="Pending">Pending</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>

                      </select>

                    </td>

                    <td className="px-5 py-3">

                      {payment.paymentStatus === "Success" && (

                        <button
                          onClick={() => refundPayment(payment._id)}
                          className="px-4 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition"
                        >
                          Refund
                        </button>

                      )}

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