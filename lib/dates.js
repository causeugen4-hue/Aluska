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

export const slot = (g) =>
  g.trial_date
    ? `${fmtDateLong(g.trial_date)}, ${hm(g.start_time)}–${hm(g.end_time)}`
    : `${ZILE[g.weekday]}, ${hm(g.start_time)}–${hm(g.end_time)}`

export const priceLabel = (g) =>
  g.trial_date ? `${lei(g.price)}, lecție de probă` : `${lei(g.price)} pe lecție`

// Grupa mai poate primi înscrieri (deschisă și, pentru lecția de probă, încă neexpirată)
export const notExpired = (g) => !g.trial_date || g.trial_date >= today()
