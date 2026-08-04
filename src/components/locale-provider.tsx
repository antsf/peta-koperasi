'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  LocaleContext,
  loadMessages,
  resolve,
  LOCALE_KEY,
  DEFAULT_LOCALE,
  type Messages,
} from '@/lib/i18n'
import type { Locale } from '@/types'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [messages, setMessages] = useState<Messages>({})

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY) as Locale | null
    const active: Locale = stored === 'en' ? 'en' : 'id'
    setLocaleState(active)
    loadMessages(active).then(setMessages)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(LOCALE_KEY, next)
    setLocaleState(next)
    loadMessages(next).then(setMessages)
  }, [])

  const t = useCallback((key: string) => resolve(messages, key), [messages])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}
