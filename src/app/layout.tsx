import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://peta-koperasi.vercel.app'),
  title: {
    default: 'Peta Koperasi Desa Merah Putih',
    template: '%s | Peta Koperasi Desa Merah Putih',
  },
  description:
    'Peta terbuka koperasi desa di seluruh Indonesia — dibangun oleh komunitas, untuk komunitas. Gratis, open source, tanpa login.',
  keywords: ['koperasi', 'peta', 'indonesia', 'desa', 'gotong royong', 'open source', 'crowdsource'],
  authors: [{ name: 'Peta Koperasi Desa Merah Putih' }],
  openGraph: {
    title: 'Peta Koperasi Desa Merah Putih',
    description: 'Temukan koperasi desa di seluruh Indonesia. Peta crowdsource gratis dan terbuka.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Peta Koperasi Desa Merah Putih',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Peta Koperasi Desa Merah Putih',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peta Koperasi Desa Merah Putih',
    description: 'Temukan koperasi desa di seluruh Indonesia. Peta crowdsource gratis dan terbuka.',
    images: ['/og-image.svg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" className="min-h-screen">
      <body className="min-h-screen flex flex-col bg-bg antialiased font-body">
        <Header />
        <main className="flex-1 flex flex-col sm:pb-0 pb-16">
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  )
}
