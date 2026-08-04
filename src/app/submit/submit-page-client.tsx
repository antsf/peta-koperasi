'use client'

import dynamic from 'next/dynamic'

const SubmitForm = dynamic(
  () => import('@/components/submit-form').then(m => ({ default: m.SubmitForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

export function SubmitPageClient() {
  return <SubmitForm />
}
