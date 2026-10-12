'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function enrollInLesson(fd) {
  const groupId = String(fd.get('group_id'))
  const lessonDate = String(fd.get('lesson_date') || '')
  const back = (msg) => redirect(`/lectie/${groupId}/${lessonDate}?eroare=${encodeURIComponent(msg)}`)

  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/autentificare')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lessonDate)) redirect('/')

  let childId = String(fd.get('child_id') || '')
  if (childId === 'new') {
    const name = String(fd.get('name') || '').trim()
    if (!name) back('Scrie numele copilului.')
    const { data: child, error } = await sb.from('children').insert({
      parent_id: user.id,
      name,
      birth_date: fd.get('birth_date') || null,
      notes: String(fd.get('notes') || '').trim(),
    }).select('id').single()
    if (error || !child) back('Nu am putut salva copilul. Încearcă din nou.')
    childId = child.id
  } else if (!childId) {
    back('Alege copilul.')
  }

  const { error } = await sb.from('enrollments').insert({
    child_id: childId,
    group_id: groupId,
    lesson_date: lessonDate,
    is_trial: fd.get('is_trial') === 'on',
  })
  if (error) {
    if (error.code === '23505') back('Copilul este deja înscris la această lecție.')
    if (error.code === 'P0001' && error.message) back(error.message)
    back('Nu am putut face înscrierea. Încearcă din nou.')
  }
  redirect(`/cont?ok=${encodeURIComponent('Înscrierea a fost făcută. Poți alege și altă lecție, dacă vrei.')}`)
}
