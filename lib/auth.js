import { headers } from 'next/headers'

// Id-ul utilizatorului, verificat deja în middleware (o singură verificare pe cerere)
export async function currentUserId() {
  return (await headers()).get('x-user-id') || null
}
