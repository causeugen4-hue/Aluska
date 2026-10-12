import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'
import { buy } from './actions'
import { fmtDateLong } from '@/lib/dates'

export const metadata = { title: 'Magazin – Alușka Art Studio' }
export const dynamic = 'force-dynamic'

const STATUS = { nou: 'Se pregătește', predat: 'Predată', anulat: 'Anulată' }

export default async function Magazin({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/autentificare')

  const [{ data: items }, { data: stars }, { data: orders }, { data: ledger }] = await Promise.all([
    sb.from('shop_items').select('*').eq('is_active', true).order('price_stars'),
    sb.rpc('my_stars'),
    sb.from('shop_orders').select('*').eq('parent_id', user.id).order('created_at', { ascending: false }).limit(10),
    sb.from('star_ledger').select('*').eq('parent_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])
  const balance = stars ?? 0

  return (
    <main className="wrap">
      <h1 className="page-title">Magazinul nostru</h1>
      <p className="stars-big"><span className="star">★</span> {balance} {balance === 1 ? 'steluță' : 'steluțe'}</p>
      <p className="muted">Pentru fiecare lecție la care copilul a fost prezent primești 5 steluțe.</p>

      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      {!items?.length && <p className="empty">Produsele vor apărea aici în curând.</p>}
      <div className="grid">
        {(items || []).map((it) => {
          const out = it.stock !== null && it.stock <= 0
          const afford = balance >= it.price_stars
          return (
            <article className="card" key={it.id}>
              <h3>{it.name}</h3>
              {it.description && <p className="muted">{it.description}</p>}
              <p className="price-stars"><span className="star">★</span> {it.price_stars}</p>
              {out ? (
                <p className="tag">Nu mai este în stoc</p>
              ) : (
                <form action={buy}>
                  <input type="hidden" name="item_id" value={it.id} />
                  <ConfirmButton
                    className="btn small"
                    disabled={!afford}
                    message={`Cumperi „${it.name}” pentru ${it.price_stars} steluțe?`}
                  >
                    {afford ? 'Cumpără' : `Mai ai nevoie de ${it.price_stars - balance}`}
                  </ConfirmButton>
                </form>
              )}
            </article>
          )
        })}
      </div>

      {orders?.length > 0 && (
        <>
          <h2>Comenzile mele</h2>
          <ul className="plain">
            {orders.map((o) => (
              <li className="enr" key={o.id}>
                <span>{o.item_name} <span className="muted">· {o.price_stars} ★ · {fmtDateLong(o.created_at.slice(0, 10))}</span></span>
                <span className="muted">{STATUS[o.status]}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {ledger?.length > 0 && (
        <>
          <h2>Istoricul steluțelor</h2>
          <ul className="plain">
            {ledger.map((l) => (
              <li className="enr" key={l.id}>
                <span>{l.reason}</span>
                <strong>{l.amount > 0 ? `+${l.amount}` : l.amount} ★</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
