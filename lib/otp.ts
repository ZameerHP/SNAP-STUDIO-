import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendEmail, isEmailServiceConfigured } from '@/lib/email'

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * Sends a real 6-digit verification code to the specified email address
 * and persists the expiration timestamp (10 minutes) in the database.
 */
export async function sendEmailOtp(email: string): Promise<{
  success: boolean
  expiresInMinutes: number
  emailServiceConfigured: boolean
  error?: string
}> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      success: false,
      expiresInMinutes: 0,
      emailServiceConfigured: false,
      error: 'Please enter a valid email address.',
    }
  }

  // Rate-limiting check: max 3 requests in the last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  const recentCount = await db.emailOtp.count({
    where: {
      email: cleanEmail,
      createdAt: { gte: tenMinutesAgo },
    },
  })

  if (recentCount >= 5) {
    return {
      success: false,
      expiresInMinutes: 0,
      emailServiceConfigured: isEmailServiceConfigured(),
      error: 'Too many verification attempts. Please wait 10 minutes before requesting another code.',
    }
  }

  const code = generateSecureOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Save to database
  await db.emailOtp.create({
    data: {
      email: cleanEmail,
      code,
      expiresAt,
      verified: false,
    },
  })

  // Deliver real email
  const emailResult = await sendEmail({
    to: cleanEmail,
    subject: 'Your Super Snap Studio Verification Code',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #111;">
        <div style="border-bottom: 2px solid #D7FF3F; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: -0.02em;">SUPER SNAP STUDIO</h2>
          <span style="font-size: 11px; color: #666; font-family: monospace;">VERIFICATION PROTOCOL</span>
        </div>
        <p style="font-size: 14px; line-height: 1.5; color: #333;">
          Use the 6-digit security code below to verify your identity and confirm your studio reservation:
        </p>
        <div style="background: #111; color: #D7FF3F; font-size: 32px; font-weight: 900; letter-spacing: 8px; text-align: center; padding: 18px 24px; border-radius: 6px; margin: 24px 0; font-family: monospace;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #777;">
          This code will expire in 10 minutes. If you did not request this verification code, please ignore this email.
        </p>
        <div style="border-top: 1px solid #eee; margin-top: 24px; padding-top: 12px; font-size: 11px; color: #999;">
          Super Snap Studio • London, Ontario • Biometric, Commercial & Cinema Operations
        </div>
      </div>
    `,
  })

  return {
    success: true,
    expiresInMinutes: 10,
    emailServiceConfigured: emailResult.configured,
    error: !emailResult.configured
      ? 'Note: Transactional email transport is awaiting environment configuration.'
      : undefined,
  }
}

/**
 * Verifies the 6-digit OTP code against the database record.
 * Invalidates the code once successfully verified.
 */
export async function verifyEmailOtp(
  email: string,
  code: string
): Promise<{
  valid: boolean
  error?: string
}> {
  const cleanEmail = email.trim().toLowerCase()
  const cleanCode = code.trim()

  if (!cleanEmail || !cleanCode) {
    return { valid: false, error: 'Email and verification code are required.' }
  }

  const now = new Date()

  // Find latest valid unverified OTP record
  const otpRecord = await db.emailOtp.findFirst({
    where: {
      email: cleanEmail,
      code: cleanCode,
      verified: false,
      expiresAt: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otpRecord) {
    return {
      valid: false,
      error: 'Invalid or expired verification code. Please request a new code.',
    }
  }

  // Mark verified in DB so it cannot be re-used
  await db.emailOtp.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  })

  return { valid: true }
}
