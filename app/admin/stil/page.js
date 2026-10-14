import DayThemesForm from '@/components/DayThemesForm'
import { createClient } from '@/lib/supabase/server'
import { getDayThemes } from '@/lib/site'
import { THEMES } from '@/lib/themes'
import { today, mondayOf, addDays, datesOfWeekday, fmtDate, fmtDay, cap } from '@/lib/dates'

export const metadata = { title: 'Stil – Administrare' }
export const dynamic = 'force-dynamic'

export default async function Stil({ searchParams }) {
  const sp = await searchParams
  const sb = await createClient()
  const [{ data: groups }, themes] = await Promise.all([sb.from('groups').select('weekday'), getDayThemes()])

  const t = today()
  const mon = mondayOf(t)
  const split = addDays(mon, 6)
  const end = addDays(mon, 13)
  const dates = new Set()
  for (const g of groups || []) for (const d of datesOfWeekday(g.weekday, t, end)) dates.add(d)
  const sorted = [...dates].sort()
  const day = (d) => ({ date: d, label: cap(fmtDay(d)) })

  const weeks = [
    { title: 'Săptămâna aceasta', sub: `${fmtDate(mon)} – ${fmtDate(split)}`, days: sorted.filter((d) => d <= split).map(day) },
    { title: 'Săptămâna viitoare', sub: `${fmtDate(addDays(mon, 7))} – ${fmtDate(end)}`, days: sorted.filter((d) => d > split).map(day) },
  ]

  return (
    <main>
      <h1>Stil de sărbătoare</h1>
      <p className="muted">
        Alege pentru fiecare zi cu lecții un stil: {THEMES.filter((x) => x.id).map((x) => `${x.emoji} ${x.label}`).join(', ')}.
        Cardurile lecțiilor din ziua aceea se schimbă (culori, bandă colorată sus, emoji în colț), iar celelalte zile rămân simple.
        Cu „Toată săptămâna” setezi dintr-o dată toate zilele.
      </p>
      {sp.ok && <p className="alert ok" role="status">{sp.ok}</p>}
      {sp.eroare && <p className="alert err" role="alert">{sp.eroare}</p>}

      <DayThemesForm weeks={weeks} initial={themes} />
    </main>
  )
}
