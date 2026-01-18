import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ptPT } from '@clerk/localizations' 
import CookieConsent from './components/cookie-consent'
import { Toaster } from 'sonner';
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://patinhasnalua.com'),
  title: {
    default: 'Patinhas na Lua | Estética Animal & Spa',
    template: '%s | Patinhas na Lua'
  },
  description: 'Serviços de Grooming, Banhos, Tosquias e Spa para cães e gatos. Produtos naturais e atendimento personalizado.',
  keywords: ['grooming', 'banhos', 'tosquias', 'spa animal', 'pets', 'cães', 'gatos', 'patinhas na lua'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
  openGraph: {
    title: 'Patinhas na Lua | Estética Animal & Spa',
    description: 'Cuidamos do seu melhor amigo com amor e consciência. Banhos, tosquias e mimos sem stress.',
    url: 'https://patinhasnalua.com',
    siteName: 'Patinhas na Lua',
    locale: 'pt_PT',
    type: 'website',
  },
}

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
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
          <Toaster richColors position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  )
}