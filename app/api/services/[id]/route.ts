import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, category, isActive, sortOrder } = body

    const service = await db.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ success: true, service })
  } catch (error: any) {
    console.error('Failed to update service:', error)
    return NextResponse.json({ success: false, error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    await db.service.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete service:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete service' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id: serviceId } = await params
    const body = await req.json()
    const { name, description, price, duration, features } = body

    if (!name || !price) {
      return NextResponse.json({ success: false, error: 'Package name and price are required' }, { status: 400 })
    }

    const pkg = await db.package.create({
      data: {
        serviceId,
        name,
        description: description || '',
        price,
        duration: duration || null,
        features: features ? JSON.stringify(features) : null,
      },
    })

    return NextResponse.json({ success: true, package: pkg }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create package:', error)
    return NextResponse.json({ success: false, error: 'Failed to create package' }, { status: 500 })
  }
}
