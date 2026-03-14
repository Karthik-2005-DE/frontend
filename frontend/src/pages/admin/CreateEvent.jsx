import { useEffect, useState } from "react"
import { CalendarDays, ImagePlus, MapPin, Sparkles, Ticket, Wallet } from "lucide-react"
import api, { resolveUploadUrl } from "../../api/axios"
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

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

function formatCurrency(value) {
  return `INR ${currencyFormatter.format(Number(value) || 0)}`
}

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

  return resolveUploadUrl(image)
}

function buildCreateEventFormData(form, imageFile) {
  const title = form.title.trim()
  const location = form.location.trim()
  const price = Number(form.price)
  const totalTickets = Number(form.totalTickets)

  if (!title || !location || !form.date) {
    throw new Error("Add the event title, venue, and date before publishing.")
  }

  if (Number.isNaN(price) || price < 0) {
    throw new Error("Enter a valid event price.")
  }

  if (!Number.isInteger(totalTickets) || totalTickets < 0) {
    throw new Error("Enter a valid total ticket count.")
  }

  const formData = new FormData()
  formData.append("title", title)
  formData.append("location", location)
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
      await api.post("/admin/events", payload)

      setSuccess("Event created successfully.")
      resetForm()
    } catch (err) {
      console.log(err)
      setError(err.response?.data?.error || err.message || "Unable to create event.")
    } finally {
      setSubmitting(false)
    }
  }

  const minDate = new Date().toISOString().split("T")[0]
  const previewImage = imagePreviewUrl || getImageUrl(form.imageUrl)
  const previewTitle = form.title.trim() || "Your headline event"
  const previewLocation = form.location.trim() || "Venue and city"
  const previewDescription =
    form.description.trim() ||
    "Write a vivid description so guests understand the atmosphere, timing, and what makes this event worth booking."

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d] md:flex">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.14),transparent_36%)]" />

          <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200">
                <Sparkles size={16} />
                Event studio
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                Create an event page that feels ready to sell.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
                Add the essentials, shape the story, and preview the final presentation before you
                publish it to guests.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1 xl:gap-3">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <CalendarDays size={18} className="text-violet-500" />
                  Date locked in
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                  {form.date || "Pick a date"}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <Wallet size={18} className="text-emerald-500" />
                  Ticket price
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                  {formatCurrency(form.price)}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <Ticket size={18} className="text-amber-500" />
                  Capacity
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                  {form.totalTickets || "0"} tickets
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 md:p-8"
          >
            <div className="space-y-8">
              <section>
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-500 dark:text-violet-300">
                    Basics
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                    Core event details
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Event title
                    <input
                      placeholder="Sunset rooftop session"
                      className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                      value={form.title}
                      onChange={updateField("title")}
                      required
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Location
                    <input
                      placeholder="Seoul Arts Hall"
                      className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                      value={form.location}
                      onChange={updateField("location")}
                      required
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Date
                    <input
                      type="date"
                      min={minDate}
                      className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                      value={form.date}
                      onChange={updateField("date")}
                      required
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Category
                    <input
                      placeholder="Music, tech, workshop..."
                      className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                      value={form.category}
                      onChange={updateField("category")}
                    />
                  </label>
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-500 dark:text-violet-300">
                    Capacity
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                    Pricing and inventory
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Ticket price
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="2999"
                      className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                      value={form.price}
                      onChange={updateField("price")}
                      required
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Total tickets
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="120"
                      className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                      value={form.totalTickets}
                      onChange={updateField("totalTickets")}
                      required
                    />
                  </label>
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-500 dark:text-violet-300">
                    Storytelling
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                    Visuals and copy
                  </h2>
                </div>

                <div className="space-y-4">
                  <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Image URL
                    <input
                      placeholder="https://example.com/event-cover.jpg"
                      className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                      value={form.imageUrl}
                      onChange={updateField("imageUrl")}
                    />
                  </label>

                  <label className="block rounded-[1.5rem] border border-dashed border-violet-200 bg-violet-50/80 px-4 py-4 text-sm font-medium text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200">
                    <span className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <ImagePlus size={18} />
                      Upload a cover image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-zinc-600 dark:text-zinc-300"
                      onChange={handleImageChange}
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Description
                    <textarea
                      rows="6"
                      placeholder="Describe the energy, highlights, and what guests can expect from the experience."
                      className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                      value={form.description}
                      onChange={updateField("description")}
                    />
                  </label>
                </div>
              </section>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-600 dark:hover:bg-violet-700"
              >
                <Sparkles size={18} />
                {submitting ? "Publishing event..." : "Publish event"}
              </button>
            </div>
          </form>

          <aside className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 xl:sticky xl:top-24 xl:self-start">
            <div className="overflow-hidden rounded-[1.75rem] bg-zinc-100 dark:bg-zinc-900">
              <img src={previewImage} alt="Event preview" className="h-72 w-full object-cover" />
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-500 dark:text-violet-300">
                Live preview
              </p>

              <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                {previewTitle}
              </h2>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                  <MapPin size={16} />
                  {previewLocation}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <Wallet size={16} />
                  {formatCurrency(form.price)}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                  <Ticket size={16} />
                  {form.totalTickets || "0"} seats
                </span>
              </div>

              {form.category.trim() && (
                <span className="inline-flex rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  {form.category}
                </span>
              )}

              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {previewDescription}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}