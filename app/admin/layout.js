import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { currentUserId } from '@/lib/auth'

export default async function AdminLayout({ children }) {
  const uid = await currentUserId()
  if (!uid) redirect('/autentificare')
  const sb = await createClient()
  const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', uid).maybeSingle()
  if (!profile?.is_admin) redirect('/cont')

  return (
    <div className="wrap">
      <nav className="subnav" aria-label="Administrare">
        <Link href="/admin">Bani</Link>
        <Link href="/admin/inscrieri">Înscrieri</Link>
        <Link href="/admin/grupe">Grupe și lecții</Link>
        <Link href="/admin/prezenta">Prezență</Link>
        <Link href="/admin/galerie">Galerie</Link>
        <Link href="/admin/magazin">Magazin</Link>
      </nav>
      {children}
    </div>
  )
}
