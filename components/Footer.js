import { CONTACT } from '@/lib/contact'

const icons = {
  instagram: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.6l.4-3.1h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H8v3.1h2.5V21h3z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  ),
}

export default function Footer() {
  const links = [
    CONTACT.instagram && { key: 'instagram', href: CONTACT.instagram, label: 'Instagram', external: true },
    CONTACT.facebook && { key: 'facebook', href: CONTACT.facebook, label: 'Facebook', external: true },
    CONTACT.phone && { key: 'phone', href: `tel:${CONTACT.phone.replace(/\s/g, '')}`, label: `Sună-ne: ${CONTACT.phone}` },
  ].filter(Boolean)

  return (
    <footer className="foot">
      {links.length > 0 && (
        <div className="contact">
          <h2 className="contact-title">Contact</h2>
          <ul className="contact-list">
            {links.map((l) => (
              <li key={l.key}>
                <a
                  href={l.href}
                  className="contact-icon"
                  aria-label={l.label}
                  title={l.label}
                  {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {icons[l.key]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p>© {new Date().getFullYear()} Alușka Art Studio</p>
    </footer>
  )
}
