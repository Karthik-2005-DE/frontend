import Navbar from "./Navbar"

export default function SetLayout({children}){

return(

<div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">

<Navbar/>

<div className="p-6">
{children}
</div>

</div>

)
}