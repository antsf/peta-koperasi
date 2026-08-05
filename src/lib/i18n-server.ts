/**
 * Server-side i18n utility.
 * No 'use client' directive — safe to import in server components.
 * Use this instead of @/lib/i18n in async server components (page.tsx, layout.tsx).
 */

import type { Locale } from '@/types'

type Messages = { [key: string]: string | Messages }

const DEFAULT_LOCALE: Locale = 'id'

import idMessages from '../../messages/id.json'
import enMessages from '../../messages/en.json'

const messagesByLocale: Record<Locale, Messages> = {
  id: idMessages as Messages,
  en: enMessages as Messages,
}

function resolve(messages: Messages, key: string): string {
  const parts = key.split('.')
  let current: string | Messages = messages
  for (const part of parts) {
    if (typeof current !== 'object' || !(part in current)) return key
    current = current[part]
  }
  return typeof current === 'string' ? current : key
}

/**
 * Server-side translation loader.
 * Usage in server components:
 *   const t = await getServerTranslation('id')
 *   t('pending.title')
 */
export async function getServerTranslation(locale: Locale = DEFAULT_LOCALE) {
  const messages = messagesByLocale[locale] ?? messagesByLocale.id
  return (key: string) => resolve(messages, key)
}
