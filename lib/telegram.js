// Notificări pe Telegram pentru administrator.
// Se trimit doar dacă sunt setate TELEGRAM_BOT_TOKEN și TELEGRAM_CHAT_ID (în Vercel).
// Dacă trimiterea eșuează, nu se întâmplă nimic: înscrierea sau contul se fac oricum.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

export async function notifyTelegram(html) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  // Mai multe id-uri se scriu separate prin virgulă: 123456789,987654321
  const chats = String(process.env.TELEGRAM_CHAT_ID || '').split(/[,\s;]+/).filter(Boolean)
  if (!token || !chats.length) return
  await Promise.all(
    chats.map(async (chat) => {
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chat, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
          signal: AbortSignal.timeout(4000),
        })
      } catch {
        // ignorăm: o notificare eșuată (sau un id greșit) nu trebuie să strice fluxul sau celelalte mesaje
      }
    })
  )
}
