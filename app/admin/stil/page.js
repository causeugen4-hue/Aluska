import SpotsBar from '@/components/SpotsBar'
import { setTheme } from '../actions'
import { getTheme } from '@/lib/site'
import { THEMES } from '@/lib/themes'

export const metadata = { title: 'Stil – Administrare' }
export const dynamic = 'force-dynamic'

export default async function Stil({ searchParams }) {
  const sp = await searchParams
  const current = await getTheme()

  return (
    <main>
      <h1>Stil de sărbătoare</h1>
      <p className="muted">
        Alege un stil și cardurile lecțiilor se schimbă pe tot site-ul: culori, bandă colorată sus și o emoji în colț.
        Poți reveni oricând la stilul obișnuit.
      </p>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <form action={setTheme} className="stack">
        <div className="tp-grid">
          {THEMES.map((t) => (
            <label className="tp-opt" key={t.id || 'none'}>
              <input type="radio" name="theme" value={t.id} defaultChecked={current === t.id} />
              <span className="tp-name">{t.emoji} {t.label}</span>
              <div className="tp-box" data-theme={t.id || 'none'} aria-hidden="true">
                <div className="card group-link occ-mid">
                  <p className="chips"><span className="chip">4–7 ani</span></p>
                  <p className="when">Sâmbătă, 10:00–11:30</p>
                  <h3>Exemplu de lecție</h3>
                  <SpotsBar taken={3} capacity={5} />
                  <span className="go">Înscrie copilul →</span>
                </div>
              </div>
            </label>
          ))}
        </div>
        <div><button className="btn">Aplică stilul</button></div>
      </form>
    </main>
  )
}
