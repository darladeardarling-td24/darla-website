/** Dải chữ chạy ngang nền đen — lấy cảm hứng từ ảnh mẫu */
export default function Marquee({ text }: { text: string | null }) {
  const items = (text || 'Váy cưới may đo,Makeup cô dâu,Rạp cưới,Thử váy tại showroom').split(',').map((s) => s.trim()).filter(Boolean)
  const row = [...items, ...items, ...items]
  return (
    <div className="dark-surface overflow-hidden bg-ink py-3.5 text-veil sm:py-4" aria-hidden>
      <div className="marquee-track flex w-max">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {row.map((t, i) => (
              <span key={i} className="flex items-center whitespace-nowrap">
                <span className="px-5 font-display text-lg italic sm:px-7 sm:text-2xl">{t}</span>
                <svg viewBox="0 0 20 20" className="h-3 w-3 text-mink" aria-hidden>
                  <path d="M10 0 L11.2 8.8 L20 10 L11.2 11.2 L10 20 L8.8 11.2 L0 10 L8.8 8.8 Z" fill="currentColor" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
