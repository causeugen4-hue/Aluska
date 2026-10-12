'use client'
import { useActionState } from 'react'

export default function AuthForm({ mode, action }) {
  const [state, formAction, pending] = useActionState(action, {})
  const reg = mode === 'register'

  return (
    <form action={formAction} className="form">
      {reg && (
        <>
          <label>
            Numele tău
            <input name="full_name" autoComplete="name" required />
          </label>
          <label>
            Telefon
            <input name="phone" type="tel" autoComplete="tel" required />
          </label>
        </>
      )}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Parolă {reg && <small>(minim 8 caractere)</small>}
        <input
          name="password"
          type="password"
          autoComplete={reg ? 'new-password' : 'current-password'}
          minLength={reg ? 8 : undefined}
          required
        />
      </label>
      {state?.error && <p className="alert err" role="alert">{state.error}</p>}
      {state?.message && <p className="alert ok" role="status">{state.message}</p>}
      <button className="btn" disabled={pending}>
        {pending ? 'Se încarcă…' : reg ? 'Creează cont' : 'Intră în cont'}
      </button>
    </form>
  )
}
