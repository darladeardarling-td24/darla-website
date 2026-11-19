/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        oyster: '#EAE3D6',   // nền be chủ đạo
        stone: '#D9CEBD',    // be đậm cho khối phụ
        veil: '#F7F3EC',     // trắng ngà cho bề mặt sáng
        taupe: '#857565',    // chữ phụ (nâu xám ấm)
        mink: '#A89A88',     // đường kẻ, viền
        ink: '#2B231E',      // nâu espresso: chữ đọc & nền tối (thay đen thuần)
        latte: '#8C7558',    // be latte: logo & tiêu đề trên ảnh sáng
        mocha: '#7D6650',    // nâu mocha: nút chính, lựa chọn đang chọn
        champagne: '#D2C1A6', // tiêu đề trên nền tối
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { tightest: '-0.045em' },
      maxWidth: { page: '1440px' },
    },
  },
  plugins: [],
}
