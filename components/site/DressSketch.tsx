/** Hình váy nét mảnh dùng thay ảnh khi sản phẩm chưa có ảnh */
export default function DressSketch({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 300" fill="none" stroke="currentColor" strokeWidth="1" className={className} aria-hidden>
      <path d="M88 30 C 90 46, 86 58, 84 70 M112 30 C 110 46, 114 58, 116 70" />
      <path d="M84 70 C 92 76, 108 76, 116 70 L 113 112 C 104 116, 96 116, 87 112 Z" />
      <path d="M87 112 C 70 160, 46 220, 30 278 C 70 290, 130 290, 170 278 C 154 220, 130 160, 113 112" />
      <path d="M100 116 C 98 170, 92 230, 86 286" opacity=".5" />
      <path d="M95 116 C 82 170, 66 226, 56 284" opacity=".35" />
      <path d="M105 116 C 118 170, 134 226, 144 284" opacity=".35" />
    </svg>
  )
}
