import { redirect } from 'next/navigation'
import { currentUserId } from '@/lib/auth'
import { NewPasswordForm } from '@/components/PasswordForms'

export const metadata = { title: 'Parolă nouă – Alușka Art Studio' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  // Ajungi aici doar prin linkul din email (care te autentifică temporar)
  if (!(await currentUserId())) redirect('/parola-uitata?eroare=1')
  return (
    <main className="narrow">
      <h1>Alege o parolă nouă</h1>
      <p className="lead">După ce o salvezi, rămâi autentificat în cont.</p>
      <NewPasswordForm />
    </main>
  )
}
