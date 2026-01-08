import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ptPT } from '@clerk/localizations' // <--- IMPORT THIS
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

export const metadata: Metadata = {
  title: 'Patinhas na Lua',
  description: 'Serviços de Grooming e Agendamentos',
  manifest: '/manifest.webmanifest', // Next.js auto-generates this from manifest.ts
  icons: {
    icon: [
      { url: '/logo.png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Patinhas App",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // <--- ADD 'localization={ptPT}' HERE
    <ClerkProvider localization={ptPT}>
      <html lang="pt" suppressHydrationWarning>
        <body suppressHydrationWarning>
          {children}
          <GoogleAnalytics gaId="G-9GKJYX5MTZ" />
        </body>
      </html>
    </ClerkProvider>
  )
}