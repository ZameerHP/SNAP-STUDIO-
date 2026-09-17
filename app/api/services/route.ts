import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { isActive: true },
      include: { packages: { where: { isActive: true } } },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ success: true, services })
  } catch (error: any) {
    console.error('Failed to fetch services:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, category, sortOrder } = body

    if (!name || !description) {
      return NextResponse.json({ success: false, error: 'Name and description are required' }, { status: 400 })
    }

    const service = await db.service.create({
      data: {
        name,
        description,
        category: category || 'Photography',
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json({ success: true, service }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create service:', error)
    return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 500 })
  }
}
