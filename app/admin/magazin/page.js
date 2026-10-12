import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'
import { saveItem, deleteItem, markDelivered, cancelOrder } from '../actions'
import { fmtDateLong } from '@/lib/dates'

export const metadata = { title: 'Magazin – Administrare' }
export const dynamic = 'force-dynamic'

function ItemFields({ it }) {
  return (
    <>
      {it && <input type="hidden" name="id" value={it.id} />}
      <label>Produs<input name="name" defaultValue={it?.name || ''} required /></label>
      <label>Descriere<input name="description" defaultValue={it?.description || ''} /></label>
      <label>Preț (steluțe)<input type="number" name="price_stars" min="1" defaultValue={it?.price_stars ?? ''} required /></label>
      <label>Stoc <small>(gol = fără limită)</small>
        <input type="number" name="stock" min="0" defaultValue={it?.stock ?? ''} />
      </label>
      <label className="check">
        <input type="checkbox" name="is_active" defaultChecked={it ? it.is_active : true} /> Vizibil în magazin
      </label>
    </>
  )
}

const STATUS = { nou: 'Nouă', predat: 'Predată', anulat: 'Anulată' }

export default async function Magazin({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const [{ data: items }, { data: orders }] = await Promise.all([
    sb.from('shop_items').select('*').order('price_stars'),
    sb.from('shop_orders').select('*, parent:profiles(full_name,phone)').order('created_at', { ascending: false }).limit(50),
  ])
  const open = (orders || []).filter((o) => o.status === 'nou')
  const rest = (orders || []).filter((o) => o.status !== 'nou')

  return (
    <main>
      <h1>Magazin</h1>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <h2>Comenzi noi ({open.length})</h2>
      {!open.length && <p className="empty">Nicio comandă de predat.</p>}
      {open.map((o) => (
        <div className="enrow" key={o.id}>
          <div className="parent">
            <strong>{o.item_name}</strong>
            <span>{o.price_stars} ★</span>
            <span>{o.parent?.full_name}</span>
            <a href={`tel:${o.parent?.phone}`}>{o.parent?.phone}</a>
            <span className="muted">{fmtDateLong(o.created_at.slice(0, 10))}</span>
          </div>
          <div className="row tight">
            <form action={markDelivered}>
              <input type="hidden" name="id" value={o.id} />
              <button className="btn small">Marchează predată</button>
            </form>
            <form action={cancelOrder}>
              <input type="hidden" name="id" value={o.id} />
              <ConfirmButton className="linklike danger" message="Anulezi comanda și returnezi steluțele?">Anulează și returnează steluțele</ConfirmButton>
            </form>
          </div>
        </div>
      ))}

      <h2>Produse</h2>
      <details className="card add">
        <summary>Adaugă un produs</summary>
        <form action={saveItem} className="form grid-form"><ItemFields /><button className="btn">Adaugă produsul</button></form>
      </details>
      {(items || []).map((it) => (
        <section key={it.id} className="block">
          <form action={saveItem} className="form grid-form">
            <ItemFields it={it} />
            <button className="btn small">Salvează</button>
          </form>
          <form action={deleteItem}>
            <input type="hidden" name="id" value={it.id} />
            <ConfirmButton className="linklike danger" message={`Ștergi produsul ${it.name}?`}>Șterge produsul</ConfirmButton>
          </form>
        </section>
      ))}

      {rest.length > 0 && (
        <>
          <h2>Istoric comenzi</h2>
          <ul className="plain">
            {rest.map((o) => (
              <li className="enr" key={o.id}>
                <span>{o.item_name} <span className="muted">· {o.parent?.full_name}</span></span>
                <span className="muted">{STATUS[o.status]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
