'use client'

import { ThemeProvider } from './ThemeProvider'
import { LanguageProvider } from './LanguageProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  )
}
