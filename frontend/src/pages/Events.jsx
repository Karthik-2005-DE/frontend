import { useEffect, useState } from "react"
import api from "../api/axios"
import EventCard from "../components/EventCard"
import { Search } from "lucide-react"

export default function Events(){

const [events,setEvents] = useState([])
const [search,setSearch] = useState("")
const [category,setCategory] = useState("all")

useEffect(()=>{

const fetchEvents = async()=>{

try{

const res = await api.get("/events")
setEvents(res.data)

}catch(err){
console.log(err)
}

}

fetchEvents()

},[])


// FILTER EVENTS

const filteredEvents = events.filter(event=>{

const matchSearch =
event.title.toLowerCase().includes(search.toLowerCase())

const matchCategory =
category === "all" || event.category === category

return matchSearch && matchCategory

})


return(

<div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 px-6 py-10">

<div className="max-w-7xl mx-auto">


{/* HEADER */}

<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">

<h1 className="text-4xl font-black text-purple-700 dark:text-purple-400">
Explore Events
</h1>

<p className="text-gray-600 dark:text-gray-400">
Find concerts, tech events and comedy shows
</p>

</div>


{/* SEARCH */}

<div className="backdrop-blur-lg bg-white/70 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex items-center gap-3 mb-8 shadow">

<Search className="text-purple-600"/>

<input
placeholder="Search events..."
className="w-full bg-transparent outline-none text-gray-700 dark:text-white"
onChange={(e)=>setSearch(e.target.value)}
/>

</div>


{/* CATEGORY FILTER */}

<div className="flex flex-wrap gap-3 mb-10">

<button
onClick={()=>setCategory("all")}
className="px-4 py-2 rounded-xl bg-purple-600 text-white"
>
All
</button>

<button
onClick={()=>setCategory("concert")}
className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 shadow"
>
Concert
</button>

<button
onClick={()=>setCategory("tech")}
className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 shadow"
>
Tech
</button>

<button
onClick={()=>setCategory("comedy")}
className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 shadow"
>
Comedy
</button>

</div>


{/* TRENDING EVENTS */}

<h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-4">
🔥 Trending Events
</h2>

<div className="flex overflow-x-auto gap-6 pb-8">

{events.slice(0,5).map(event=>(

<div key={event._id} className="min-w-[260px]">
<EventCard event={event}/>
</div>

))}

</div>


{/* EVENTS GRID */}

<h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-6">
All Events
</h2>

<div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

{filteredEvents.length === 0 ? (

<p className="col-span-4 text-center text-gray-500">
No events found
</p>

) : (

filteredEvents.map(event=>(
<EventCard key={event._id} event={event}/>
))

)}

</div>

</div>

</div>

)

}