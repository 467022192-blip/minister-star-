import type { Metadata } from 'next'
import { Newsreader, Roboto } from 'next/font/google'
import './globals.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  weight: ['400', '500', '600', '700'],
})

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['300', '400', '500', '700'],
})

export const metadata: Metadata = {
  title: '紫微内容增长站',
  description: '先做轻测试，再进入真实紫微排盘与分层解读。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${newsreader.variable} ${roboto.variable}`}>
      <body className="bg-paper font-body text-ink antialiased">{children}</body>
    </html>
  )
}
