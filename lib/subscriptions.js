// Leagă abonamentele de câte lecții au folosit (din funcția subscription_usage)
export function withUsage(subs, usage) {
  const used = Object.fromEntries((usage || []).map((u) => [u.subscription_id, Number(u.used)]))
  return (subs || []).map((s) => {
    const u = used[s.id] || 0
    return { ...s, used: u, remaining: Math.max(0, s.total_lessons - u) }
  })
}

// 1 lecție, 2 lecții, 19 lecții, 20 de lecții
export function lessonsWord(n) {
  const m = n % 100
  if (n === 1) return '1 lecție'
  return m === 0 || m >= 20 ? `${n} de lecții` : `${n} lecții`
}
