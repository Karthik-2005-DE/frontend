import { useEffect, useState } from "react"
import api from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

const initialFormState = {
  title: "",
  location: "",
  date: "",
  price: "",
  category: "",
  description: "",
  totalTickets: "",
  imageUrl: "",
}

const fallbackImage =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80"

function revokePreviewUrl(url) {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}

function getImageUrl(image) {
  if (typeof image !== "string" || !image.trim()) {
    return fallbackImage
  }

  if (image.startsWith("http")) {
    return image
  }

  return `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${image}`
}

function buildCreateEventFormData(form, imageFile) {
  const price = Number(form.price)
  const totalTickets = Number(form.totalTickets)

  if (Number.isNaN(price) || price < 0) {
    throw new Error("Enter a valid event price.")
  }

  if (!Number.isInteger(totalTickets) || totalTickets < 0) {
    throw new Error("Enter a valid total ticket count.")
  }

  const formData = new FormData()
  formData.append("title", form.title.trim())
  formData.append("location", form.location.trim())
  formData.append("date", form.date)
  formData.append("price", String(price))
  formData.append("totalTickets", String(totalTickets))
  formData.append("availableTickets", String(totalTickets))

  if (form.category.trim()) {
    formData.append("category", form.category.trim().toLowerCase())
  }

  if (form.description.trim()) {
    formData.append("description", form.description.trim())
  }

  if (imageFile) {
    formData.append("image", imageFile)
  } else if (form.imageUrl.trim()) {
    formData.append("imageUrl", form.imageUrl.trim())
  }

  return formData
}

export default function CreateEvent() {
  const [form, setForm] = useState(initialFormState)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    return () => {
      revokePreviewUrl(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  const replacePreviewUrl = (nextUrl) => {
    setImagePreviewUrl((current) => {
      revokePreviewUrl(current)
      return nextUrl
    })
  }

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null

    setImageFile(file)
    replacePreviewUrl(file ? URL.createObjectURL(file) : "")
  }

  const resetForm = () => {
    setForm(initialFormState)
    setImageFile(null)
    replacePreviewUrl("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const payload = buildCreateEventFormData(form, imageFile)
      await api.post("/events", payload)

      setSuccess("Event created successfully.")
      resetForm()
    } catch (err) {
      console.log(err)
      setError(err.response?.data?.error || err.message || "Unable to create event.")
    } finally {
      setSubmitting(false)
    }
  }

  const previewImage = imagePreviewUrl || getImageUrl(form.imageUrl)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 md:flex">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">
        <h1 className="mb-2 text-2xl font-bold text-purple-700 dark:text-purple-300">
          Create Event
        </h1>

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Add the event details, ticket count, and an image before publishing.
        </p>

        {error && (
          <div className="mb-4 max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 max-w-4xl rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
            {success}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-3xl bg-white/85 p-6 shadow-lg ring-1 ring-purple-100 backdrop-blur dark:bg-zinc-900/85 dark:ring-zinc-800"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <input
                placeholder="Event title"
                className="rounded-2xl border border-purple-100 p-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                value={form.title}
                onChange={updateField("title")}
                required
              />

              <input
                placeholder="Location"
                className="rounded-2xl border border-purple-100 p-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                value={form.location}
                onChange={updateField("location")}
                required
              />

              <input
                type="date"
                className="rounded-2xl border border-purple-100 p-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                value={form.date}
                onChange={updateField("date")}
                required
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                className="rounded-2xl border border-purple-100 p-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                value={form.price}
                onChange={updateField("price")}
                required
              />

              <input
                placeholder="Category"
                className="rounded-2xl border border-purple-100 p-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                value={form.category}
                onChange={updateField("category")}
              />

              <input
                type="number"
                min="0"
                step="1"
                placeholder="Total tickets"
                className="rounded-2xl border border-purple-100 p-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                value={form.totalTickets}
                onChange={updateField("totalTickets")}
                required
              />
            </div>

            <input
              placeholder="Image URL"
              className="rounded-2xl border border-purple-100 p-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
              value={form.imageUrl}
              onChange={updateField("imageUrl")}
            />

            <label className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/70 px-4 py-3 text-sm text-purple-700 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-200">
              Upload image
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm text-gray-600 dark:text-gray-300"
                onChange={handleImageChange}
              />
            </label>

            <textarea
              rows="5"
              placeholder="Description"
              className="rounded-2xl border border-purple-100 p-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
              value={form.description}
              onChange={updateField("description")}
            />

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-purple-600 p-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </form>

          <div className="overflow-hidden rounded-3xl bg-white/85 shadow-lg ring-1 ring-purple-100 backdrop-blur dark:bg-zinc-900/85 dark:ring-zinc-800">
            <div className="h-72 bg-zinc-100 dark:bg-zinc-950">
              <img src={previewImage} alt="Event preview" className="h-full w-full object-cover" />
            </div>

            <div className="space-y-3 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
                Preview
              </p>

              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {form.title || "Event title"}
              </h2>

              <p className="text-sm text-gray-600 dark:text-gray-300">
                {form.location || "Location"}
              </p>

              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                  {form.category || "Category"}
                </span>

                <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  INR {form.price || "0"}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300">
                {form.description || "Event description will appear here."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
