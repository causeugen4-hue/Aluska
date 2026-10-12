import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/autentificare')
  const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/cont')

  return (
    <div className="wrap">
      <nav className="subnav" aria-label="Administrare">
        <Link href="/admin">Bani</Link>
        <Link href="/admin/inscrieri">Înscrieri</Link>
        <Link href="/admin/grupe">Grupe și lecții</Link>
      </nav>
      {children}
    </div>
  )
}
