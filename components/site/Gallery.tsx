'use client'
import { useState } from 'react'
import type { Img } from '@/lib/types'
import Media from './Media'

export default function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0)
  const current = images[i] ?? null
  return (
    <div>
      <div className="aspect-[3/4] overflow-hidden rounded-[24px]">
        <Media img={current} alt={`${name} — ảnh ${i + 1}`} variant="full" eager />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((im, k) => (
            <button
              key={im.url}
              onClick={() => setI(k)}
              aria-label={`Xem ảnh ${k + 1}`}
              aria-current={k === i}
              className={`aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg transition-opacity sm:w-20 ${k === i ? 'ring-1 ring-ink ring-offset-2 ring-offset-oyster' : 'opacity-60 hover:opacity-100'}`}
            >
              <Media img={im} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
