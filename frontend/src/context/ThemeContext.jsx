import { useEffect, useState } from "react"
import { ThemeContext } from "./theme-context"

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
      return
    }

    document.documentElement.classList.remove("dark")
  }, [dark])

  return <ThemeContext.Provider value={{ dark, setDark }}>{children}</ThemeContext.Provider>
}
