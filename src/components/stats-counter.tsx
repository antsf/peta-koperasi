'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'

export function StatsCounter() {
  const { t } = useTranslation()
  const [count, setCount] = useState<number | null>(null)
  const [displayCount, setDisplayCount] = useState(0)
  const hasAnimated = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(({ data }) => setCount(data?.total_approved ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (count === null || hasAnimated.current) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      hasAnimated.current = true
      observer.disconnect()

      const duration = 1200
      const start = performance.now()
      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayCount(Math.round(eased * count))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [count])

  if (count === null) return null

  return (
    <span
      ref={ref}
      className="inline-flex items-center gap-1.5 text-sm text-text-secondary bg-surface-raised px-2.5 py-1 rounded-full"
    >
      <span className="font-mono font-medium text-primary">{displayCount.toLocaleString('id-ID')}</span>
      <span>{t('home.total_cooperatives')}</span>
    </span>
  )
}
