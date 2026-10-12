import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/autentificare/actions'

export default async function Header() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data } = await sb.from('profiles').select('is_admin').eq('id', user.id).single()
    isAdmin = !!data?.is_admin
  }

  return (
    <header className="top">
      <Link href="/" className="brand">
        <span className="dots" aria-hidden="true"><i /><i /><i /></span>
        Alușka <span className="brand-sub">Art Studio</span>
      </Link>
      <nav className="nav">
        <Link href="/#grupe">Grupe</Link>
        {user ? (
          <>
            <Link href="/magazin">Magazin</Link>
            {isAdmin && <Link href="/admin">Administrare</Link>}
            <Link href="/cont">Contul meu</Link>
            <form action={logout}><button className="linklike">Ieși</button></form>
          </>
        ) : (
          <>
            <Link href="/autentificare">Autentificare</Link>
            <Link href="/inregistrare" className="btn small">Creează cont</Link>
          </>
        )}
      </nav>
    </header>
  )
}
