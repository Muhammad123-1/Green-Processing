'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'
type FontSize = 'normal' | 'large' | 'xlarge'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [fontSize, setFontSizeState] = useState<FontSize>('normal')

  useEffect(() => {
    try {
      // Default to 'light' mode as requested by user
      const storedTheme = localStorage.getItem('theme') as Theme
      const currentTheme: Theme = storedTheme === 'dark' ? 'dark' : 'light'
      setThemeState(currentTheme)
      localStorage.setItem('theme', currentTheme)

      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }

      const storedFontSize = localStorage.getItem('fontSize') as FontSize
      if (storedFontSize) {
        setFontSizeState(storedFontSize)
        applyFontSize(storedFontSize)
      }
    } catch (e) {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }, [])

  const handleSetTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }

  const applyFontSize = (size: FontSize) => {
    if (size === 'normal') document.documentElement.style.fontSize = '16px'
    else if (size === 'large') document.documentElement.style.fontSize = '17.5px'
    else if (size === 'xlarge') document.documentElement.style.fontSize = '19px'
  }

  const handleSetFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize)
    localStorage.setItem('fontSize', newSize)
    applyFontSize(newSize)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, fontSize, setFontSize: handleSetFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
