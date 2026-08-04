import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { LocaleProvider } from '@/components/locale-provider'

export const metadata: Metadata = {
  title: 'Peta Koperasi Desa Merah Putih',
  description:
    'Peta terbuka koperasi desa di seluruh Indonesia — dibangun oleh komunitas, untuk komunitas.',
  openGraph: {
    title: 'Peta Koperasi Desa Merah Putih',
    description: 'Temukan koperasi desa di seluruh Indonesia.',
    type: 'website',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full flex flex-col bg-bg antialiased font-body">
        <LocaleProvider>
          <Header />
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {children}
          </main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  )
}
