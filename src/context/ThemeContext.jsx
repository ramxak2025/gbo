import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('iborcuha_theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    localStorage.setItem('iborcuha_theme', dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
    // Sync body background + theme-color meta globally (works on all pages including Login)
    const bg = dark ? '#050505' : '#f5f5f7'
    document.body.style.backgroundColor = bg
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  }, [dark])

  const toggle = () => setDark(d => !d)

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
