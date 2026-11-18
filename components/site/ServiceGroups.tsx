import { formatPrice } from '@/lib/format'
import { SERVICE_KINDS, type Service, type ServiceKind } from '@/lib/types'
import Media from './Media'

const ORDER: ServiceKind[] = ['makeup', 'venue', 'photo', 'other']

export default function ServiceGroups({ services, withImages = false }: { services: Service[]; withImages?: boolean }) {
  const groups = ORDER.map((k) => ({ kind: k, items: services.filter((s) => s.kind === k) })).filter((g) => g.items.length)
  return (
    <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
      {groups.map((g) => (
        <section key={g.kind} aria-labelledby={`sv-${g.kind}`}>
          <h3 id={`sv-${g.kind}`} className="display-md">{SERVICE_KINDS[g.kind]}</h3>
          <ul className="mt-6 border-b border-ink/15">
            {g.items.map((s) => (
              <li key={s.id} className="grid gap-4 border-t border-ink/15 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8">
                <div className="flex gap-4">
                  {withImages && s.image && (
                    <span className="aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl sm:w-28">
                      <Media img={s.image} alt={s.name} />
                    </span>
                  )}
                  <div>
                    <h4 className="text-[1.125rem] font-medium">{s.name}</h4>
                    {s.description && <p className="mt-1.5 max-w-md text-[0.9375rem] leading-6 text-taupe">{s.description}</p>}
                    {s.features.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {s.features.map((f) => (
                          <li key={f} className="rounded-full bg-veil px-3 py-1 text-[0.8125rem]">{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="font-display text-[1.5rem] leading-none">
                    <span className="mr-1.5 font-sans text-[0.8125rem] text-taupe">từ</span>
                    {formatPrice(s.price_from)}
                  </p>
                  {s.price_note && <p className="meta mt-1.5">{s.price_note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
