import { focusClass, type Focus } from '@/lib/home-slots'
import type { Img } from '@/lib/types'
import DressSketch from './DressSketch'

type Props = {
  img: Img | null | undefined
  alt: string
  variant?: 'thumb' | 'full'
  className?: string
  tone?: 'stone' | 'veil' | 'dark'
  eager?: boolean
  focus?: Focus | null
}

/** Ảnh sản phẩm; nếu chưa có ảnh thì hiện hình váy nét mảnh trên nền be */
export default function Media({ img, alt, variant = 'thumb', className = '', tone = 'stone', eager, focus }: Props) {
  if (img?.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={variant === 'thumb' ? img.thumb || img.url : img.url}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`h-full w-full object-cover ${focusClass(focus)} ${className}`}
        style={img.fx !== undefined && img.fy !== undefined ? { objectPosition: `${img.fx}% ${img.fy}%` } : undefined}
      />
    )
  }
  const bg = tone === 'dark' ? 'bg-[#1c1a17] text-mink/60' : tone === 'veil' ? 'bg-veil text-mink' : 'bg-stone text-taupe/70'
  return (
    <div role="img" aria-label={alt} className={`flex h-full w-full items-end justify-center overflow-hidden ${bg} ${className}`}>
      <DressSketch className="h-[86%] w-auto" />
    </div>
  )
}
