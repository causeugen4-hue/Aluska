import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SpotsBar from '@/components/SpotsBar'
import GroupMeta from '@/components/GroupMeta'
import { slot, priceLabel, notExpired } from '@/lib/dates'
import { enrollExisting, enrollNewChild } from './actions'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f-]{36}$/i

export default async function Grupa({ params, searchParams }) {
  const { id } = await params
  const sp = await searchParams
  if (!UUID.test(id)) notFound()

  const sb = await createClient()
  const [{ data: { user } }, { data: g }, { data: spots }] = await Promise.all([
    sb.auth.getUser(),
    sb.from('groups').select('*').eq('id', id).maybeSingle(),
    sb.rpc('group_spots'),
  ])
  if (!g) notFound()

  const taken = Number((spots || []).find((s) => s.group_id === g.id)?.taken || 0)
  const free = g.capacity - taken
  const canEnroll = g.is_open && free > 0 && notExpired(g)

  let children = []
  if (user) {
    const { data } = await sb
      .from('children')
      .select('id,name,enrollments(group_id)')
      .eq('parent_id', user.id)
      .order('created_at')
    children = data || []
  }
  const eligible = children.filter((c) => !c.enrollments.some((e) => e.group_id === g.id))

  return (
    <main className="wrap">
      <p><Link href="/#grupe">← Toate grupele</Link></p>

      <article className="card wide group-detail">
        <GroupMeta g={g} />
        <p className="when">{slot(g)}</p>
        <h1 className="page-title">{g.name}</h1>
        <p className="muted">{priceLabel(g)}</p>
        <SpotsBar taken={taken} capacity={g.capacity} open={g.is_open} />
        <p className={canEnroll ? 'tag good' : 'tag'}>
          {!g.is_open ? 'Înscrieri închise' : free <= 0 ? 'Grupă plină' : free === 1 ? 'Un singur loc liber' : `${free} locuri libere`}
        </p>
      </article>

      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      {!canEnroll && <p className="empty">Nu se mai poate face înscrierea la această grupă.</p>}

      {canEnroll && !user && (
        <section>
          <h2>Înscrie copilul</h2>
          <p className="lead">Ca să înscrii copilul, intră în cont sau creează unul.</p>
          <div className="row">
            <Link href="/inregistrare" className="btn">Creează cont</Link>
            <Link href="/autentificare" className="btn ghost">Autentificare</Link>
          </div>
        </section>
      )}

      {canEnroll && user && (
        <section>
          <h2>Înscrie copilul</h2>

          {eligible.length > 0 && (
            <form action={enrollExisting} className="form card">
              <input type="hidden" name="group_id" value={g.id} />
              <label>
                Alege copilul
                <select name="child_id" required defaultValue="">
                  <option value="" disabled>Alege copilul</option>
                  {eligible.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <button className="btn">Înscrie la această grupă</button>
            </form>
          )}

          {children.length > 0 && eligible.length === 0 && (
            <p className="muted">Toți copiii tăi sunt deja înscriși la această grupă.</p>
          )}

          <h3 className="sub">{children.length ? 'Sau înscrie un alt copil' : 'Datele copilului'}</h3>
          <form action={enrollNewChild} className="form card">
            <input type="hidden" name="group_id" value={g.id} />
            <label>Numele copilului<input name="name" required /></label>
            <label>Data nașterii<input name="birth_date" type="date" /></label>
            <label>Observații <small>(alergii, dorințe, opțional)</small><input name="notes" /></label>
            <button className="btn">Adaugă copilul și înscrie-l</button>
          </form>
        </section>
      )}
    </main>
  )
}
