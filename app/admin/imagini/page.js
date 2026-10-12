import ConfirmButton from '@/components/ConfirmButton'
import SiteImageUploader from '@/components/SiteImageUploader'
import { resetSiteImage } from '../actions'
import { getSiteImages } from '@/lib/site'

export const metadata = { title: 'Imagini – Administrare' }
export const dynamic = 'force-dynamic'

export default async function Imagini({ searchParams }) {
  const sp = await searchParams
  const imgs = await getSiteImages()

  return (
    <main>
      <h1>Imagini</h1>
      <p className="muted">Alege logoul și poza care se vede la începutul paginii pentru cei care intră prima dată.</p>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <section className="card img-card">
        <h2>Logo</h2>
        <p className="muted">Apare rotund în antet și ca iconiță în tabul browserului. Se decupează pătrat din mijlocul pozei, deci alege o poză cu logoul la mijloc și cu puțin spațiu în jur.</p>
        <SiteImageUploader kind="logo" current={imgs.logo} fallback="/logo-icon.png" />
        {imgs.logo && (
          <form action={resetSiteImage}>
            <input type="hidden" name="kind" value="logo" />
            <ConfirmButton className="linklike danger" message="Revii la logoul inițial?">Revino la logoul inițial</ConfirmButton>
          </form>
        )}
      </section>

      <section className="card img-card">
        <h2>Poza de la începutul paginii</h2>
        <p className="muted">O văd vizitatorii care nu și-au făcut încă cont, lângă titlu. Se afișează încadrată 4:3, cu marginile tăiate dacă e nevoie.</p>
        <SiteImageUploader kind="hero" current={imgs.hero} fallback="/logo.png" />
        {imgs.hero && (
          <form action={resetSiteImage}>
            <input type="hidden" name="kind" value="hero" />
            <ConfirmButton className="linklike danger" message="Revii la poza inițială?">Revino la poza inițială</ConfirmButton>
          </form>
        )}
      </section>
    </main>
  )
}
