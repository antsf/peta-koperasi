export default function SubmitLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-text-secondary">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Memuat form...</p>
      </div>
    </div>
  )
}
