'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { withUsage } from '@/lib/subscriptions'
import { notifyTelegram, esc } from '@/lib/telegram'
import { fmtDay, cap, hm, lei, TRIAL_PRICE } from '@/lib/dates'

async function notifyEnrollment({ sb, childId, groupId, lessonDate, isTrial, subscriptionId, leftAfter }) {
  try {
    const [{ data: child }, { data: g }] = await Promise.all([
      sb.from('children').select('name,birth_date,parent:profiles(full_name,phone)').eq('id', childId).maybeSingle(),
      sb.from('groups').select('name,start_time,end_time,price').eq('id', groupId).maybeSingle(),
    ])
    const plata = isTrial
      ? `lecție de probă, ${lei(TRIAL_PRICE)}`
      : subscriptionId
        ? `abonament (mai are ${Math.max(0, leftAfter)})`
        : g ? `${lei(g.price)}` : ''
    await notifyTelegram(
      `🎨 <b>Înscriere nouă</b>\n` +
      `Copil: <b>${esc(child?.name)}</b>\n` +
      `Grupa: ${esc(g?.name)}\n` +
      `Lecția: ${esc(cap(fmtDay(lessonDate)))}${g ? `, ${hm(g.start_time)}–${hm(g.end_time)}` : ''}\n` +
      `Plată: ${esc(plata)}\n` +
      `Părinte: ${esc(child?.parent?.full_name)}, ${esc(child?.parent?.phone)}`
    )
  } catch {
    // notificarea nu trebuie să strice înscrierea
  }
}

export async function enrollInLesson(fd) {
  const groupId = String(fd.get('group_id'))
  const lessonDate = String(fd.get('lesson_date') || '')
  const back = (msg) => redirect(`/lectie/${groupId}/${lessonDate}?eroare=${encodeURIComponent(msg)}`)

  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/autentificare')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lessonDate)) redirect('/')

  // Plata cu abonament: alegem primul abonament al părintelui care mai are lecții
  const pay = String(fd.get('pay') || '')
  let subscriptionId = null
  let leftAfter = 0
  if (pay === 'sub') {
    const [{ data: subs }, { data: usage }] = await Promise.all([
      sb.from('subscriptions').select('id,total_lessons,created_at').eq('parent_id', user.id).order('created_at'),
      sb.rpc('subscription_usage'),
    ])
    const list = withUsage(subs, usage)
    const pick = list.find((s) => s.remaining > 0)
    if (!pick) back('Abonamentul nu mai are lecții disponibile.')
    subscriptionId = pick.id
    leftAfter = list.reduce((a, s) => a + s.remaining, 0) - 1
  }

  let childId = String(fd.get('child_id') || '')
  if (childId === 'new') {
    const name = String(fd.get('name') || '').trim()
    if (!name) back('Scrie numele copilului.')
    // Dacă părintele are deja un copil cu același nume (de exemplu după o dublă apăsare), îl folosim pe acela
    const { data: mine } = await sb.from('children').select('id,name').eq('parent_id', user.id)
    const same = (mine || []).find((c) => c.name.trim().toLowerCase() === name.toLowerCase())
    if (same) {
      childId = same.id
    } else {
      const { data: child, error } = await sb.from('children').insert({
        parent_id: user.id,
        name,
        birth_date: fd.get('birth_date') || null,
        notes: String(fd.get('notes') || '').trim(),
      }).select('id').single()
      if (error || !child) back('Nu am putut salva copilul. Încearcă din nou.')
      childId = child.id
    }
  } else if (!childId) {
    back('Alege copilul.')
  }

  // Dacă înscrierea există deja (a doua apăsare pe buton), nu o repetăm și nu scădem din nou abonamentul
  const { data: already } = await sb.from('enrollments').select('id')
    .eq('child_id', childId).eq('group_id', groupId).eq('lesson_date', lessonDate).maybeSingle()
  if (already) redirect(`/cont?ok=${encodeURIComponent('Copilul este înscris la această lecție.')}`)

  const { error } = await sb.from('enrollments').insert({
    child_id: childId,
    group_id: groupId,
    lesson_date: lessonDate,
    is_trial: pay !== 'sub' && (fd.get('is_trial') === 'on' || pay === 'trial'),
    subscription_id: subscriptionId,
  })
  if (error) {
    if (error.code === '23505') redirect(`/cont?ok=${encodeURIComponent('Copilul este înscris la această lecție.')}`)
    if (error.code === 'P0001' && error.message) back(error.message)
    back('Nu am putut face înscrierea. Încearcă din nou.')
  }
  const isTrial = pay !== 'sub' && (fd.get('is_trial') === 'on' || pay === 'trial')
  await notifyEnrollment({ sb, childId, groupId, lessonDate, isTrial, subscriptionId, leftAfter })

  if (subscriptionId) {
    const msg = leftAfter <= 0
      ? 'Înscrierea a fost făcută. Ai folosit ultima lecție din abonament, reînnoiește-l mai jos.'
      : `Înscrierea a fost făcută. Mai ai ${leftAfter} ${leftAfter === 1 ? 'lecție' : 'lecții'} în abonament.`
    redirect(`/cont?ok=${encodeURIComponent(msg)}`)
  }
  redirect(`/cont?ok=${encodeURIComponent('Înscrierea a fost făcută. Poți alege și altă lecție, dacă vrei.')}`)
}
