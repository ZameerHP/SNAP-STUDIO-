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
  console.log(`[EMAIL NOTIFICATION TO: ${adminEmail}]`)
  console.log(`Subject: ${subject}`)
  console.log(`Content: ${html}`)
  if (data) {
    console.log(`Data:`, JSON.stringify(data, null, 2))
  }
  return { success: true }
}
