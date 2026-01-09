import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ptPT } from '@clerk/localizations' 
import CookieConsent from './components/cookie-consent'
import './globals.css'

export const metadata: Metadata = {
  title: 'Patinhas na Lua',
  description: 'Serviços de Grooming e Agendamentos',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo.png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
       { url: '/icon-192.png' } // Fallback if no apple specific icon
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Patinhas App",
  },
}

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={ptPT}>
      <html lang="pt" suppressHydrationWarning>
        <body suppressHydrationWarning>
          {children}
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  )
}