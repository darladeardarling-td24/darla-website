import { formatDate } from '@/lib/format'
import type { Offer } from '@/lib/types'

/** Ưu đãi trên nền đen: con số/nhãn ưu đãi chữ viền cỡ lớn */
export default function OfferCards({ offers }: { offers: Offer[] }) {
  return (
    <ul className="divide-y divide-veil/15 border-y border-veil/15">
      {offers.map((o) => (
        <li key={o.id} className="grid gap-4 py-8 sm:py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:gap-12">
          <p className="text-outline-veil font-display leading-none tracking-tightest" style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}>
            {o.highlight || 'Ưu đãi'}
          </p>
          <div>
            <h3 className="font-display text-[1.75rem] leading-tight sm:text-[2.25rem]">{o.title}</h3>
            {o.description && <p className="mt-3 max-w-xl text-[1rem] leading-7 text-veil/75">{o.description}</p>}
            <p className="mt-4 text-[0.8125rem] text-veil/50">
              {[o.terms, o.end_date ? `Hạn đến ${formatDate(o.end_date)}` : null].filter(Boolean).join(' ')}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
