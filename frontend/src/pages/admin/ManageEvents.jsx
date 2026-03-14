import { useEffect, useState } from "react"
import { CalendarDays, MapPin, PencilLine, Ticket, Trash2 } from "lucide-react"
import api, { resolveUploadUrl } from "../../api/axios"
import AdminSidebar from "../../components/AdminSidebar"

const initialEditForm = {
  title: "",
  location: "",
  date: "",
  price: "",
  category: "",
  description: "",
  totalTickets: "",
  availableTickets: "",
  imageUrl: "",
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

function formatCurrency(value) {
  return `INR ${currencyFormatter.format(Number(value) || 0)}`
}

function normalizeEvents(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.events)) {
    return payload.events
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.data?.events)) {
    return payload.data.events
  }

  return []
}

function getEventId(event) {
  return event?._id || event?.id || ""
}

function formatDateForInput(value) {
  if (!value) {
    return ""
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return ""
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
  const day = String(parsedDate.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatDateForDisplay(value) {
  if (!value) {
    return "Date unavailable"
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function getImageUrl(image) {
  if (typeof image !== "string" || !image.trim()) {
    return ""
  }

  if (image.startsWith("http")) {
    return image
  }

  return resolveUploadUrl(image)
}

function revokePreviewUrl(url) {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}

function getEditFormState(event) {
  return {
    title: event?.title || "",
    location: event?.location || "",
    date: formatDateForInput(event?.date),
    price: event?.price === 0 ? "0" : String(event?.price || ""),
    category: event?.category || "",
    description: event?.description || "",
    totalTickets: event?.totalTickets === 0 ? "0" : String(event?.totalTickets ?? ""),
    availableTickets:
      event?.availableTickets === 0 ? "0" : String(event?.availableTickets ?? ""),
    imageUrl: event?.image || "",
  }
}

function normalizeUpdatedEvent(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.event,
    payload?.data?.event,
    payload?.updatedEvent,
    payload?.data?.updatedEvent,
  ]

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate) &&
        (candidate._id || candidate.id || candidate.title || candidate.location)
    ) || null
  )
}

function parseWholeNumber(value, label) {
  if (value === "") {
    return null
  }

  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${label} must be a non-negative whole number.`)
  }

  return parsedValue
}

function buildEventFormData(form, currentEvent, imageFile) {
  const title = form.title.trim()
  const location = form.location.trim()
  const price = Number(form.price)

  if (!title || !location || !form.date) {
    throw new Error("Add the event title, venue, and date before saving.")
  }

  if (Number.isNaN(price) || price < 0) {
    throw new Error("Enter a valid event price.")
  }

  const totalTickets = parseWholeNumber(form.totalTickets, "Total tickets")
  const availableTickets = parseWholeNumber(form.availableTickets, "Available tickets")

  const nextTotal = totalTickets ?? Number(currentEvent?.totalTickets ?? 0)
  const nextAvailable = availableTickets ?? Number(currentEvent?.availableTickets ?? 0)

  if (nextAvailable > nextTotal) {
    throw new Error("Available tickets cannot exceed total tickets.")
  }

  const formData = new FormData()
  formData.append("title", title)
  formData.append("location", location)
  formData.append("date", form.date)
  formData.append("price", String(price))

  if (form.category.trim()) {
    formData.append("category", form.category.trim().toLowerCase())
  }

  if (form.description.trim()) {
    formData.append("description", form.description.trim())
  }

  if (totalTickets !== null) {
    formData.append("totalTickets", String(totalTickets))
  }

  if (availableTickets !== null) {
    formData.append("availableTickets", String(availableTickets))
  }

  if (imageFile) {
    formData.append("image", imageFile)
  } else if (form.imageUrl.trim()) {
    formData.append("imageUrl", form.imageUrl.trim())
  }

  return formData
}

function getOptimisticEvent(currentEvent, form, imageFile, fallbackImage) {
  return {
    ...currentEvent,
    title: form.title.trim(),
    location: form.location.trim(),
    date: form.date,
    price: Number(form.price),
    category: form.category.trim().toLowerCase(),
    description: form.description.trim(),
    totalTickets:
      form.totalTickets === "" ? currentEvent.totalTickets : Number(form.totalTickets),
    availableTickets:
      form.availableTickets === ""
        ? currentEvent.availableTickets
        : Number(form.availableTickets),
    image: imageFile ? fallbackImage : form.imageUrl.trim() || currentEvent.image,
  }
}

export default function ManageEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deletingId, setDeletingId] = useState("")
  const [editingId, setEditingId] = useState("")
  const [savingId, setSavingId] = useState("")
  const [editForm, setEditForm] = useState(initialEditForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/admin/events")
        setEvents(normalizeEvents(res.data))
      } catch (err) {
        console.log(err)
        setError(err.response?.data?.message || err.message || "Unable to load events.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

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

  const resetEditingState = () => {
    setEditingId("")
    setSavingId("")
    setEditForm(initialEditForm)
    setImageFile(null)
    replacePreviewUrl("")
  }

  const startEditing = (event) => {
    setEditingId(getEventId(event))
    setEditForm(getEditFormState(event))
    setImageFile(null)
    replacePreviewUrl("")
    setError("")
    setSuccess("")
  }

  const updateField = (field) => (event) => {
    setEditForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null

    setImageFile(file)
    replacePreviewUrl(file ? URL.createObjectURL(file) : "")
  }

  const saveEvent = async (id) => {
    const currentEvent = events.find((event) => getEventId(event) === id)

    if (!currentEvent) {
      setError("Unable to find the selected event.")
      return
    }

    try {
      const formData = buildEventFormData(editForm, currentEvent, imageFile)

      setSavingId(id)
      setError("")
      setSuccess("")

      const response = await api.patch(`/admin/events/${id}`, formData)
      const updatedEvent = normalizeUpdatedEvent(response?.data)

      setEvents((current) =>
        current.map((event) =>
          getEventId(event) === id
            ? updatedEvent || getOptimisticEvent(currentEvent, editForm, imageFile, event.image)
            : event
        )
      )

      setSuccess("Event updated successfully.")
      resetEditingState()
    } catch (err) {
      console.log(err)
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Unable to update the selected event."
      )
    } finally {
      setSavingId("")
    }
  }

  const deleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) {
      return
    }

    try {
      setDeletingId(id)
      setError("")
      setSuccess("")
      await api.delete(`/admin/events/${id}`)
      setEvents((current) => current.filter((event) => getEventId(event) !== id))

      if (editingId === id) {
        resetEditingState()
      }

      setSuccess("Event deleted successfully.")
    } catch (err) {
      console.log(err)
      setError(err.response?.data?.message || "Unable to delete the selected event.")
    } finally {
      setDeletingId("")
    }
  }

  const totalInventory = events.reduce((sum, event) => sum + Number(event.totalTickets ?? 0), 0)
  const availableInventory = events.reduce((sum, event) => sum + Number(event.availableTickets ?? 0), 0)
  const soldInventory = Math.max(0, totalInventory - availableInventory)
  const nextEvent = [...events]
    .filter((event) => new Date(event.date).getTime() >= Date.now())
    .sort((left, right) => new Date(left.date) - new Date(right.date))[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f1ff] via-white to-[#eef8ff] dark:from-[#12091c] dark:via-[#140c22] dark:to-[#08131d] md:flex">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.14),transparent_36%)]" />

          <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200">
                <PencilLine size={16} />
                Event control room
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                Edit live events without losing the bigger picture.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
                Update pricing, copy, inventory, and visuals directly from the event cards while
                keeping a clear view of overall capacity.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1 xl:gap-3">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <CalendarDays size={18} className="text-violet-500" />
                  Live events
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">{events.length}</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <Ticket size={18} className="text-emerald-500" />
                  Tickets left
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">{availableInventory}</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  <MapPin size={18} className="text-cyan-500" />
                  Next event
                </div>
                <p className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                  {nextEvent ? formatDateForDisplay(nextEvent.date) : "No upcoming date"}
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

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-500 dark:text-violet-300">
              Inventory
            </p>
            <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{totalInventory}</p>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-500 dark:text-violet-300">
              Sold
            </p>
            <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{soldInventory}</p>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-500 dark:text-violet-300">
              Available
            </p>
            <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{availableInventory}</p>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-500 dark:text-violet-300">
              Average price
            </p>
            <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
              {events.length
                ? formatCurrency(
                    events.reduce((sum, event) => sum + Number(event.price ?? 0), 0) / events.length
                  )
                : formatCurrency(0)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-96 animate-pulse rounded-[2rem] border border-white/70 bg-white/80 dark:border-white/10 dark:bg-zinc-950/70"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-white/70 bg-white/90 p-10 text-center shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
              No events found.
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Create an event first, then return here to refine it over time.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {events.map((event) => {
              const eventId = getEventId(event)
              const isEditing = editingId === eventId
              const previewImage = isEditing
                ? imagePreviewUrl || getImageUrl(editForm.imageUrl) || getImageUrl(event.image)
                : getImageUrl(event.image)

              return (
                <article
                  key={eventId}
                  className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_30px_80px_-50px_rgba(76,29,149,0.65)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70"
                >
                  <div className="relative h-60 bg-gradient-to-br from-violet-200 via-fuchsia-100 to-white dark:from-violet-950 dark:via-zinc-900 dark:to-zinc-950">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={event.title || "Event image"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold uppercase tracking-[0.3em] text-violet-500 dark:text-violet-300">
                        No image
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-6 py-5 text-white">
                      <h2 className="text-2xl font-black tracking-tight">
                        {event.title || "Untitled event"}
                      </h2>
                      <p className="mt-2 text-sm text-white/80">
                        {event.location || "Location unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    {isEditing ? (
                      <form
                        className="space-y-4"
                        onSubmit={(formEvent) => {
                          formEvent.preventDefault()
                          saveEvent(eventId)
                        }}
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <input
                            placeholder="Event title"
                            className="rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.title}
                            onChange={updateField("title")}
                            required
                          />

                          <input
                            placeholder="Location"
                            className="rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.location}
                            onChange={updateField("location")}
                            required
                          />

                          <input
                            type="date"
                            className="rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.date}
                            onChange={updateField("date")}
                            required
                          />

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Price"
                            className="rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.price}
                            onChange={updateField("price")}
                            required
                          />

                          <input
                            placeholder="Category"
                            className="rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.category}
                            onChange={updateField("category")}
                          />

                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Total tickets"
                            className="rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.totalTickets}
                            onChange={updateField("totalTickets")}
                          />

                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Available tickets"
                            className="rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.availableTickets}
                            onChange={updateField("availableTickets")}
                          />

                          <input
                            placeholder="Image URL or uploaded filename"
                            className="rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.imageUrl}
                            onChange={updateField("imageUrl")}
                          />
                        </div>

                        <label className="block rounded-[1.5rem] border border-dashed border-violet-200 bg-violet-50/80 px-4 py-4 text-sm font-medium text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200">
                          Replace image
                          <input
                            type="file"
                            accept="image/*"
                            className="mt-3 block w-full text-sm text-zinc-600 dark:text-zinc-300"
                            onChange={handleImageChange}
                          />
                        </label>

                        <textarea
                          rows="4"
                          placeholder="Description"
                          className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 outline-none transition focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950"
                          value={editForm.description}
                          onChange={updateField("description")}
                        />

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={savingId === eventId}
                            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <PencilLine size={16} />
                            {savingId === eventId ? "Saving..." : "Save changes"}
                          </button>

                          <button
                            type="button"
                            onClick={resetEditingState}
                            className="rounded-2xl border border-zinc-300 px-4 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                            <CalendarDays size={16} />
                            {formatDateForDisplay(event.date)}
                          </span>

                          <span className="rounded-full bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {formatCurrency(event.price)}
                          </span>

                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                            <Ticket size={16} />
                            {Number(event.availableTickets ?? 0)} / {Number(event.totalTickets ?? 0)} left
                          </span>

                          {event.category && (
                            <span className="rounded-full bg-fuchsia-50 px-3 py-2 text-sm font-semibold text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-200">
                              {event.category}
                            </span>
                          )}
                        </div>

                        <p className="mt-5 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                          {event.description || "No description added for this event yet."}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            onClick={() => startEditing(event)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700"
                          >
                            <PencilLine size={16} />
                            Edit event
                          </button>

                          <button
                            onClick={() => deleteEvent(eventId)}
                            disabled={deletingId === eventId}
                            className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={16} />
                            {deletingId === eventId ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}