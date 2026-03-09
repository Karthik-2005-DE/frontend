import { useEffect, useState } from "react"
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

  return parsedDate.toISOString().split("T")[0]
}

function formatDateForDisplay(value) {
  if (!value) {
    return "Date unavailable"
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString()
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
    totalTickets:
      event?.totalTickets === 0 ? "0" : String(event?.totalTickets ?? ""),
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
  const price = Number(form.price)

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
  formData.append("title", form.title.trim())
  formData.append("location", form.location.trim())
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
        const res = await api.get("/events")
        setEvents(normalizeEvents(res.data))
      } catch (err) {
        console.log(err)
        setError("Unable to load events.")
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

      const response = await api.patch(`/events/${id}`, formData)
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
      await api.delete(`/events/${id}`)
      setEvents((current) => current.filter((event) => getEventId(event) !== id))

      if (editingId === id) {
        resetEditingState()
      }
    } catch (err) {
      console.log(err)
      setError("Unable to delete the selected event.")
    } finally {
      setDeletingId("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 md:flex">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-10">
        <h1 className="mb-2 text-2xl font-bold text-purple-700 dark:text-purple-300">
          Manage Events
        </h1>

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Edit event details, ticket counts, and images without leaving the list.
        </p>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
            {success}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 dark:text-gray-300">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-300">No events found.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {events.map((event) => {
              const eventId = getEventId(event)
              const isEditing = editingId === eventId
              const previewImage = isEditing
                ? imagePreviewUrl || getImageUrl(editForm.imageUrl)
                : getImageUrl(event.image)

              return (
                <div
                  key={eventId}
                  className="overflow-hidden rounded-3xl bg-white/85 shadow-lg ring-1 ring-purple-100 backdrop-blur dark:bg-zinc-900/85 dark:ring-zinc-800"
                >
                  <div className="relative h-56 bg-gradient-to-br from-purple-200 via-fuchsia-100 to-white dark:from-purple-950 dark:via-zinc-900 dark:to-zinc-950">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={event.title || "Event image"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold uppercase tracking-[0.3em] text-purple-500 dark:text-purple-300">
                        No image
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4 text-white">
                      <h2 className="text-xl font-bold">{event.title || "Untitled Event"}</h2>
                      <p className="mt-1 text-sm text-white/80">
                        {event.location || "Location unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
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
                            className="rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.title}
                            onChange={updateField("title")}
                            required
                          />

                          <input
                            placeholder="Location"
                            className="rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.location}
                            onChange={updateField("location")}
                            required
                          />

                          <input
                            type="date"
                            className="rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.date}
                            onChange={updateField("date")}
                            required
                          />

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Price"
                            className="rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.price}
                            onChange={updateField("price")}
                            required
                          />

                          <input
                            placeholder="Category"
                            className="rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.category}
                            onChange={updateField("category")}
                          />

                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Total tickets"
                            className="rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.totalTickets}
                            onChange={updateField("totalTickets")}
                          />

                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Available tickets"
                            className="rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.availableTickets}
                            onChange={updateField("availableTickets")}
                          />

                          <input
                            placeholder="Image URL or uploaded filename"
                            className="rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                            value={editForm.imageUrl}
                            onChange={updateField("imageUrl")}
                          />
                        </div>

                        <label className="block rounded-2xl border border-dashed border-purple-200 bg-purple-50/70 px-4 py-3 text-sm text-purple-700 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-200">
                          Replace image
                          <input
                            type="file"
                            accept="image/*"
                            className="mt-2 block w-full text-sm text-gray-600 dark:text-gray-300"
                            onChange={handleImageChange}
                          />
                        </label>

                        <textarea
                          rows="4"
                          placeholder="Description"
                          className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-400 dark:border-zinc-700 dark:bg-zinc-950"
                          value={editForm.description}
                          onChange={updateField("description")}
                        />

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={savingId === eventId}
                            className="rounded-2xl bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {savingId === eventId ? "Saving..." : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            onClick={resetEditingState}
                            className="rounded-2xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                          <span className="rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                            {formatDateForDisplay(event.date)}
                          </span>

                          <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            INR {Number(event.price ?? 0)}
                          </span>

                          <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                            {Number(event.availableTickets ?? 0)} / {Number(event.totalTickets ?? 0)} left
                          </span>

                          {event.category && (
                            <span className="rounded-full bg-fuchsia-50 px-3 py-1 font-medium text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-200">
                              {event.category}
                            </span>
                          )}
                        </div>

                        <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
                          {event.description || "No description added for this event yet."}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            onClick={() => startEditing(event)}
                            className="rounded-2xl bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700"
                          >
                            Edit Event
                          </button>

                          <button
                            onClick={() => deleteEvent(eventId)}
                            disabled={deletingId === eventId}
                            className="rounded-2xl bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {deletingId === eventId ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
