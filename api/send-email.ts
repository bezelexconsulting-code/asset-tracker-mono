import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const { to, subject, html } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!to || !subject || !html) return res.status(400).json({ error: 'Missing fields' });
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `no-reply@${new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost').hostname}`;
    if (!host || !user || !pass) return res.status(500).json({ error: 'SMTP not configured' });

    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    await transporter.sendMail({ from, to, subject, html });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Send failed' });
  }
}
