import { createClient } from '@/lib/supabase/server'
import { adjustStars } from '../actions'
import { fmtDateLong } from '@/lib/dates'

export const metadata = { title: 'Conturi – Administrare' }
export const dynamic = 'force-dynamic'

export default async function Conturi({ searchParams }) {
  const sp = await searchParams
  const q = String(sp.q || '').trim()
  const sb = await createClient()

  let query = sb.from('profiles')
    .select('id,full_name,phone,email,created_at,children(name)')
    .eq('is_admin', false)
    .order('full_name')
    .limit(1000)
  if (q) {
    const s = q.replace(/[%,()*]/g, ' ').trim()
    if (s) query = query.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`)
  }

  const [{ data: parents }, { data: bal }, { data: ledger }] = await Promise.all([
    query,
    sb.rpc('admin_star_balances'),
    sb.from('star_ledger').select('parent_id,amount,reason,created_at').order('created_at', { ascending: false }).limit(1000),
  ])

  const balance = Object.fromEntries((bal || []).map((b) => [b.parent_id, b.balance]))
  const history = {}
  for (const l of ledger || []) (history[l.parent_id] ||= []).length < 6 && history[l.parent_id].push(l)
  const total = (parents || []).reduce((a, p) => a + (balance[p.id] || 0), 0)

  return (
    <main>
      <h1>Conturi</h1>
      <p className="muted">
        {parents?.length || 0} {parents?.length === 1 ? 'cont' : 'conturi'}{q ? ' găsite' : ''}, în total {total} ★.
        Apasă pe un cont ca să vezi detaliile și să adaugi sau să scoți steluțe.
      </p>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <form className="inline-form" method="get">
        <label>Caută <small>(nume, telefon sau email)</small><input name="q" defaultValue={q} /></label>
        <button className="btn small">Caută</button>
        {q && <a className="linklike" href="/admin/conturi">Șterge căutarea</a>}
      </form>

      {!parents?.length && <p className="empty">{q ? 'Niciun cont găsit.' : 'Nu există încă niciun cont.'}</p>}
      <div className="acc-list">
        {(parents || []).map((p) => {
          const n = balance[p.id] || 0
          const kids = (p.children || []).map((c) => c.name)
          return (
            <details className="enrow" key={p.id} open={sp.cont === p.id}>
              <summary className="en-sum">
                <strong>{p.full_name || 'Fără nume'}</strong>
                <span className="chip">★ {n}</span>
                <span className="muted en-parent">{kids.length ? kids.join(', ') : 'fără copii adăugați'}</span>
              </summary>
              <div className="en-body">
                <div className="parent">
                  <a href={`tel:${p.phone}`}>{p.phone}</a>
                  <span className="muted">{p.email}</span>
                  <span className="muted">Cont creat pe {fmtDateLong(String(p.created_at).slice(0, 10))}</span>
                </div>

                <form action={adjustStars} className="inline-form">
                  <input type="hidden" name="parent_id" value={p.id} />
                  <input type="hidden" name="q" value={q} />
                  <label>Steluțe<input type="number" name="amount" min="1" max="1000" required /></label>
                  <label>Acțiune
                    <select name="mode">
                      <option value="add">Adaugă</option>
                      <option value="remove">Scoate</option>
                    </select>
                  </label>
                  <label>Motiv <small>(opțional)</small><input name="reason" maxLength="80" /></label>
                  <button className="btn small">Salvează</button>
                </form>

                {history[p.id]?.length > 0 && (
                  <ul className="star-hist">
                    {history[p.id].map((l, i) => (
                      <li key={i}>
                        <span className={l.amount > 0 ? 'plus' : 'minus'}>{l.amount > 0 ? '+' : ''}{l.amount} ★</span>
                        <span>{l.reason}</span>
                        <span className="muted">{fmtDateLong(String(l.created_at).slice(0, 10))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          )
        })}
      </div>
    </main>
  )
}
