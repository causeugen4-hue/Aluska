import Link from 'next/link'
import AuthForm from '@/components/AuthForm'
import { login } from './actions'

export const metadata = { title: 'Autentificare – Alușka Art Studio' }

export default function Page() {
  return (
    <main className="narrow">
      <h1>Autentificare</h1>
      <p className="lead">Intră în cont ca să vezi sau să schimbi înscrierile copiilor.</p>
      <AuthForm mode="login" action={login} />
      <p className="aside">Nu ai cont? <Link href="/inregistrare">Creează cont</Link></p>
    </main>
  )
}
