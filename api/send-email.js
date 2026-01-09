// Vercel serverless function: POST /api/send-email
// Body: { to: string|string[], subject: string, html: string, replyTo?: string }
import tls from 'tls'

function toBase64(str) { return Buffer.from(String(str), 'utf8').toString('base64') }
function buildMime({ from, to, subject, html, replyTo }) {
  const boundary = '----=_BezBoundary_' + Date.now()
  return [
    `From: ${from}`,
    `To: ${Array.isArray(to) ? to.join(', ') : to}`,
    `Subject: ${subject}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    '',
    'This message requires an HTML-capable email client.',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${boundary}--`,
    '',
    '.',
  ].filter(Boolean).join('\r\n')
}

async function smtpSend({ host, port = 465, username, password, from, to, subject, html, replyTo }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port }, () => {
      let buffer = ''
      const write = (line) => { socket.write(line + '\r\n') }
      socket.on('data', (chunk) => {
        buffer += chunk.toString()
        const lines = buffer.split('\r\n')
        buffer = lines.pop() || ''
        for (const l of lines) {
          if (l.startsWith('220')) {
            write(`EHLO bezassettracker.local`)
          } else if (l.startsWith('250 ') || l.startsWith('250-')) {
            if (l.startsWith('250 ') && l.includes('SIZE')) { write('AUTH LOGIN') }
          } else if (l.startsWith('334 VXNlcm5hbWU6')) {
            write(toBase64(username))
          } else if (l.startsWith('334 UGFzc3dvcmQ6')) {
            write(toBase64(password))
          } else if (l.startsWith('235')) {
            write(`MAIL FROM:<${from}>`)
          } else if (l.startsWith('250 2.1.0 Ok')) {
            write(`RCPT TO:<${Array.isArray(to) ? to[0] : to}>`)
          } else if (l.startsWith('250 2.1.5 Ok')) {
            write('DATA')
          } else if (l.startsWith('354')) {
            const mime = buildMime({ from, to, subject, html, replyTo })
            socket.write(mime + '\r\n')
          } else if (l.startsWith('250 2.0.0 Ok')) {
            write('QUIT')
          } else if (l.startsWith('221')) {
            resolve(true)
          }
        }
      })
      socket.on('error', reject)
    })
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const { to, subject, html, replyTo } = req.body || {}
    if (!to || !subject || !html) {
      res.status(400).json({ error: 'Missing to/subject/html' })
      return
    }
    const ok = await smtpSend({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      username: process.env.SMTP_USER,
      password: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      replyTo: process.env.SMTP_REPLY_TO || replyTo,
    })
    res.status(200).json({ success: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to send email' })
  }
}

