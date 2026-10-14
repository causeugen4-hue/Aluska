import { Bricolage_Grotesque, Nunito } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

const head = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], variable: '--font-head', display: 'swap' })
const body = Nunito({ subsets: ['latin', 'latin-ext'], variable: '--font-body', display: 'swap' })

export const metadata = {
  title: 'Alușka Art Studio – lecții de pictură pentru copii',
  description: 'Lecții de pictură pentru copii, în grupe mici. Înscrie copilul online.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ro" className={`${head.variable} ${body.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
