/**
 * i18n utility for bilingual UI (Bahasa Indonesia + English).
 * - Server components: use getTranslation(locale)
 * - Client components: use useTranslation() hook
 *
 * All user-facing strings live in messages/id.json and messages/en.json.
 * Never hardcode Indonesian or English text in components.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Locale } from '@/types'

const LOCALE_KEY = 'locale'
const DEFAULT_LOCALE: Locale = 'id'

// Type for nested translation objects
type Messages = { [key: string]: string | Messages }

// In-memory cache for loaded messages
const cache: Partial<Record<Locale, Messages>> = {}

async function loadMessages(locale: Locale): Promise<Messages> {
  if (cache[locale]) return cache[locale]!
  const messages = await import(`../../messages/${locale}.json`)
  cache[locale] = messages.default as Messages
  return cache[locale]!
}

/**
 * Resolve a dot-separated key path like "home.title" from nested messages.
 */
function resolve(messages: Messages, key: string): string {
  const parts = key.split('.')
  let current: string | Messages = messages
  for (const part of parts) {
    if (typeof current !== 'object' || !(part in current)) {
      return key // fallback to key if missing
    }
    current = current[part]
  }
  return typeof current === 'string' ? current : key
}

/**
 * Client-side hook for accessing translations.
 * Reads locale from localStorage, defaults to 'id'.
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [messages, setMessages] = useState<Messages>({})

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY) as Locale | null
    const active = stored === 'en' ? 'en' : 'id'
    setLocaleState(active)
    loadMessages(active).then(setMessages)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(LOCALE_KEY, next)
    setLocaleState(next)
    loadMessages(next).then(setMessages)
  }, [])

  const t = useCallback(
    (key: string) => resolve(messages, key),
    [messages]
  )

  return { t, locale, setLocale }
}

/**
 * Server-side translation loader.
 * Pass locale from a cookie or default to 'id'.
 * Usage: const t = await getTranslation('id'); t('home.title')
 */
export async function getTranslation(locale: Locale = DEFAULT_LOCALE) {
  const messages = await loadMessages(locale)
  return (key: string) => resolve(messages, key)
}
