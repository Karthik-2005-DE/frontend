import { useNavigate, Link } from "react-router-dom"
import { useState } from "react"
import api from "../api/axios"

export default function Register(){

const navigate = useNavigate()

const [name,setName] = useState("")
const [email,setEmail] = useState("")
const [phonenumber,setPhonenumber] = useState("")
const [password,setPassword] = useState("")
const [loading,setLoading] = useState(false)

const handleRegister = async (e) => {

e.preventDefault()   // prevents page reload

try{

setLoading(true)

await api.post("/auth/register",{
name: name.trim(),
email: email.trim().toLowerCase(),
phonenumber: phonenumber.trim(),
password
})

alert("Account created successfully")

navigate("/login")

}catch(err){

console.log(err.response?.data)

alert(err.response?.data?.message || "Registration failed")

}finally{

setLoading(false)

}

}

return(

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900">

<form
onSubmit={handleRegister}
className="w-[420px] backdrop-blur-xl bg-white/60 dark:bg-black/40 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-2xl p-8"
>

<h2 className="text-3xl font-bold text-center text-purple-700 dark:text-purple-400 mb-6">
Create Account
</h2>

<input
placeholder="Full Name"
value={name}
className="w-full p-3 rounded-lg border mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-900"
onChange={(e)=>setName(e.target.value)}
required
/>

<input
type="email"
placeholder="Email Address"
value={email}
className="w-full p-3 rounded-lg border mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-900"
onChange={(e)=>setEmail(e.target.value)}
required
/>

<input
type="tel"
placeholder="Phone Number"
value={phonenumber}
className="w-full p-3 rounded-lg border mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-900"
onChange={(e)=>setPhonenumber(e.target.value)}
required
/>

<input
type="password"
placeholder="Password"
value={password}
className="w-full p-3 rounded-lg border mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-900"
onChange={(e)=>setPassword(e.target.value)}
required
/>

<button
type="submit"
className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition"
>

{loading ? "Creating..." : "Register"}

</button>

<p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
Already have an account?{" "}
<Link to="/login" className="text-purple-600 font-semibold hover:underline">
Login
</Link>
</p>

</form>

</div>

)
}