import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { inquirySchema } from '@/lib/validations'
import { sendAdminNotification } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = inquirySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, email, phone, service, budget, location, date, message } = validation.data

    const inquiry = await db.inquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        serviceType: service,
        budget: budget || null,
        location: location || null,
        date: date || null,
        message,
        status: 'new',
      },
    })

    // Trigger admin notification
    await sendAdminNotification({
      subject: `New Studio Inquiry: ${name} (${service})`,
      html: `
        <h2>New Client Inquiry Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Budget / Tier:</strong> ${budget || 'Not specified'}</p>
        <p><strong>Location:</strong> ${location || 'Not specified'}</p>
        <p><strong>Preferred Date:</strong> ${date || 'Flexible'}</p>
        <p><strong>Project Brief:</strong></p>
        <blockquote>${message}</blockquote>
        <hr />
        <p><small>Inquiry ID: ${inquiry.id} • Super Snap Studio Platform</small></p>
      `,
      data: { id: inquiry.id, name, email, service },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Inquiry received successfully. Our studio coordinator will contact you shortly.',
        inquiryId: inquiry.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Failed to process inquiry:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while saving your inquiry. Please try again or call the studio directly.',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const inquiries = await db.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, inquiries })
  } catch (error: any) {
    console.error('Failed to fetch inquiries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve inquiries' },
      { status: 500 }
    )
  }
}
