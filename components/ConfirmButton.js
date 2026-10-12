'use client'

export default function ConfirmButton({ children, message, className, disabled }) {
  return (
    <button
      className={className}
      disabled={disabled}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
