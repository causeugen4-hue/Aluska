'use client'
import { useFormStatus } from 'react-dom'

// Buton de trimitere: cât timp formularul se trimite, e blocat și arată că se lucrează,
// ca să nu fie apăsat a doua oară.
export default function SubmitButton({ children, pendingText = 'Se trimite…', className = 'btn' }) {
  const { pending } = useFormStatus()
  return (
    <button className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  )
}
