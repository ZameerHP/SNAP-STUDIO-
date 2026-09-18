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

// Build initial store with ONLY real studio configuration (NO fake clients, bookings, or data)
function createInitialStore() {
  const directorId = 'usr_director_1'

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
  ]

  // Clean production arrays - NO FAKE ANYTHING
  const clients: any[] = []
  const inquiries: any[] = []
  const bookings: any[] = []
  const invoices: any[] = []
  const contracts: any[] = []
  const signatures: any[] = []
  const payments: any[] = []
  const galleries: any[] = []
  const galleryAssets: any[] = []
  const livestreams: any[] = []
  const emailOtps: any[] = []
  const notifications: any[] = []
  const photoFavorites: any[] = []
  const retouchingNotes: any[] = []
  const instructors: any[] = []
  const instructorAvailability: any[] = []
  const instructorDaysOff: any[] = []
  const studioClosures: any[] = []

  // Real London Ontario Studio Operating Hours (Sunday=0 to Saturday=6)
  const operatingHours: any[] = [
    { id: 'oh_0', dayOfWeek: 0, isOpen: false, openTime: '10:00', closeTime: '16:00', slotDurationMinutes: 60 },
    { id: 'oh_1', dayOfWeek: 1, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDurationMinutes: 60 },
    { id: 'oh_2', dayOfWeek: 2, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDurationMinutes: 60 },
    { id: 'oh_3', dayOfWeek: 3, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDurationMinutes: 60 },
    { id: 'oh_4', dayOfWeek: 4, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDurationMinutes: 60 },
    { id: 'oh_5', dayOfWeek: 5, isOpen: true,  openTime: '09:00', closeTime: '19:00', slotDurationMinutes: 60 },
    { id: 'oh_6', dayOfWeek: 6, isOpen: true,  openTime: '10:00', closeTime: '17:00', slotDurationMinutes: 60 },
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

  return {
    user: users,
    client: clients,
    inquiry: inquiries,
    service: services,
    package: packages,
    servicePackage: packages,
    booking: bookings,
    invoice: invoices,
    contract: contracts,
    signature: signatures,
    contractSignature: signatures,
    gallery: galleries,
    galleryAsset: galleryAssets,
    media: galleryAssets,
    livestream: livestreams,
    portfolioItem: portfolioItems,
    payment: payments,
    operatingHours: operatingHours,
    instructor: instructors,
    instructorAvailability: instructorAvailability,
    instructorDayOff: instructorDaysOff,
    studioClosure: studioClosures,
    emailOtp: emailOtps,
    notification: notifications,
    photoFavorite: photoFavorites,
    retouchingNote: retouchingNotes,
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
    servicePackage: new InMemoryCollection(store.package, 'pkg', getStore),
    booking: new InMemoryCollection(store.booking, 'bk', getStore),
    invoice: new InMemoryCollection(store.invoice, 'inv', getStore),
    contract: new InMemoryCollection(store.contract, 'ctr', getStore),
    signature: new InMemoryCollection(store.signature, 'sig', getStore),
    contractSignature: new InMemoryCollection(store.signature, 'sig', getStore),
    gallery: new InMemoryCollection(store.gallery, 'gal', getStore),
    galleryAsset: new InMemoryCollection(store.galleryAsset, 'ast', getStore),
    media: new InMemoryCollection(store.galleryAsset, 'ast', getStore),
    livestream: new InMemoryCollection(store.livestream, 'live', getStore),
    portfolioItem: new InMemoryCollection(store.portfolioItem, 'port', getStore),
    payment: new InMemoryCollection(store.payment, 'pay', getStore),
    operatingHours: new InMemoryCollection(store.operatingHours, 'oh', getStore),
    instructor: new InMemoryCollection(store.instructor, 'inst', getStore),
    instructorAvailability: new InMemoryCollection(store.instructorAvailability, 'ia', getStore),
    instructorDayOff: new InMemoryCollection(store.instructorDayOff, 'ido', getStore),
    studioClosure: new InMemoryCollection(store.studioClosure, 'sc', getStore),
    emailOtp: new InMemoryCollection(store.emailOtp, 'otp', getStore),
    notification: new InMemoryCollection(store.notification, 'notif', getStore),
    photoFavorite: new InMemoryCollection(store.photoFavorite, 'fav', getStore),
    retouchingNote: new InMemoryCollection(store.retouchingNote, 'rn', getStore),
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
