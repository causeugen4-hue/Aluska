import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'
import { createSubscription, updateSubscription, deleteSubscription } from '../actions'
import { withUsage, lessonsWord } from '@/lib/subscriptions'
import { fmtDateLong } from '@/lib/dates'

export const metadata = { title: 'Abonamente – Administrare' }
export const dynamic = 'force-dynamic'

export default async function Abonamente({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const [{ data: subsRaw }, { data: usage }] = await Promise.all([
    sb.from('subscriptions')
      .select('id,code,total_lessons,note,parent_id,redeemed_at,created_at,parent:profiles(full_name,phone)')
      .order('created_at', { ascending: false }),
    sb.rpc('subscription_usage'),
  ])
  const subs = withUsage(subsRaw, usage)

  return (
    <main>
      <h1>Abonamente</h1>
      <p className="muted">
        Formezi un cod și îl dai părintelui. El îl scrie în „Contul meu”, iar cu abonamentul se înscrie la lecții.
        Fiecare înscriere scade o lecție; dacă anulează înscrierea, lecția se întoarce. Pentru reînnoire poți mări numărul de lecții sau crea un cod nou.
      </p>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <details className="add" open={!subs.length}>
        <summary>+ Abonament nou</summary>
        <form action={createSubscription} className="form card">
          <label>Numărul de lecții<input name="total_lessons" type="number" min="1" max="200" defaultValue="8" required /></label>
          <label>Cod <small>(lasă gol și se generează singur)</small><input name="code" autoComplete="off" autoCapitalize="characters" /></label>
          <label>Notiță <small>(de ex. numele părintelui, opțional)</small><input name="note" /></label>
          <button className="btn">Creează abonamentul</button>
        </form>
      </details>

      <h2>Toate abonamentele</h2>
      {!subs.length && <p className="empty">Nu ai creat încă niciun abonament.</p>}
      <div className="stack">
        {subs.map((s) => (
          <article className="card wide" key={s.id}>
            <div className="card-head">
              <div>
                <p className="code big-code">{s.code}</p>
                <p className="muted">
                  {s.parent_id
                    ? <>Activat de {s.parent?.full_name || 'părinte'}{s.parent?.phone ? `, ${s.parent.phone}` : ''}{s.redeemed_at ? ` (${fmtDateLong(s.redeemed_at.slice(0, 10))})` : ''}</>
                    : 'Încă neactivat (părintele nu a scris codul)'}
                </p>
              </div>
              <span className={s.remaining === 0 ? 'chip trial' : 'chip'}>
                {s.remaining === 0 ? 'Epuizat' : `${lessonsWord(s.remaining)} rămase`}
              </span>
            </div>
            <p className="muted">Folosite: {s.used} din {s.total_lessons}</p>

            <form action={updateSubscription} className="inline-form">
              <input type="hidden" name="id" value={s.id} />
              <label>Total lecții<input name="total_lessons" type="number" min="1" max="200" defaultValue={s.total_lessons} required /></label>
              <label>Notiță<input name="note" defaultValue={s.note} /></label>
              <button className="btn small">Salvează</button>
            </form>

            <form action={deleteSubscription}>
              <input type="hidden" name="id" value={s.id} />
              <ConfirmButton className="linklike danger" message={`Ștergi abonamentul ${s.code}? Înscrierile deja făcute rămân, dar nu vor mai fi legate de abonament.`}>
                Șterge abonamentul
              </ConfirmButton>
            </form>
          </article>
        ))}
      </div>
    </main>
  )
}
