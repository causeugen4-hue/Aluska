'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(_prev, fd) {
  const sb = await createClient()
  const { data, error } = await sb.auth.signInWithPassword({
    email: String(fd.get('email')).trim(),
    password: String(fd.get('password')),
  })
  if (error) {
    return { error: error.message?.toLowerCase().includes('confirm')
      ? 'Confirmă mai întâi adresa de email (verifică inbox-ul).'
      : 'Emailul sau parola nu sunt corecte.' }
  }
  const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', data.user.id).single()
  redirect(profile?.is_admin ? '/admin' : '/cont')
}

export async function register(_prev, fd) {
  const password = String(fd.get('password'))
  if (password.length < 8) return { error: 'Parola trebuie să aibă cel puțin 8 caractere.' }

  const sb = await createClient()
  const { data, error } = await sb.auth.signUp({
    email: String(fd.get('email')).trim(),
    password,
    options: {
      data: {
        full_name: String(fd.get('full_name')).trim(),
        phone: String(fd.get('phone')).trim(),
      },
    },
  })
  if (error) {
    return { error: error.message?.toLowerCase().includes('already')
      ? 'Există deja un cont cu acest email. Încearcă să te autentifici.'
      : 'Nu am putut crea contul. Verifică datele și încearcă din nou.' }
  }
  if (!data.session) {
    return { message: 'Contul a fost creat. Verifică emailul, confirmă adresa, apoi autentifică-te.' }
  }
  redirect('/cont')
}

export async function logout() {
  const sb = await createClient()
  await sb.auth.signOut()
  redirect('/')
}
