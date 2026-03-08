export default function GlassLayout({ children }) {

  return (

    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-black dark:to-purple-900 transition-colors">

      <div className="max-w-7xl mx-auto px-6 py-10">

        
          {children}

        </div>

      </div>

   

  )

}