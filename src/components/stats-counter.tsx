'use client'

import { useEffect, useState, useRef } from 'react'

export function StatsCounter() {
  const [count, setCount] = useState<number | null>(null)
  const [displayCount, setDisplayCount] = useState(0)
  const hasAnimated = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(({ data }) => setCount(data?.total_approved ?? 0))
      .catch(() => {/* silent fail — counter just won't show */})
  }, [])

  // Count-up animation triggered by IntersectionObserver
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
        // ease-out
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
      className="hidden md:inline-flex items-center gap-1 text-xs text-text-secondary bg-surface-raised px-2 py-1 rounded-full"
    >
      <span className="font-mono font-medium text-primary">{displayCount.toLocaleString('id-ID')}</span>
      <span>koperasi</span>
    </span>
  )
}
