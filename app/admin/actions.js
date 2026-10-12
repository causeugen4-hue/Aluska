'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
  const payload = {
    name: String(fd.get('name') || '').trim(),
    weekday: Number(fd.get('weekday')),
    start_time: fd.get('start_time'),
    end_time: fd.get('end_time'),
    price: Number(fd.get('price') || 0),
    capacity: Number(fd.get('capacity') || 8),
    is_open: fd.get('is_open') === 'on',
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
