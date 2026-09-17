import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Super Snap Ops live database...')

  // 1. Create Staff Director Account
  const adminPassword = await bcrypt.hash('AdminPassword2026!', 10)
  const director = await prisma.user.upsert({
    where: { email: 'supersnapstudio@gmail.com' },
    update: {},
    create: {
      email: 'supersnapstudio@gmail.com',
      hashedPassword: adminPassword,
      name: 'Studio Director',
      role: 'DIRECTOR',
      phone: '(647) 720-0423',
    },
  })
  console.log('Director seeded:', director.email)

  // 2. Create Real Client (clients table)
  const client = await prisma.client.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      name: 'Elena Rostova',
      email: 'client@example.com',
      phone: '(519) 555-0199',
    },
  })
  console.log('Client seeded:', client.name)

  // Also create User auth for client login if testing portal
  const clientPassword = await bcrypt.hash('ClientPassword2026!', 10)
  await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      id: client.id,
      email: 'client@example.com',
      hashedPassword: clientPassword,
      name: 'Elena Rostova',
      role: 'CLIENT',
      phone: '(519) 555-0199',
    },
  })

  // 3. Seed Services & Starting Prices (services table)
  const photoService = await prisma.service.create({
    data: {
      category: 'Portrait & Family',
      name: 'Commercial Photography',
      startingPrice: 100.0,
      description: 'Ultra-high resolution commercial, portrait, and architectural photography up to 8K.',
      active: true,
      sortOrder: 1,
      packages: {
        create: [
          {
            name: 'Essential Portrait Session',
            description: 'Half-day studio or on-location shoot with retouched master selects.',
            price: '$100',
            duration: '2 Hours',
            features: JSON.stringify([
              'Up to 8K RAW capture',
              'Online private proof gallery',
              '10 Master retouched high-res deliverables',
              'Full personal & commercial usage license',
            ]),
          },
          {
            name: 'Architectural & Commercial Showcase',
            description: 'Full-day architectural HDR interior/exterior capture with prime tilt-shift optics.',
            price: '$350',
            duration: 'Full Day',
            features: JSON.stringify([
              'Ultra-wide HDR architectural capture',
              'Twilight exterior session included',
              '25 High-resolution plates with retouching',
              'MLS, web, and large-format print-ready exports',
            ]),
          },
        ],
      },
    },
  })

  const videoService = await prisma.service.create({
    data: {
      category: 'Business & Real Estate',
      name: 'Cinema Videography',
      startingPrice: 150.0,
      description: 'Cinema-grade commercial films, brand narratives, and event documentation.',
      active: true,
      sortOrder: 2,
      packages: {
        create: [
          {
            name: 'Brand Story Narrative',
            description: 'High-impact 60-90 second cinematic brand story with DaVinci Resolve color grade.',
            price: '$150',
            duration: 'Half Day',
            features: JSON.stringify([
              '4K / 8K Cinema sensor capture',
              'Dedicated wireless 32-bit float audio suite',
              'DaVinci Resolve professional film color grade',
              '16:9 Cinema cut + 9:16 Social cutdowns',
            ]),
          },
        ],
      },
    },
  })

  const streamService = await prisma.service.create({
    data: {
      category: 'Events & Celebrations',
      name: '4K Live Streaming',
      startingPrice: 120.0,
      description: 'Broadcast-grade multi-camera live streaming for corporate summits and milestones.',
      active: true,
      sortOrder: 3,
      packages: {
        create: [
          {
            name: 'Multi-Cam Live Broadcast',
            description: 'Multi-angle live switching, integrated motion graphics, and redundant cellular bonded uplink.',
            price: '$120',
            duration: 'Up to 4 Hours',
            features: JSON.stringify([
              'Up to 4 synchronized camera angles',
              'Real-time hardware switching & audio mix',
              'Custom branded overlay graphics & lower-thirds',
              'ISO multi-track recording + final master archive',
            ]),
          },
        ],
      },
    },
  })

  await prisma.service.create({
    data: {
      category: 'Documents & ID',
      name: 'Biometric Passport & ID Photos',
      startingPrice: 35.0,
      description: 'Guaranteed government-compliant passport photos by an officially registered Canadian corporation.',
      active: true,
      sortOrder: 4,
      packages: {
        create: [
          {
            name: 'Canadian Passport Official Set',
            description: '2 physical archival printed photos stamped with registered corporate seal + digital biometric copy.',
            price: '$35',
            duration: 'Express 15 Mins',
            features: JSON.stringify([
              'Official Canadian corporate studio stamp',
              'Precision shadowless facial biometric lighting',
              '100% Guaranteed Passport Canada acceptance',
              'Digital biometric file included',
            ]),
          },
        ],
      },
    },
  })

  // 4. Seed Live Inquiry (inquiries table)
  await prisma.inquiry.create({
    data: {
      name: 'Marcus Vance',
      email: 'marcus@vancecorp.ca',
      phone: '(519) 555-8822',
      serviceType: 'Commercial Photography',
      message: 'Need 8K photo coverage for our annual corporate leadership conference in London, Ontario.',
      budget: 'Starting from $100',
      location: 'London, ON',
      date: '2026-11-20',
      status: 'new',
      adminNotes: 'Direct lead from public website hero contact form.',
    },
  })

  // 5. Seed Production Booking (bookings table)
  const booking = await prisma.booking.create({
    data: {
      clientId: client.id,
      serviceId: photoService.id,
      scheduledAt: new Date('2026-10-15T14:00:00Z'),
      location: 'London, ON Studio — 450 Richmond St',
      status: 'scheduled',
      notes: 'Studio portraiture with soft octa lighting setup and prime portrait glass.',
    },
  })

  // 6. Seed Invoice (invoices table)
  await prisma.invoice.create({
    data: {
      clientId: client.id,
      bookingId: booking.id,
      amount: 150.0,
      title: 'Production Invoice — Essential Portrait Session',
      status: 'sent',
      lineItems: JSON.stringify([
        { description: 'Essential Portrait Session (2 Hours)', amount: 100, quantity: 1 },
        { description: 'Archival Fine Art Print Proofs', amount: 50, quantity: 1 },
      ]),
      dueDate: new Date('2026-10-14'),
    },
  })

  // 7. Seed Contract (contracts table)
  await prisma.contract.create({
    data: {
      clientId: client.id,
      bookingId: booking.id,
      title: 'Production Agreement & Image Release',
      content: `PRODUCTION SERVICES AGREEMENT

This Agreement is entered into between Super Snap Studio (the "Studio"), a registered corporation in Canada, and the undersigned Client.

1. SCOPE OF SERVICES: The Studio agrees to provide high-resolution photography / media production services as outlined in the confirmed booking schedule.
2. DELIVERABLES: Digital proof contact sheets will be provided via the private Client Portal within 3 business days of the production session.
3. COPYRIGHT & USAGE: The Client is granted an unrestricted, non-exclusive license for personal and commercial usage. Master RAW capture files remain archived in the Studio vault.`,
      signed: false,
    },
  })

  // 8. Seed Proofing Vault (galleries + gallery_assets table)
  const gallery = await prisma.gallery.create({
    data: {
      clientId: client.id,
      bookingId: booking.id,
      title: 'Elena Rostova — Studio Portrait Proofs',
      accessCode: 'SNAP2026',
    },
  })

  await prisma.galleryAsset.create({
    data: {
      galleryId: gallery.id,
      fileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85',
      fileType: 'image',
    },
  })

  // 9. Seed Livestream (livestreams table)
  await prisma.livestream.create({
    data: {
      clientId: client.id,
      bookingId: booking.id,
      streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      isLive: false,
      scheduledAt: new Date('2026-10-15T15:00:00Z'),
    },
  })

  // 10. Seed Portfolio Items
  await prisma.portfolioItem.create({
    data: {
      title: 'Editorial Studio Portraiture',
      type: 'Portrait & Studio',
      category: 'Photography',
      client: 'Studio Session',
      year: '2026',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
      camera: 'Sony 8K System',
      lens: '85mm f/1.4 GM',
      lighting: 'Deep Octa Strobe & Natural Ambient Fill',
      brief: 'Timeless studio portraiture highlighting organic skin texture and natural eye contrast.',
      deliverables: JSON.stringify(['High-Resolution Plates', 'Print-Ready Exports', 'Client Proofing Gallery']),
      stats: '8K Master Resolution',
      sortOrder: 1,
      isPublished: true,
    },
  })

  console.log('Super Snap Ops database seeded successfully with real operational data!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
