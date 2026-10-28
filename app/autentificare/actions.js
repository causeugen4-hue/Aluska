'use server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { notifyTelegram, esc } from '@/lib/telegram'

export async function login(_prev, fd) {
  const sb = await createClient()
  const { data, error } = await sb.auth.signInWithPassword({
    email: String(fd.get('email')).trim(),
    password: String(fd.get('password')),
  })
  if (error) {
    return { error: error.message?.toLowerCase().includes('confirm')
      ? 'Confirmă mai întâi adresa de email (verifică inbox-ul).'
      : 'Emailul sau parola nu sunt corecte.',
      values: { email: String(fd.get('email')) } }
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
      : 'Nu am putut crea contul.',
      detail: error.message,
      values: { full_name: String(fd.get('full_name')), phone: String(fd.get('phone')), email: String(fd.get('email')) } }
  }
  // identities gol = emailul exista deja (Supabase nu dă eroare în acest caz), nu notificăm
  if (data.user?.identities?.length !== 0) {
    await notifyTelegram(
      `👤 <b>Cont nou</b>\n${esc(fd.get('full_name'))}\nTelefon: ${esc(fd.get('phone'))}\nEmail: ${esc(fd.get('email'))}`
    )
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

export async function requestReset(_prev, fd) {
  const email = String(fd.get('email') || '').trim()
  if (!email) return { error: 'Scrie adresa de email.' }

  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || 'https'
  const sb = await createClient()
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${proto}://${host}/auth/confirm?next=/parola-noua`,
  })
  if (error && (error.status === 429 || /rate limit|seconds/i.test(error.message || ''))) {
    return { error: 'Ai cerut prea des. Așteaptă câteva minute și încearcă din nou.', values: { email } }
  }
  // Același răspuns indiferent dacă emailul are cont sau nu, ca să nu se poată afla ce conturi există
  return {
    message: 'Dacă există un cont cu această adresă, ți-am trimis un email cu linkul pentru parola nouă. Verifică și folderul Spam.',
    values: { email },
  }
}

export async function setNewPassword(_prev, fd) {
  const password = String(fd.get('password') || '')
  if (password.length < 8) return { error: 'Parola trebuie să aibă cel puțin 8 caractere.' }
  if (password !== String(fd.get('again') || '')) return { error: 'Cele două parole nu sunt la fel.' }

  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Linkul a expirat.', expired: true }

  const { error } = await sb.auth.updateUser({ password })
  if (error) {
    return {
      error: /same|different/i.test(error.message || '')
        ? 'Alege o parolă diferită de cea veche.'
        : 'Nu am putut schimba parola. Cere un link nou și încearcă din nou.',
    }
  }
  redirect(`/cont?ok=${encodeURIComponent('Parola a fost schimbată.')}`)
}
