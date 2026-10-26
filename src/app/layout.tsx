import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AppProviders } from '@/components/providers/AppProviders'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#070C16',
}

export const metadata: Metadata = {
  title: 'Green Processing ERP',
  description: 'Green Processing Korporativ ERP Boshqaruv Tizimi',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Green Processing ERP',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>
          {children}
          <Toaster position="top-right" />
        </AppProviders>
      </body>
    </html>
  )
}
