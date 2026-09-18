import nodemailer from 'nodemailer'

let cachedTransporter: any = null

export function isEmailServiceConfigured(): boolean {
  return !!(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    process.env.RESEND_API_KEY
  )
}

export function getEmailTransporter(): any {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST?.trim()
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()

  if (host && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
    return cachedTransporter
  }

  // Resend SMTP endpoint support
  if (process.env.RESEND_API_KEY) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY.trim(),
      },
    })
    return cachedTransporter
  }

  return null
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean
  configured: boolean
  messageId?: string
  error?: string
}> {
  const transporter = getEmailTransporter()
  const from = process.env.SMTP_FROM || 'Super Snap Studio <notifications@supersnapstudio.com>'

  if (!transporter) {
    console.warn(
      `[Email Service Pending] Real email transport not configured in environment variables (SMTP_HOST/USER/PASS or RESEND_API_KEY required). Attempted to send "${options.subject}" to ${options.to}`
    )
    return {
      success: false,
      configured: false,
      error: 'Transactional email provider credentials not configured in environment variables.',
    }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
    })

    return {
      success: true,
      configured: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error('[Email Send Error]', error)
    return {
      success: false,
      configured: true,
      error: error.message || 'Failed to deliver email through SMTP transport.',
    }
  }
}

export async function sendAdminNotification({
  subject,
  html,
  data,
}: {
  subject: string
  html: string
  data?: Record<string, any>
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'supersnapstudio@gmail.com'
  let fullHtml = html
  if (data) {
    fullHtml += `<hr style="margin:20px 0; border:none; border-top:1px solid #ddd;"/><pre style="font-family:monospace; background:#f4f4f4; padding:12px; border-radius:4px;">${JSON.stringify(
      data,
      null,
      2
    )}</pre>`
  }
  return sendEmail({
    to: adminEmail,
    subject: `[Super Snap Ops] ${subject}`,
    html: fullHtml,
  })
}
