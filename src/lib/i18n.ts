/**
 * i18n utility for bilingual UI (Bahasa Indonesia + English).
 * - Wrap the app with <LocaleProvider> from @/components/locale-provider
 * - Client components: useTranslation() hook
 * - Server components: getTranslation(locale)
 */

'use client'

import { createContext, useContext, useCallback } from 'react'
import type { Locale } from '@/types'

export const LOCALE_KEY = 'locale'
export const DEFAULT_LOCALE: Locale = 'id'

export type Messages = { [key: string]: string | Messages }

// In-memory cache so each locale file loads once per session
const cache: Partial<Record<Locale, Messages>> = {}

export async function loadMessages(locale: Locale): Promise<Messages> {
  if (cache[locale]) return cache[locale]!
  const mod = await import(`../../messages/${locale}.json`)
  cache[locale] = mod.default as Messages
  return cache[locale]!
}

export function resolve(messages: Messages, key: string): string {
  const parts = key.split('.')
  let current: string | Messages = messages
  for (const part of parts) {
    if (typeof current !== 'object' || !(part in current)) return key
    current = current[part]
  }
  return typeof current === 'string' ? current : key
}

// ---------------------------------------------------------------------------
// Shared context — single source of truth for locale across all components
// ---------------------------------------------------------------------------

export interface LocaleContextValue {
  locale: Locale
  setLocale: (next: Locale) => void
  t: (key: string) => string
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
})

/**
 * Client-side hook — reads from shared LocaleProvider context.
 * Must be used inside <LocaleProvider>.
 */
export function useTranslation() {
  return useContext(LocaleContext)
}

/**
 * Server-side translation loader.
 * Usage: const t = await getTranslation('id'); t('home.title')
 */
export async function getTranslation(locale: Locale = DEFAULT_LOCALE) {
  const messages = await loadMessages(locale)
  return (key: string) => resolve(messages, key)
}
