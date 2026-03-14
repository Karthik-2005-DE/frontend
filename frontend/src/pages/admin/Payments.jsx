import { useEffect, useState } from "react"
import api from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

function normalizePayments(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.payments)) {
    return payload.payments
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.data?.payments)) {
    return payload.data.payments
  }

  return []
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get("/admin/payments")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 md:flex">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">
        <h1 className="mb-6 text-2xl font-bold">Payments</h1>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 dark:text-gray-300">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-300">No payments found.</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white/80 shadow-lg ring-1 ring-purple-100 dark:bg-zinc-900/80 dark:ring-zinc-800">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="bg-purple-100 dark:bg-purple-950/50">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id || payment.id} className="border-t border-purple-100 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      {payment.user?.name || payment.user?.email || "Unknown user"}
                    </td>
                    <td className="px-4 py-3">INR {Number(payment.amount ?? 0)}</td>
                    <td className="px-4 py-3">{payment.paymentStatus || payment.status || "Pending"}</td>
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

