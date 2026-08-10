'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
        <h2 className="font-heading font-semibold text-xl text-text-primary mb-2">
          Terjadi kesalahan
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          {error.message || 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'}
        </p>
        <button
          onClick={reset}
          className="min-h-11 px-6 py-2.5 bg-primary text-white font-medium rounded-button text-sm transition-[background-color,transform] duration-180 ease-out hover:bg-primary-hover active:scale-[0.97]"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}