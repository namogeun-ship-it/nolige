import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// base './' 로 두면 GitHub Pages 서브 경로 등 어떤 정적 호스팅 경로에서도 동작한다
export default defineConfig({
  base: './',
  // 같은 와이파이에 있는 아이패드·휴대폰에서 개발 중인 화면을 바로 열어 보기 위해
  // dev 서버를 로컬 주소가 아닌 랜 주소로도 연다
  server: { host: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        // 아이패드 홈 화면 아이콘에 표시될 이름
        name: '놀이게임',
        short_name: '놀이게임',
        description: '아이들과 함께하는 놀이게임 진행 도우미',
        lang: 'ko',
        display: 'fullscreen',
        orientation: 'any',
        start_url: './',
        scope: './',
        theme_color: '#f97316',
        background_color: '#fffbeb',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 빌드 산출물 전체를 프리캐시해 완전 오프라인 동작 보장
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
