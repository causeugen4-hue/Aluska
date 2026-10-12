'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function ctx() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/autentificare')
  return { sb, user }
}

const back = (msg, type = 'eroare') => redirect(`/cont?${type}=${encodeURIComponent(msg)}`)

export async function addChild(fd) {
  const { sb, user } = await ctx()
  const name = String(fd.get('name') || '').trim()
  if (!name) back('Scrie numele copilului.')
  const { error } = await sb.from('children').insert({
    parent_id: user.id,
    name,
    birth_date: fd.get('birth_date') || null,
    notes: String(fd.get('notes') || '').trim(),
  })
  if (error) back('Nu am putut salva copilul. Încearcă din nou.')
  back(`${name} a fost adăugat. Alege acum o grupă.`, 'ok')
}

export async function deleteChild(fd) {
  const { sb } = await ctx()
  const { error } = await sb.from('children').delete().eq('id', fd.get('child_id'))
  if (error) back('Nu am putut șterge copilul.')
  back('Copilul a fost șters.', 'ok')
}

export async function enroll(fd) {
  const { sb } = await ctx()
  const group_id = fd.get('group_id')
  if (!group_id) back('Alege o grupă.')
  const { error } = await sb.from('enrollments').insert({ child_id: fd.get('child_id'), group_id })
  if (error) {
    if (error.code === '23505') back('Copilul este deja înscris la această grupă.')
    if (error.message?.includes('plină') || error.message?.includes('închise')) back(error.message)
    back('Nu am putut face înscrierea. Încearcă din nou.')
  }
  back('Înscrierea a fost făcută.', 'ok')
}

export async function unenroll(fd) {
  const { sb } = await ctx()
  const { error } = await sb.from('enrollments').delete().eq('id', fd.get('enrollment_id'))
  if (error) back('Nu am putut anula înscrierea.')
  back('Înscrierea a fost anulată.', 'ok')
}

export async function saveProfile(fd) {
  const { sb, user } = await ctx()
  const { error } = await sb.from('profiles').update({
    full_name: String(fd.get('full_name') || '').trim(),
    phone: String(fd.get('phone') || '').trim(),
  }).eq('id', user.id)
  if (error) back('Nu am putut salva datele.')
  back('Datele au fost salvate.', 'ok')
}
