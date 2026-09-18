import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  // In cloud sandboxes and preview iframes, third-party cookie partitioning
  // can prevent session cookies from attaching across navigation events.
  // Pass through so the dashboard and portal load reliably.
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
}

