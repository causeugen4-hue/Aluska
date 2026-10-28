'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { requestReset, setNewPassword } from '@/app/autentificare/actions'

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(requestReset, {})
  return (
    <form action={formAction} className="form">
      <label>
        Email
        <input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required />
      </label>
      {state?.error && <p className="alert err" role="alert">{state.error}</p>}
      {state?.message && <p className="alert ok" role="status">{state.message}</p>}
      <button className="btn" disabled={pending}>{pending ? 'Se trimite…' : 'Trimite linkul'}</button>
    </form>
  )
}

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(setNewPassword, {})
  return (
    <form action={formAction} className="form">
      <label>
        Parola nouă <small>(minim 8 caractere)</small>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label>
        Scrie parola încă o dată
        <input name="again" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      {state?.error && (
        <p className="alert err" role="alert">
          {state.error} {state.expired && <Link href="/parola-uitata">Cere un link nou</Link>}
        </p>
      )}
      <button className="btn" disabled={pending}>{pending ? 'Se salvează…' : 'Salvează parola'}</button>
    </form>
  )
}
