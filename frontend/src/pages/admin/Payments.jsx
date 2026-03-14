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

      await api.put(`/payments/${id}`, {
        paymentStatus: status
      })

      setPayments((prev) =>
        prev.map((p) =>
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

      setPayments((prev) =>
        prev.map((p) =>
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

        <h1 className="mb-6 text-2xl font-bold">
          Payments
        </h1>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading payments...</p>
        ) : payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (

          <div className="overflow-x-auto rounded-3xl bg-white shadow-lg">

            <table className="w-full">

              <thead>
                <tr className="bg-purple-100">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>

                {payments.map((payment) => (

                  <tr
                    key={payment._id}
                    className="border-t"
                  >

                    <td className="px-4 py-3">
                      {payment.user?.name ||
                       payment.user?.email ||
                       "Unknown user"}
                    </td>

                    <td className="px-4 py-3">
                      INR {Number(payment.amount ?? 0)}
                    </td>

                    <td className="px-4 py-3">

                      <select
                        value={payment.paymentStatus || "Pending"}
                        onChange={(e) =>
                          updateStatus(payment._id, e.target.value)
                        }
                        className="border rounded px-2 py-1"
                      >

                        <option value="Pending">Pending</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>

                      </select>

                    </td>

                    <td className="px-4 py-3">

                      {payment.paymentStatus === "Success" && (

                        <button
                          onClick={() => refundPayment(payment._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded"
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