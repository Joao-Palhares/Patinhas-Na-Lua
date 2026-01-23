import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ptPT } from '@clerk/localizations' 
import CookieConsent from './components/cookie-consent'
import { Toaster } from 'sonner';
import './globals.css'
import AuthGuard from './components/auth-guard'
import GoogleAnalytics from './components/google-analytics'
import JsonLdSchema from './components/json-ld-schema'

export const metadata: Metadata = {
  metadataBase: new URL('https://patinhasnalua.com'),
  title: {
    default: 'Patinhas na Lua | Estética Animal & Spa',
    template: '%s | Patinhas na Lua'
  },
  description: 'Serviços de Grooming, Banhos, Tosquias e Spa para cães e gatos em Castelo Branco. Produtos naturais e atendimento personalizado.',
  keywords: ['grooming', 'banhos', 'tosquias', 'spa animal', 'pets', 'cães', 'gatos', 'patinhas na lua', 'castelo branco', 'grooming domicilio'],
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
       { url: '/icon-192.png' }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Patinhas App",
  },
  openGraph: {
    title: 'Patinhas na Lua | Estética Animal & Spa',
    description: 'Cuidamos do seu melhor amigo com amor e consciência. Banhos, tosquias e mimos sem stress em Castelo Branco.',
    url: 'https://patinhasnalua.com',
    siteName: 'Patinhas na Lua',
    locale: 'pt_PT',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Patinhas na Lua - Grooming & Spa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Patinhas na Lua | Estética Animal & Spa',
    description: 'Grooming, Banhos e Tosquias para cães e gatos em Castelo Branco.',
    images: ['/logo.png'],
  },
  verification: {
    google: 'google-site-verification=your-code-here', // Already verified via DNS
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
        <head>
          <JsonLdSchema />
          <GoogleAnalytics />
        </head>
        <body suppressHydrationWarning>
          <AuthGuard>
            {children}
          </AuthGuard>
          <CookieConsent />
          <Toaster richColors position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  )
}
