'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'

const NAV_ITEMS = [
  { href: '/', labelKey: 'nav.home', icon: 'map' },
  { href: '/submit', labelKey: 'nav.submit', icon: 'plus' },
  { href: '/pending', labelKey: 'nav.pending', icon: 'check' },
] as const

function NavIcon({ icon, isActive }: { icon: string; isActive: boolean }) {
  const stroke = isActive ? 2.5 : 1.5
  const color = isActive ? '#0B6E4F' : '#78716C'

  if (icon === 'map') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    )
  }

  if (icon === 'plus') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    )
  }

  if (icon === 'check') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  }

  return null
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { locale, setLocale } = useTranslation()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-120 ${
                active
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-120 ${
                active ? 'bg-primary/10' : ''
              }`}>
                <NavIcon icon={item.icon} isActive={active} />
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-text-secondary'}`}>
                {item.labelKey === 'nav.home' ? 'Peta' : 
                 item.labelKey === 'nav.submit' ? 'Tambah' : 'Verifikasi'}
              </span>
            </Link>
          )
        })}

        {/* Language toggle in bottom nav */}
        <button
          type="button"
          onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
          className="flex flex-col items-center justify-center gap-0.5 w-16 h-full text-text-secondary hover:text-text-primary transition-all duration-120"
        >
          <div className="flex items-center justify-center w-10 h-10">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <span className="text-[10px] font-medium uppercase">{locale}</span>
        </button>
      </div>
    </nav>
  )
}
