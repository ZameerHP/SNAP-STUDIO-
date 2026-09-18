import { PrismaClient } from '@prisma/client'

// Global type augmentation
const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
  inMemoryStore: any | undefined
}

// Helper to generate IDs
function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
}

// Build initial seed records
function createInitialStore() {
  const directorId = 'usr_director_1'
  const clientId = 'usr_client_1'
  const bookingId = 'bk_studio_1'
  const galleryId = 'gal_elena_1'

  const users: any[] = [
    {
      id: directorId,
      email: 'supersnapstudio@gmail.com',
      hashedPassword: '',
      name: 'Studio Director',
      role: 'ADMIN',
      phone: '(647) 720-0423',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: clientId,
      email: 'client@example.com',
      hashedPassword: '',
      name: 'Elena Rostova',
      role: 'CLIENT',
      phone: '(519) 555-0199',
      createdAt: new Date('2026-01-02T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    },
  ]

  const clients: any[] = [
    {
      id: clientId,
      name: 'Elena Rostova',
      email: 'client@example.com',
      phone: '(519) 555-0199',
      createdAt: new Date('2026-01-02T00:00:00Z'),
    },
  ]

  const inquiries: any[] = [
    {
      id: 'inq_1',
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
      createdAt: new Date(Date.now() - 3600 * 1000 * 4),
    },
    {
      id: 'inq_2',
      name: 'Sarah Chen',
      email: 'sarah.chen@techhub.ca',
      phone: '(519) 555-4321',
      serviceType: '4K Live Streaming',
      message: 'Hybrid summit keynote live stream with multi-cam switching and remote Q&A feed.',
      budget: '$500+',
      location: 'London Convention Centre',
      date: '2026-12-05',
      status: 'new',
      adminNotes: 'High priority corporate booking.',
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
    },
  ]

  const services: any[] = [
    {
      id: 'srv_1',
      category: 'Portrait & Family',
      name: 'Commercial Photography',
      startingPrice: 100.0,
      description: 'Ultra-high resolution commercial, portrait, and architectural photography up to 8K.',
      active: true,
      isActive: true,
      sortOrder: 1,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      packages: [
        {
          id: 'pkg_1',
          serviceId: 'srv_1',
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
          active: true,
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
        {
          id: 'pkg_2',
          serviceId: 'srv_1',
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
          active: true,
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ],
    },
    {
      id: 'srv_2',
      category: 'Business & Real Estate',
      name: 'Cinema Videography',
      startingPrice: 150.0,
      description: 'Cinema-grade commercial films, brand narratives, and event documentation.',
      active: true,
      isActive: true,
      sortOrder: 2,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      packages: [
        {
          id: 'pkg_3',
          serviceId: 'srv_2',
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
          active: true,
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ],
    },
    {
      id: 'srv_3',
      category: 'Events & Celebrations',
      name: '4K Live Streaming',
      startingPrice: 120.0,
      description: 'Broadcast-grade multi-camera live streaming for corporate summits and milestones.',
      active: true,
      isActive: true,
      sortOrder: 3,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      packages: [
        {
          id: 'pkg_4',
          serviceId: 'srv_3',
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
          active: true,
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ],
    },
    {
      id: 'srv_4',
      category: 'Documents & ID',
      name: 'Biometric Passport & ID Photos',
      startingPrice: 35.0,
      description: 'Guaranteed government-compliant passport photos by an officially registered Canadian corporation.',
      active: true,
      isActive: true,
      sortOrder: 4,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      packages: [
        {
          id: 'pkg_5',
          serviceId: 'srv_4',
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
          active: true,
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ],
    },
  ]

  const packages = services.flatMap((s) => s.packages)

  const bookings: any[] = [
    {
      id: bookingId,
      userId: clientId,
      clientId: clientId,
      clientName: 'Elena Rostova',
      clientEmail: 'client@example.com',
      clientPhone: '(519) 555-0199',
      serviceId: 'srv_1',
      serviceName: 'Commercial Photography',
      packageName: 'Essential Portrait Session',
      scheduledAt: new Date('2026-10-15T14:00:00Z'),
      eventDate: '2026-10-15',
      location: 'London, ON Studio — 450 Richmond St',
      status: 'scheduled',
      notes: 'Studio portraiture with soft octa lighting setup and prime portrait glass.',
      createdAt: new Date('2026-03-01T12:00:00Z'),
    },
  ]

  const invoices: any[] = [
    {
      id: 'inv_1',
      invoiceNumber: 'INV-2026-001',
      userId: clientId,
      clientId: clientId,
      bookingId: bookingId,
      amount: 150.0,
      total: 150.0,
      amountPaid: 0,
      depositRequired: 50.0,
      depositPaid: 0,
      title: 'Production Invoice — Essential Portrait Session',
      lineItems: JSON.stringify([
        { description: 'Essential Portrait Session (2 Hours)', amount: 100, quantity: 1 },
        { description: 'Archival Fine Art Print Proofs', amount: 50, quantity: 1 },
      ]),
      squareInvoiceId: 'sq_sim_inv_101',
      squarePaymentId: null,
      status: 'SENT',
      notes: 'Studio retainer due upon booking confirmation.',
      dueDate: new Date('2026-10-14'),
      createdAt: new Date('2026-03-01T12:30:00Z'),
    },
  ]

  const contracts: any[] = [
    {
      id: 'ctr_1',
      userId: clientId,
      clientId: clientId,
      bookingId: bookingId,
      title: 'Production Agreement & Image Release',
      content: `PRODUCTION SERVICES AGREEMENT

This Agreement is entered into between Super Snap Studio (the "Studio"), a registered corporation in Canada, and the undersigned Client.

1. SCOPE OF SERVICES: The Studio agrees to provide high-resolution photography / media production services as outlined in the confirmed booking schedule.
2. DELIVERABLES: Digital proof contact sheets will be provided via the private Client Portal within 3 business days of the production session.
3. COPYRIGHT & USAGE: The Client is granted an unrestricted, non-exclusive license for personal and commercial usage. Master RAW capture files remain archived in the Studio vault.`,
      status: 'SENT',
      signed: false,
      signedAt: null,
      signerName: null,
      signerIp: null,
      createdAt: new Date('2026-03-01T12:30:00Z'),
      updatedAt: new Date('2026-03-01T12:30:00Z'),
    },
  ]

  const galleryAssets: any[] = [
    {
      id: 'asset_1',
      galleryId: galleryId,
      fileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85',
      fileType: 'image',
      createdAt: new Date('2026-03-02T10:00:00Z'),
    },
    {
      id: 'asset_2',
      galleryId: galleryId,
      fileUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1400&q=85',
      fileType: 'image',
      createdAt: new Date('2026-03-02T10:05:00Z'),
    },
  ]

  const galleries: any[] = [
    {
      id: galleryId,
      userId: clientId,
      clientId: clientId,
      bookingId: bookingId,
      title: 'Elena Rostova — Studio Portrait Proofs',
      description: 'Master 8K proof plates for selection and retouching.',
      accessCode: 'SNAP2026',
      isPublic: false,
      createdAt: new Date('2026-03-02T10:00:00Z'),
      media: galleryAssets,
      assets: galleryAssets,
    },
  ]

  const livestreams: any[] = [
    {
      id: 'live_1',
      userId: clientId,
      clientId: clientId,
      bookingId: bookingId,
      title: 'Elena Rostova Private Studio Broadcast',
      streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: 'OFFLINE',
      isLive: false,
      scheduledAt: new Date('2026-10-15T15:00:00Z'),
      createdAt: new Date('2026-03-01T13:00:00Z'),
    },
  ]

  const portfolioItems: any[] = [
    {
      id: 'port_1',
      title: 'Editorial Studio Portraiture',
      type: 'Portrait & Studio',
      category: 'Photography',
      client: 'Studio Session',
      year: '2026',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
      camera: 'Sony 8K Cinema & Alpha System',
      lens: '85mm f/1.4 GM',
      lighting: 'Deep Octa Strobe & Natural Ambient Fill',
      brief: 'Timeless studio portraiture highlighting organic skin texture and natural eye contrast.',
      deliverables: JSON.stringify(['High-Resolution Plates', 'Print-Ready Exports', 'Client Proofing Gallery']),
      stats: '8K Master Resolution',
      sortOrder: 1,
      isPublished: true,
      createdAt: new Date('2026-01-10T00:00:00Z'),
    },
    {
      id: 'port_2',
      title: 'Architectural Modern Space',
      type: 'Commercial & Architecture',
      category: 'Photography',
      client: 'Modern Living Architecture',
      year: '2026',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
      camera: 'Medium Format High Res',
      lens: '24mm Tilt-Shift Prime',
      lighting: 'Twilight Ambient HDR Stacking',
      brief: 'Interior showcase with perspective correction and architectural color balance.',
      deliverables: JSON.stringify(['25 Retouched Plates', 'MLS High Res Export']),
      stats: 'Ultra-Wide HDR',
      sortOrder: 2,
      isPublished: true,
      createdAt: new Date('2026-01-15T00:00:00Z'),
    },
  ]

  const signatures: any[] = []
  const payments: any[] = []

  return {
    user: users,
    client: clients,
    inquiry: inquiries,
    service: services,
    package: packages,
    booking: bookings,
    invoice: invoices,
    contract: contracts,
    gallery: galleries,
    galleryAsset: galleryAssets,
    media: galleryAssets,
    livestream: livestreams,
    portfolioItem: portfolioItems,
    signature: signatures,
    payment: payments,
  }
}

// In-memory collection handler
class InMemoryCollection {
  private items: any[]
  private prefix: string
  private getStore: () => Record<string, any[]>

  constructor(items: any[], prefix: string, getStore: () => Record<string, any[]>) {
    this.items = items
    this.prefix = prefix
    this.getStore = getStore
  }

  private matchesWhere(item: any, where?: Record<string, any>): boolean {
    if (!where) return true
    for (const [key, value] of Object.entries(where)) {
      if (value === undefined) continue

      // Support status: { in: [...] }
      if (value && typeof value === 'object' && 'in' in value && Array.isArray(value.in)) {
        if (!value.in.includes(item[key])) return false
        continue
      }

      // Support active / isActive aliasing
      if ((key === 'active' || key === 'isActive') && (item.active !== undefined || item.isActive !== undefined)) {
        const itemVal = item.isActive !== undefined ? item.isActive : item.active
        if (Boolean(itemVal) !== Boolean(value)) return false
        continue
      }

      // Case insensitive string compare for email
      if (key === 'email' && typeof value === 'string' && typeof item[key] === 'string') {
        if (item[key].toLowerCase() !== value.toLowerCase()) return false
        continue
      }

      // Direct comparison
      if (item[key] !== value) return false
    }
    return true
  }

  private enrichItem(item: any, include?: Record<string, any>): any {
    if (!include) return { ...item }
    const enriched = { ...item }
    const store = this.getStore()

    if (include.user) {
      const u = store.user?.find((x) => x.id === item.userId || x.id === item.clientId)
      if (u) {
        enriched.user = include.user.select
          ? {
              name: u.name,
              email: u.email,
              phone: u.phone,
            }
          : u
      } else {
        enriched.user = null
      }
    }

    if (include.client) {
      enriched.client = store.client?.find((x) => x.id === item.clientId) || null
    }

    if (include.booking) {
      const b = store.booking?.find((x) => x.id === item.bookingId)
      if (b) {
        enriched.booking = include.booking.select
          ? {
              serviceName: b.serviceName,
              eventDate: b.eventDate,
            }
          : b
      } else {
        enriched.booking = null
      }
    }

    if (include.packages) {
      enriched.packages = store.package?.filter((p) => p.serviceId === item.id) || []
    }

    if (include.invoices) {
      enriched.invoices = store.invoice?.filter((inv) => inv.bookingId === item.id) || []
    }

    if (include.contracts) {
      enriched.contracts = store.contract?.filter((c) => c.bookingId === item.id) || []
    }

    if (include.galleries) {
      enriched.galleries = store.gallery?.filter((g) => g.bookingId === item.id) || []
    }

    if (include.media || include.assets) {
      enriched.media = store.galleryAsset?.filter((a) => a.galleryId === item.id) || []
      enriched.assets = enriched.media
    }

    if (include.signatures) {
      enriched.signatures = store.signature?.filter((s) => s.contractId === item.id) || []
    }

    if (include.payments) {
      enriched.payments = store.payment?.filter((p) => p.invoiceId === item.id) || []
    }

    return enriched
  }

  async findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number }): Promise<any[]> {
    let result = this.items.filter((item) => this.matchesWhere(item, args?.where))

    if (args?.orderBy) {
      const [orderField, direction] = Object.entries(args.orderBy)[0] as [string, string]
      result.sort((a, b) => {
        const valA = a[orderField]
        const valB = b[orderField]
        if (valA instanceof Date && valB instanceof Date) {
          return direction === 'desc' ? valB.getTime() - valA.getTime() : valA.getTime() - valB.getTime()
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return direction === 'desc' ? valB - valA : valA - valB
        }
        return direction === 'desc' ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB))
      })
    }

    if (args?.take && args.take > 0) {
      result = result.slice(0, args.take)
    }

    return result.map((item) => this.enrichItem(item, args?.include))
  }

  async findUnique(args: { where: any; include?: any }): Promise<any | null> {
    const item = this.items.find((i) => this.matchesWhere(i, args.where))
    if (!item) return null
    return this.enrichItem(item, args.include)
  }

  async findFirst(args?: { where?: any; include?: any; orderBy?: any }): Promise<any | null> {
    const items = await this.findMany({ ...args, take: 1 })
    return items[0] ?? null
  }

  async count(args?: { where?: any }): Promise<number> {
    if (!args?.where) return this.items.length
    return this.items.filter((item) => this.matchesWhere(item, args.where)).length
  }

  async create(args: { data: any; include?: any }): Promise<any> {
    const id = args.data.id || makeId(this.prefix)
    const now = new Date()
    const newItem = {
      ...args.data,
      id,
      createdAt: args.data.createdAt || now,
      updatedAt: now,
    }
    this.items.unshift(newItem)
    return this.enrichItem(newItem, args.include)
  }

  async update(args: { where: any; data: any; include?: any }): Promise<any> {
    const index = this.items.findIndex((i) => this.matchesWhere(i, args.where))
    if (index === -1) {
      // If item doesn't exist, create it to prevent crashes
      return this.create({ data: { ...args.where, ...args.data }, include: args.include })
    }
    const current = this.items[index]
    const updated = {
      ...current,
      ...args.data,
      updatedAt: new Date(),
    }
    this.items[index] = updated
    return this.enrichItem(updated, args.include)
  }

  async upsert(args: { where: any; update: any; create: any; include?: any }): Promise<any> {
    const existing = await this.findUnique({ where: args.where })
    if (existing) {
      return this.update({ where: args.where, data: args.update, include: args.include })
    } else {
      return this.create({ data: args.create, include: args.include })
    }
  }

  async delete(args: { where: any }): Promise<any> {
    const index = this.items.findIndex((i) => this.matchesWhere(i, args.where))
    if (index !== -1) {
      const removed = this.items.splice(index, 1)[0]
      return removed
    }
    return {}
  }
}

function createInMemoryDb() {
  if (!globalForPrisma.inMemoryStore) {
    globalForPrisma.inMemoryStore = createInitialStore()
  }
  const store = globalForPrisma.inMemoryStore
  const getStore = () => store

  const collections: Record<string, InMemoryCollection> = {
    user: new InMemoryCollection(store.user, 'usr', getStore),
    client: new InMemoryCollection(store.client, 'clt', getStore),
    inquiry: new InMemoryCollection(store.inquiry, 'inq', getStore),
    service: new InMemoryCollection(store.service, 'srv', getStore),
    package: new InMemoryCollection(store.package, 'pkg', getStore),
    booking: new InMemoryCollection(store.booking, 'bk', getStore),
    invoice: new InMemoryCollection(store.invoice, 'inv', getStore),
    contract: new InMemoryCollection(store.contract, 'ctr', getStore),
    signature: new InMemoryCollection(store.signature, 'sig', getStore),
    gallery: new InMemoryCollection(store.gallery, 'gal', getStore),
    galleryAsset: new InMemoryCollection(store.galleryAsset, 'ast', getStore),
    media: new InMemoryCollection(store.galleryAsset, 'ast', getStore),
    livestream: new InMemoryCollection(store.livestream, 'live', getStore),
    portfolioItem: new InMemoryCollection(store.portfolioItem, 'port', getStore),
    payment: new InMemoryCollection(store.payment, 'pay', getStore),
  }

  const inMemoryDb: any = {
    ...collections,
    async $transaction(input: any) {
      if (Array.isArray(input)) {
        return Promise.all(input)
      } else if (typeof input === 'function') {
        return input(inMemoryDb)
      }
      return []
    },
    async $disconnect() {
      // noop
    },
  }

  return inMemoryDb
}

// Export database client
let dbInstance: any

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  try {
    const realPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
    // Wrap with fallback proxy in case PostgreSQL is unreachable
    const inMemoryFallback = createInMemoryDb()
    dbInstance = new Proxy(realPrisma, {
      get(target, prop: string) {
        if (prop in target) {
          const val = (target as any)[prop]
          if (typeof val === 'object' && val !== null) {
            return new Proxy(val, {
              get(modelTarget, modelProp: string) {
                const method = modelTarget[modelProp]
                if (typeof method === 'function') {
                  return async (...args: any[]) => {
                    try {
                      return await method.apply(modelTarget, args)
                    } catch (err: any) {
                      console.warn(`[DB Proxy] Database query failed, using in-memory store:`, err.message)
                      const fallbackModel = (inMemoryFallback as any)[prop]
                      if (fallbackModel && typeof fallbackModel[modelProp] === 'function') {
                        return fallbackModel[modelProp](...args)
                      }
                      throw err
                    }
                  }
                }
                return method
              },
            })
          }
          return val
        }
        return (inMemoryFallback as any)[prop]
      },
    })
  } catch (err) {
    console.warn('[AI Studio] PostgreSQL not connected — running with local in-memory studio store')
    dbInstance = createInMemoryDb()
  }
} else {
  dbInstance = createInMemoryDb()
}

export const db = dbInstance
