'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parse, today, TRIAL_PRICE } from '@/lib/dates'

async function adminCtx() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/autentificare')
  const { data: p } = await sb.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!p?.is_admin) redirect('/cont')
  return sb
}

const go = (path, msg, type = 'ok') => redirect(`${path}?${type}=${encodeURIComponent(msg)}`)

export async function updateEnrollment(fd) {
  const sb = await adminCtx()
  const name = String(fd.get('name') || '').trim()
  if (!name) go('/admin/inscrieri', 'Numele copilului nu poate fi gol.', 'eroare')

  const { error: e1 } = await sb.from('children').update({
    name,
    birth_date: fd.get('birth_date') || null,
  }).eq('id', fd.get('child_id'))
  if (e1) go('/admin/inscrieri', 'Nu am putut salva datele copilului.', 'eroare')

  const { error: e2 } = await sb.from('enrollments').update({ group_id: fd.get('group_id') }).eq('id', fd.get('enrollment_id'))
  if (e2) {
    go('/admin/inscrieri', e2.code === '23505' ? 'Copilul este deja în această grupă.' : (e2.message || 'Nu am putut schimba grupa.'), 'eroare')
  }
  go('/admin/inscrieri', 'Înscrierea a fost salvată.')
}

export async function deleteEnrollment(fd) {
  const sb = await adminCtx()
  const { error } = await sb.from('enrollments').delete().eq('id', fd.get('enrollment_id'))
  if (error) go('/admin/inscrieri', 'Nu am putut șterge înscrierea.', 'eroare')
  go('/admin/inscrieri', 'Înscrierea a fost ștearsă.')
}

export async function saveGroup(fd) {
  const sb = await adminCtx()
  const id = fd.get('id')
  const isTrial = fd.get('is_trial') === 'on'
  const trialDate = isTrial ? String(fd.get('trial_date') || '') : ''
  if (isTrial && !/^\d{4}-\d{2}-\d{2}$/.test(trialDate)) {
    go('/admin/grupe', 'Alege data lecției de probă.', 'eroare')
  }
  const payload = {
    name: String(fd.get('name') || '').trim(),
    weekday: isTrial ? (parse(trialDate).getUTCDay() || 7) : Number(fd.get('weekday')),
    start_time: fd.get('start_time'),
    end_time: fd.get('end_time'),
    price: isTrial ? TRIAL_PRICE : Number(fd.get('price') || 0),
    capacity: Number(fd.get('capacity') || 8),
    is_open: fd.get('is_open') === 'on',
    age_group: fd.get('age_group') === '8-12' ? '8-12' : '4-7',
    trial_date: isTrial ? trialDate : null,
  }
  if (!payload.name) go('/admin/grupe', 'Scrie numele grupei.', 'eroare')
  const { error } = id
    ? await sb.from('groups').update(payload).eq('id', id)
    : await sb.from('groups').insert(payload)
  if (error) go('/admin/grupe', 'Nu am putut salva grupa. Verifică datele.', 'eroare')
  go('/admin/grupe', id ? 'Grupa a fost salvată.' : 'Grupa a fost adăugată.')
}

export async function deleteGroup(fd) {
  const sb = await adminCtx()
  const { error } = await sb.from('groups').delete().eq('id', fd.get('id'))
  if (error) go('/admin/grupe', 'Nu am putut șterge grupa.', 'eroare')
  go('/admin/grupe', 'Grupa a fost ștearsă.')
}

export async function toggleLesson(fd) {
  const sb = await adminCtx()
  const group_id = fd.get('group_id')
  const lesson_date = fd.get('date')
  const isClosed = fd.get('closed') === '1'
  const { error } = isClosed
    ? await sb.from('cancelled_lessons').delete().eq('group_id', group_id).eq('lesson_date', lesson_date)
    : await sb.from('cancelled_lessons').insert({ group_id, lesson_date })
  if (error) go('/admin/grupe', 'Nu am putut schimba lecția.', 'eroare')
  go('/admin/grupe', isClosed ? 'Lecția a fost redeschisă.' : 'Lecția a fost închisă.')
}

// ---------- Galerie ----------
export async function addPhoto(path, caption) {
  const sb = await adminCtx()
  const { error } = await sb.from('gallery_photos').insert({
    path: String(path),
    caption: String(caption || '').trim().slice(0, 120),
  })
  if (error) return { error: 'Nu am putut salva poza.' }
  return { ok: true }
}

