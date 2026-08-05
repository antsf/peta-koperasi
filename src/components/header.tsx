'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LanguageToggle } from './language-toggle'
import { StatsCounter } from './stats-counter'
import { useTranslation } from '@/lib/i18n'

export function Header() {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="h-16 shrink-0 bg-surface border-b border-border flex items-center px-4 gap-4 shadow-card z-50 relative">
      <Link
        href="/"
        className="flex items-center gap-2 font-heading font-semibold text-text-primary transition-colors duration-120 hover:text-primary active:scale-[0.97]"
      >
        <span className="text-primary text-xl leading-none" aria-hidden="true">●</span>
        <span className="hidden sm:inline text-base">{t('common.app_name')}</span>
        <span className="sm:hidden text-sm">Koperasi</span>
      </Link>

      {/* Desktop nav */}
      <nav className="flex items-center gap-1 ml-auto">
        <Link
          href="/submit"
          className="hidden sm:flex items-center px-3 py-1.5 text-sm font-medium text-text-secondary rounded-lg transition-colors duration-120 hover:text-primary hover:bg-surface-raised active:scale-[0.97] active:bg-surface-raised"
        >
          + {t('nav.submit')}
        </Link>
        <Link
          href="/pending"
          className="hidden sm:flex items-center px-3 py-1.5 text-sm font-medium text-text-secondary rounded-lg transition-colors duration-120 hover:text-primary hover:bg-surface-raised active:scale-[0.97] active:bg-surface-raised"
        >
          {t('nav.pending')}
        </Link>
        <StatsCounter />
        <LanguageToggle />
      </nav>

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="sm:hidden ml-auto p-2 text-text-secondary hover:text-primary rounded-lg transition-colors duration-120"
        aria-label="Menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-surface border-b border-border shadow-lg z-40 sm:hidden">
          <nav className="flex flex-col p-4 gap-2">
            <Link
              href="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-secondary rounded-lg hover:text-primary hover:bg-surface-raised transition-colors duration-120"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {t('nav.submit')}
            </Link>
            <Link
              href="/pending"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-secondary rounded-lg hover:text-primary hover:bg-surface-raised transition-colors duration-120"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {t('nav.pending')}
            </Link>
            <div className="border-t border-border my-1" />
            <div className="px-4 py-2">
              <LanguageToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
