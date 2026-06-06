import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '내 자산 관리',
  description: '개인 투자 포트폴리오 대시보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