export async function deletePhoto(fd) {
  const sb = await adminCtx()
  const id = fd.get('id')
  const { data: ph } = await sb.from('gallery_photos').select('path').eq('id', id).maybeSingle()
  if (ph?.path) await sb.storage.from('gallery').remove([ph.path])
  const { error } = await sb.from('gallery_photos').delete().eq('id', id)
  if (error) go('/admin/galerie', 'Nu am putut șterge poza.', 'eroare')
  go('/admin/galerie', 'Poza a fost ștearsă.')
}

// ---------- Prezență și steluțe ----------
export async function saveAttendance(fd) {
  const sb = await adminCtx()
  const group_id = String(fd.get('group_id'))
  const lesson_date = String(fd.get('date'))
  const to = (msg, type = 'ok') =>
    redirect(`/admin/prezenta?grupa=${group_id}&data=${lesson_date}&${type}=${encodeURIComponent(msg)}`)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(lesson_date) || lesson_date > today()) {
    to('Prezența se poate nota doar pentru lecțiile care au avut loc.', 'eroare')
  }
  const { data: closed } = await sb.from('cancelled_lessons').select('group_id')
    .eq('group_id', group_id).eq('lesson_date', lesson_date)
  if (closed?.length) to('Lecția aceasta este închisă.', 'eroare')

  const present = new Set(fd.getAll('present').map(String))
  const { data: enr } = await sb.from('enrollments').select('child_id').eq('group_id', group_id)
  const enrolled = new Set((enr || []).map((e) => e.child_id))
  const { data: cur } = await sb.from('attendance').select('child_id')
    .eq('group_id', group_id).eq('lesson_date', lesson_date)
  const had = new Set((cur || []).map((c) => c.child_id))

  const toAdd = [...present].filter((id) => enrolled.has(id) && !had.has(id))
  const toRemove = [...had].filter((id) => enrolled.has(id) && !present.has(id))

  if (toRemove.length) {
    const { error: e1 } = await sb.from('attendance').delete()
      .eq('group_id', group_id).eq('lesson_date', lesson_date).in('child_id', toRemove)
    if (e1) to('Nu am putut salva prezența.', 'eroare')
    await sb.from('star_ledger').delete()
      .in('attendance_key', toRemove.map((id) => `${group_id}|${id}|${lesson_date}`))
  }
  if (toAdd.length) {
    const { error: e2 } = await sb.from('attendance')
      .insert(toAdd.map((child_id) => ({ group_id, child_id, lesson_date })))
    if (e2) to('Nu am putut salva prezența.', 'eroare')
  }
  to('Prezența a fost salvată. Steluțele au fost acordate.')
}

// ---------- Magazin ----------
export async function saveItem(fd) {
  const sb = await adminCtx()
  const id = fd.get('id')
  const stock = String(fd.get('stock') ?? '').trim()
  const payload = {
    name: String(fd.get('name') || '').trim(),
    description: String(fd.get('description') || '').trim(),
    price_stars: Number(fd.get('price_stars') || 0),
    stock: stock === '' ? null : Number(stock),
    is_active: fd.get('is_active') === 'on',
  }
  if (!payload.name) go('/admin/magazin', 'Scrie numele produsului.', 'eroare')
  if (!(payload.price_stars > 0)) go('/admin/magazin', 'Prețul în steluțe trebuie să fie cel puțin 1.', 'eroare')
  const { error } = id
    ? await sb.from('shop_items').update(payload).eq('id', id)
    : await sb.from('shop_items').insert(payload)
  if (error) go('/admin/magazin', 'Nu am putut salva produsul. Verifică datele.', 'eroare')
  go('/admin/magazin', id ? 'Produsul a fost salvat.' : 'Produsul a fost adăugat.')
}

export async function deleteItem(fd) {
  const sb = await adminCtx()
  const { error } = await sb.from('shop_items').delete().eq('id', fd.get('id'))
  if (error) go('/admin/magazin', 'Nu am putut șterge produsul.', 'eroare')
  go('/admin/magazin', 'Produsul a fost șters.')
}

export async function markDelivered(fd) {
  const sb = await adminCtx()
  const { error } = await sb.from('shop_orders').update({ status: 'predat' })
    .eq('id', fd.get('id')).eq('status', 'nou')
  if (error) go('/admin/magazin', 'Nu am putut actualiza comanda.', 'eroare')
  go('/admin/magazin', 'Comanda a fost marcată ca predată.')
}

export async function cancelOrder(fd) {
  const sb = await adminCtx()
  const { error } = await sb.rpc('cancel_order', { p_order: fd.get('id') })
  if (error) go('/admin/magazin', error.message || 'Nu am putut anula comanda.', 'eroare')
  go('/admin/magazin', 'Comanda a fost anulată, steluțele au fost returnate.')
}
