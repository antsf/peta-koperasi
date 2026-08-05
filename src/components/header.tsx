import Link from 'next/link'
import { StatsCounter } from './stats-counter'

export function Header() {
  return (
    <header className="h-16 shrink-0 bg-surface border-b border-border flex items-center px-4 gap-4 shadow-card z-50 relative">
      <Link
        href="/"
        className="flex items-center gap-2 font-heading font-semibold text-text-primary transition-colors duration-120 hover:text-primary active:scale-[0.97]"
      >
        <span className="text-primary text-xl leading-none" aria-hidden="true">●</span>
        <span className="text-sm sm:text-base truncate">Peta Koperasi Desa Merah Putih</span>
      </Link>

      <div className="flex items-center gap-2 ml-auto">
        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/submit"
            className="flex items-center px-3 py-1.5 text-sm font-medium text-text-secondary rounded-lg transition-colors duration-120 hover:text-primary hover:bg-surface-raised active:scale-[0.97] active:bg-surface-raised"
          >
            + Tambah Koperasi
          </Link>
          <Link
            href="/pending"
            className="flex items-center px-3 py-1.5 text-sm font-medium text-text-secondary rounded-lg transition-colors duration-120 hover:text-primary hover:bg-surface-raised active:scale-[0.97] active:bg-surface-raised"
          >
            Verifikasi
          </Link>
          <StatsCounter />
        </nav>
      </div>
    </header>
  )
}
