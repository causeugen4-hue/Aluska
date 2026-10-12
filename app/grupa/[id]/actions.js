'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function ctx() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/autentificare')
  return { sb, user }
}

const back = (id, msg) => redirect(`/grupa/${id}?eroare=${encodeURIComponent(msg)}`)
const done = (msg) => redirect(`/cont?ok=${encodeURIComponent(msg)}`)

async function doEnroll(sb, groupId, childId) {
  const { error } = await sb.from('enrollments').insert({ child_id: childId, group_id: groupId })
  if (error) {
    if (error.code === '23505') back(groupId, 'Copilul este deja înscris la această grupă.')
    if (error.message?.includes('plină') || error.message?.includes('închise')) back(groupId, error.message)
    back(groupId, 'Nu am putut face înscrierea. Încearcă din nou.')
  }
}

export async function enrollExisting(fd) {
  const groupId = String(fd.get('group_id'))
  const { sb } = await ctx()
  const childId = fd.get('child_id')
  if (!childId) back(groupId, 'Alege copilul.')
  await doEnroll(sb, groupId, childId)
  done('Înscrierea a fost făcută.')
}

export async function enrollNewChild(fd) {
  const groupId = String(fd.get('group_id'))
  const { sb, user } = await ctx()
  const name = String(fd.get('name') || '').trim()
  if (!name) back(groupId, 'Scrie numele copilului.')

  const { data: child, error } = await sb.from('children').insert({
    parent_id: user.id,
    name,
    birth_date: fd.get('birth_date') || null,
    notes: String(fd.get('notes') || '').trim(),
  }).select('id').single()
  if (error || !child) back(groupId, 'Nu am putut salva copilul. Încearcă din nou.')

  await doEnroll(sb, groupId, child.id)
  done(`${name} a fost înscris.`)
}
