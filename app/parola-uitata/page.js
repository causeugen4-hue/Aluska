import Link from 'next/link'
import { ForgotForm } from '@/components/PasswordForms'

export const metadata = { title: 'Ai uitat parola? – Alușka Art Studio' }

export default async function Page({ searchParams }) {
  const sp = await searchParams
  return (
    <main className="narrow">
      <h1>Ai uitat parola?</h1>
      <p className="lead">Scrie emailul cu care ți-ai făcut contul și îți trimitem un link ca să alegi o parolă nouă.</p>
      {sp.eroare && (
        <p className="alert err" role="alert">Linkul nu mai este valid sau a expirat. Cere unul nou mai jos.</p>
      )}
      <ForgotForm />
      <p className="aside"><Link href="/autentificare">← Înapoi la autentificare</Link></p>
    </main>
  )
}
