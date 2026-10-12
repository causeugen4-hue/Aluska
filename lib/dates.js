export const ZILE = ['', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică']

export const hm = (t) => (t ? t.slice(0, 5) : '')
export const iso = (d) => d.toISOString().slice(0, 10)
export const parse = (s) => new Date(s + 'T00:00:00Z')
export const today = () =>
  new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Chisinau' })

export function addDays(s, n) {
  const d = parse(s)
  d.setUTCDate(d.getUTCDate() + n)
  return iso(d)
}

export function mondayOf(s) {
  const d = parse(s)
  const w = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - (w - 1))
  return iso(d)
}

export function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number)
  return {
    from: iso(new Date(Date.UTC(y, m - 1, 1))),
    to: iso(new Date(Date.UTC(y, m, 0))),
  }
}

export function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number)
  return iso(new Date(Date.UTC(y, m - 1 + n, 1))).slice(0, 7)
}

export function datesOfWeekday(weekday, from, to) {
  const out = []
  let cur = from
  while (cur <= to) {
    if ((parse(cur).getUTCDay() || 7) === weekday) out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

export const fmtDate = (s) =>
  parse(s).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', timeZone: 'UTC' })

export const fmtDateLong = (s) =>
  parse(s).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export const fmtMonth = (ym) =>
  parse(ym + '-01').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function age(b) {
  if (!b) return ''
  const d = parse(b)
  const n = new Date()
  let a = n.getUTCFullYear() - d.getUTCFullYear()
  const m = n.getUTCMonth() - d.getUTCMonth()
  if (m < 0 || (m === 0 && n.getUTCDate() < d.getUTCDate())) a--
  return a === 1 ? '1 an' : `${a} ani`
}

export const lei = (n) => new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(n) + ' lei'

export const TRIAL_PRICE = 130
export const AGE_LABELS = { '4-7': '4–7 ani', '8-12': '8–12 ani' }
export const ageLabel = (g) => AGE_LABELS[g.age_group] || AGE_LABELS['4-7']

export const slot = (g) => `${ZILE[g.weekday]}, ${hm(g.start_time)}–${hm(g.end_time)}`

export const priceLabel = (g) => `${lei(g.price)} pe lecție`

// Prima lecție a copilului poate fi lecție de probă, cu preț redus
export const enrollmentPriceLabel = (g, e) =>
  e?.is_trial ? `${lei(TRIAL_PRICE)}, lecție de probă` : e?.subscription_id ? 'din abonament' : priceLabel(g)


export const fmtDay = (s) =>
  parse(s).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export function nowParts() {
  const [date, time] = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Europe/Chisinau' })
    .split(/\s+/)
  return { date, time: time.slice(0, 5) }
}

export const isLessonDate = (g, d) =>
  (parse(d).getUTCDay() || 7) === g.weekday

export function hasStarted(g, d) {
  const { date, time } = nowParts()
  return d < date || (d === date && hm(g.start_time) <= time)
}

// Lecțiile din săptămâna aceasta (de azi încolo) și din săptămâna următoare
export function lessonsWindow(groups, cancelled, taken) {
  const t = today()
  const mon = mondayOf(t)
  const split = addDays(mon, 6)
  const end = addDays(mon, 13)
  const out = []
  for (const g of groups) {
    const dates = datesOfWeekday(g.weekday, t, end)
    for (const d of dates) {
      if (d < t || d > end || cancelled.has(`${g.id}|${d}`) || hasStarted(g, d)) continue
      const tk = taken[`${g.id}|${d}`] || 0
      out.push({ g, date: d, taken: tk, full: tk >= g.capacity, available: g.is_open && tk < g.capacity })
    }
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || a.g.start_time.localeCompare(b.g.start_time))
  return {
    thisWeek: out.filter((x) => x.date <= split),
    nextWeek: out.filter((x) => x.date > split),
    range: { mon, split, next: addDays(mon, 7), end },
  }
}

// Cât de ocupată e o lecție (ok = liberă, mid = pe jumătate, high = aproape plină, full = plină)
export function occupancyLevel(taken, capacity, open = true) {
  if (!open) return 'closed'
  if (taken >= capacity) return 'full'
  const pct = capacity > 0 ? taken / capacity : 0
  return pct >= 0.8 ? 'high' : pct >= 0.6 ? 'mid' : 'ok'
}
