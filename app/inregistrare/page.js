import Link from 'next/link'
import AuthForm from '@/components/AuthForm'
import { register } from '../autentificare/actions'

export const metadata = { title: 'Creează cont – Alușka Art Studio' }

export default function Page() {
  return (
    <main className="narrow">
      <h1>Creează cont de părinte</h1>
      <p className="lead">Durează un minut. După ce intri în cont, adaugi copilul și alegi grupa.</p>
      <AuthForm mode="register" action={register} />
      <p className="aside">Ai deja cont? <Link href="/autentificare">Autentifică-te</Link></p>
    </main>
  )
}
