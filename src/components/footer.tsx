export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-4 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-disabled">
        <span>
          © {new Date().getFullYear()} Peta Koperasi Merah Putih ·{' '}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors duration-120"
          >
            MIT License
          </a>
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors duration-120"
          >
            GitHub
          </a>
          <span>·</span>
          <span>Data dari komunitas · Peta dari OpenStreetMap</span>
        </div>
      </div>
    </footer>
  )
}
