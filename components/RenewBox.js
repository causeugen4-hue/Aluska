import { CONTACT } from '@/lib/contact'

export default function RenewBox() {
  return (
    <div className="renew" role="status">
      <p><strong>Abonamentul s-a terminat.</strong> Reînnoiește-l ca să poți continua cu lecțiile.</p>
      <div className="row tight">
        {CONTACT.phone && <a className="btn small" href={`tel:${CONTACT.phone}`}>Sună pentru reînnoire</a>}
        {CONTACT.instagram && (
          <a className="btn small ghost" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">Scrie-ne pe Instagram</a>
        )}
      </div>
      <p className="muted">După ce achiți, primești un cod nou și îl scrii mai jos, la „Adaugă abonament”.</p>
    </div>
  )
}
