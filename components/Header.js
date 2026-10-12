import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { currentUserId } from '@/lib/auth'
import { logout } from '@/app/autentificare/actions'
import StarsBadge from '@/components/StarsBadge'

export default async function Header() {
  const uid = await currentUserId()
  let isAdmin = false
  let stars = 0
  if (uid) {
    const sb = await createClient()
    const [{ data: p }, { data: s }] = await Promise.all([
      sb.from('profiles').select('is_admin').eq('id', uid).maybeSingle(),
      sb.rpc('my_stars'),
    ])
    isAdmin = !!p?.is_admin
    stars = typeof s === 'number' ? s : 0
  }

  return (
    <header className={uid ? 'top has-stars' : 'top'}>
      <Link href="/" className="brand">
        <img src="/logo-icon.png" alt="" className="brand-logo" width="42" height="55" />
        Alușka <span className="brand-sub">Art Studio</span>
      </Link>
      {uid && <StarsBadge initial={stars} />}
      <nav className="nav">
        <Link href="/#grupe">Lecții</Link>
        {uid ? (
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
