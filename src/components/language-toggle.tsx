'use client'

import { useTranslation } from '@/lib/i18n'

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="flex items-center gap-0.5 bg-surface-raised rounded-lg p-0.5">
      <button
        onClick={() => setLocale('id')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-120 min-w-[36px] ${
          locale === 'id'
            ? 'bg-surface text-primary shadow-card'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="Bahasa Indonesia"
        aria-pressed={locale === 'id'}
      >
        ID
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-120 min-w-[36px] ${
          locale === 'en'
            ? 'bg-surface text-primary shadow-card'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="English"
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  )
}
