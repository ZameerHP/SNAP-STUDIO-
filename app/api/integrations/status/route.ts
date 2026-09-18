import { NextResponse } from 'next/server'
import { checkSupabaseHealth, getSupabaseConfig } from '@/lib/supabase'
import { checkSquareHealth } from '@/lib/square'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [supabaseHealth, squareHealth] = await Promise.all([
    checkSupabaseHealth(),
    checkSquareHealth(),
  ])
  const config = getSupabaseConfig()

  const adminEmail = process.env.ADMIN_EMAIL || 'supersnapstudio@gmail.com'

  return NextResponse.json({
    status: 'ok',
    adminEmail,
    integrations: {
      supabase: {
        configured: supabaseHealth.configured,
        connected: supabaseHealth.connected,
        projectRef: supabaseHealth.projectRef,
        url: config.url ? `${config.url.substring(0, 25)}...` : null,
        message: supabaseHealth.message,
      },
      square: {
        configured: squareHealth.configured,
        connected: squareHealth.connected,
        environment: squareHealth.environment,
        locationId: squareHealth.locationId,
        locationName: squareHealth.locationName,
        applicationId: process.env.SQUARE_APPLICATION_ID ? `${process.env.SQUARE_APPLICATION_ID.substring(0, 8)}...` : null,
        message: squareHealth.message,
      },
      database: {
        provider: process.env.DATABASE_URL ? 'PostgreSQL' : 'In-Memory Production Store',
      },
    },
  })
}
