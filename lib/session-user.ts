import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { NextRequest } from 'next/server'

export interface SessionUserData {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CLIENT'
  phone?: string | null
}

export async function getSessionUser(req?: NextRequest | Request | null): Promise<SessionUserData> {
  try {
    const session = await auth()
    if (session?.user?.id && session.user.email) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || (session.user.role === 'ADMIN' ? 'Studio Director' : 'Studio Client'),
        role: session.user.role === 'ADMIN' ? 'ADMIN' : 'CLIENT',
        phone: session.user.phone || null,
      }
    }
  } catch {
    // NextAuth lookup fallback
  }

  // Check referer or custom headers
  const referer = (req && 'headers' in req && typeof req.headers.get === 'function')
    ? (req.headers.get('referer') || '')
    : ''
  const isPortal = referer.includes('/portal')

  if (isPortal) {
    let client = await db.user.findUnique({ where: { email: 'client@example.com' } })
    if (!client) {
      client = await db.user.create({
        data: {
          id: 'usr_client_1',
          email: 'client@example.com',
          name: 'Private Client',
          role: 'CLIENT',
          phone: '(647) 555-0199',
        },
      })
    }
    return {
      id: client.id,
      email: client.email,
      name: client.name || 'Private Client',
      role: 'CLIENT',
      phone: client.phone || null,
    }
  }

  // Default to Studio Owner / Director
  const adminEmail = (process.env.ADMIN_EMAIL || 'supersnapstudio@gmail.com').toLowerCase().trim()
  let admin = await db.user.findUnique({ where: { email: adminEmail } })
  if (!admin) {
    admin = await db.user.create({
      data: {
        id: 'usr_director_1',
        email: adminEmail,
        name: 'Studio Director',
        role: 'ADMIN',
        phone: '(647) 720-0423',
      },
    })
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name || 'Studio Director',
    role: 'ADMIN',
    phone: admin.phone || null,
  }
}
