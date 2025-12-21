import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ptPT } from '@clerk/localizations' // <--- IMPORT THIS
import './globals.css'

export const metadata: Metadata = {
  title: 'Patinhas na Lua',
  description: 'Serviços de Grooming e Agendamentos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // <--- ADD 'localization={ptPT}' HERE
    <ClerkProvider localization={ptPT}>
      <html lang="pt">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}