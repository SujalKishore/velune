import type { Metadata } from 'next'
import './globals.css'

import { SettingsProvider } from '@/contexts/SettingsContext'
import { CustomPosterProvider } from '@/contexts/CustomPosterContext'
import { DialogProvider } from '@/contexts/DialogContext'

import EffectLayer from '@/components/EffectLayer'

export const metadata: Metadata = {
  title: {
    template: 'VELUNE | %s',
    default: 'VELUNE | Movie Tracker',
  },
  description: 'Track your favorite movies and TV shows',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <DialogProvider>
          <SettingsProvider>
            <CustomPosterProvider>
              {children}
              <EffectLayer />
            </CustomPosterProvider>
          </SettingsProvider>
        </DialogProvider>
      </body>
    </html>
  )
}
