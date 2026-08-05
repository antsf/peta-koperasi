'use client'

import Link from 'next/link'
import { LanguageToggle } from './language-toggle'
import { StatsCounter } from './stats-counter'
import { useTranslation } from '@/lib/i18n'

export function Header() {
  const { t } = useTranslation()

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

      {/* Desktop nav only */}
      <nav className="hidden sm:flex items-center gap-1 ml-auto">
        <Link
          href="/submit"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-text-secondary rounded-lg transition-colors duration-120 hover:text-primary hover:bg-surface-raised active:scale-[0.97] active:bg-surface-raised"
        >
          + {t('nav.submit')}
        </Link>
        <Link
          href="/pending"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-text-secondary rounded-lg transition-colors duration-120 hover:text-primary hover:bg-surface-raised active:scale-[0.97] active:bg-surface-raised"
        >
          {t('nav.pending')}
        </Link>
        <StatsCounter />
        <LanguageToggle />
      </nav>
    </header>
  )
}
