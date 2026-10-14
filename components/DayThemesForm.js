'use client'
import { useState } from 'react'
import { saveDayThemes } from '@/app/admin/actions'
import { THEMES } from '@/lib/themes'

// weeks: [{ title, sub, days: [{ date, label }] }], initial: { 'YYYY-MM-DD': 'halloween' }
export default function DayThemesForm({ weeks, initial }) {
  const [vals, setVals] = useState(() => {
    const m = {}
    for (const w of weeks) for (const d of w.days) m[d.date] = initial[d.date] || ''
    return m
  })

  const setDay = (date, v) => setVals((s) => ({ ...s, [date]: v }))
  const setWeek = (w, v) =>
    setVals((s) => {
      const n = { ...s }
      for (const d of w.days) n[d.date] = v
      return n
    })

  const opts = THEMES.map((t) => (
    <option key={t.id} value={t.id}>{t.emoji} {t.id ? t.label : 'Simplu (fără temă)'}</option>
  ))

  return (
    <form action={saveDayThemes} className="stack">
      {weeks.map((w) => (
        <section className="card wide theme-week" key={w.title}>
          <div className="card-head">
            <div>
              <h2 className="theme-week-title">{w.title}</h2>
              <p className="muted">{w.sub}</p>
            </div>
            {w.days.length > 1 && (
              <label className="theme-all">
                Toată săptămâna
                <select value="__" onChange={(e) => e.target.value !== '__' && setWeek(w, e.target.value)}>
                  <option value="__">Alege…</option>
                  {opts}
                </select>
              </label>
            )}
          </div>

          {!w.days.length && <p className="empty">Nu sunt lecții programate în această săptămână.</p>}
          <ul className="theme-days">
            {w.days.map((d) => (
              <li key={d.date}>
                <label>
                  <span className="theme-day-name">{d.label}</span>
                  <select name={`theme__${d.date}`} value={vals[d.date]} onChange={(e) => setDay(d.date, e.target.value)}>
                    {opts}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div><button className="btn">Salvează stilurile</button></div>
    </form>
  )
}
