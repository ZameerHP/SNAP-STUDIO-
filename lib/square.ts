import crypto from 'crypto'
import { SquareClient, SquareEnvironment } from 'square'

let squareClientInstance: SquareClient | null = null
let cachedLocationId: string | null = null
let cachedLocationName: string | null = null

export function getSquareClient(): SquareClient | null {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim()
  if (!token || token.length < 8) {
    return null
  }
  if (squareClientInstance) {
    return squareClientInstance
  }
  const isProdToken = token.startsWith('EAAA')
  const envConfig = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase()
  // EAAA access tokens are Square Production tokens
  const useProduction = isProdToken || envConfig === 'production'
  try {
    squareClientInstance = new SquareClient({
      token,
      environment: useProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    })
    return squareClientInstance
  } catch (err) {
    console.error('[Square] Failed to initialize SquareClient:', err)
    return null
  }
}

export async function getSquareLocationId(): Promise<string | null> {
  const envLoc = process.env.SQUARE_LOCATION_ID?.trim()
  if (envLoc) return envLoc
  if (cachedLocationId) return cachedLocationId
  const client = getSquareClient()
  if (!client) return null
  try {
    const res = await client.locations.list()
    const activeLoc = res.locations?.find((l) => l.status === 'ACTIVE') || res.locations?.[0]
    if (activeLoc?.id) {
      cachedLocationId = activeLoc.id
      cachedLocationName = activeLoc.name || 'Super Snap Studio'
      return cachedLocationId
    }
  } catch (err: any) {
    console.warn('[Square] Could not fetch locations:', err?.message || err)
  }
  return 'LHDV8KVY8QD1J'
}

export async function checkSquareHealth(): Promise<{
  configured: boolean
  connected: boolean
  locationId?: string
  locationName?: string
  environment: string
  message: string
}> {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim()
  if (!token) {
    return {
      configured: false,
      connected: false,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
      message: 'SQUARE_ACCESS_TOKEN is not set',
    }
  }
  const client = getSquareClient()
  if (!client) {
    return {
      configured: true,
      connected: false,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
      message: 'SquareClient initialization failed',
    }
  }
  try {
    const res = await client.locations.list()
    const activeLoc = res.locations?.find((l) => l.status === 'ACTIVE') || res.locations?.[0]
    const locId = activeLoc?.id || 'LHDV8KVY8QD1J'
    const locName = activeLoc?.name || 'Super Snap Studio'
    cachedLocationId = locId
    cachedLocationName = locName
    return {
      configured: true,
      connected: true,
      locationId: locId,
      locationName: locName,
      environment: token.startsWith('EAAA') ? 'production' : 'sandbox',
      message: `Connected to Square location: ${locName} (${locId})`,
    }
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
      message: err?.message || 'Failed to authenticate with Square API',
    }
  }
}

// Backward compatibility helper
export const squareClient = {
  get client() {
    return getSquareClient()
  }
} as any

export interface CreateSquareCustomerParams {
  name: string
  email: string
  phone?: string
}

export interface CreateSquareInvoiceParams {
  clientId?: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  title: string
  amount: number
  currency?: string
  dueDate?: Date
  invoiceId: string
  invoiceNumber: string
}

export interface SquareInvoiceResult {
  success: boolean
  squareInvoiceId?: string
  paymentUrl?: string
  status?: string
  error?: string
}

/**
 * Creates or retrieves a Customer in Square via the Customers API
 */
export async function getOrCreateSquareCustomer(params: CreateSquareCustomerParams): Promise<string | null> {
  const client = getSquareClient()
  if (!client) return null

  try {
    const listRes = await client.customers.search({
      query: {
        filter: {
          emailAddress: {
            exact: params.email,
          },
        },
      },
    })

    if (listRes.customers && listRes.customers.length > 0 && listRes.customers[0].id) {
      return listRes.customers[0].id
    }

    const createRes = await client.customers.create({
      givenName: params.name,
      emailAddress: params.email,
      phoneNumber: params.phone || undefined,
      note: 'Super Snap Studio Client',
    })

    return createRes.customer?.id || null
  } catch (error: any) {
    console.error('[Square Customer API Error]', error?.message || error)
    return null
  }
}

/**
 * Creates and publishes an official Square Invoice via Square Invoices API & Orders API
 */
export async function createSquareInvoice(params: CreateSquareInvoiceParams): Promise<SquareInvoiceResult> {
  const client = getSquareClient()
  const locationId = await getSquareLocationId()

  if (!client || !locationId) {
    return {
      success: false,
      error: 'Square payment gateway is not configured (SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID required).',
    }
  }

  try {
    // 1. Get or create Square customer
    const customerId = await getOrCreateSquareCustomer({
      name: params.clientName,
      email: params.clientEmail,
      phone: params.clientPhone,
    })

    // 2. Create Order in Square
    const amountCents = BigInt(Math.max(1, Math.round(params.amount * 100)))
    const idempotencyKey = `ord_${params.invoiceId}_${Date.now()}`

    const orderRes = await client.orders.create({
      order: {
        locationId: locationId,
        customerId: customerId || undefined,
        lineItems: [
          {
            name: `${params.title} (${params.invoiceNumber})`,
            quantity: '1',
            basePriceMoney: {
              amount: amountCents,
              currency: (params.currency || 'CAD') as any,
            },
          },
        ],
      },
      idempotencyKey: idempotencyKey,
    })

    const orderId = orderRes.order?.id
    if (!orderId) {
      throw new Error('Square Order creation failed')
    }

    // 3. Create Invoice against the Order
    const dueDateString = (params.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      .toISOString()
      .split('T')[0]

    const invoiceRes = await client.invoices.create({
      invoice: {
        locationId: locationId,
        orderId: orderId,
        primaryRecipient: customerId ? { customerId } : undefined,
        paymentRequests: [
          {
            requestType: 'BALANCE',
            dueDate: dueDateString,
          },
        ],
        deliveryMethod: 'EMAIL',
        title: `Super Snap Studio — ${params.title}`,
        invoiceNumber: params.invoiceNumber,
      },
      idempotencyKey: `inv_${params.invoiceId}_${Date.now()}`,
    })

    const invoice = invoiceRes.invoice
    const invoiceId = invoice?.id
    if (!invoiceId) {
      throw new Error('Square Invoice creation failed')
    }

    // 4. Publish the Invoice so Square generates the hosted payment URL
    const publishRes = await (client.invoices as any).publish(invoiceId, {
      version: invoice.version || 0,
      idempotencyKey: `pub_${params.invoiceId}_${Date.now()}`,
    })

    const publishedInvoice = publishRes.invoice
    const paymentUrl = publishedInvoice?.publicUrl

    if (!paymentUrl) {
      throw new Error('Square Invoice created but no hosted payment URL was returned')
    }

    return {
      success: true,
      squareInvoiceId: invoiceId,
      paymentUrl: paymentUrl,
      status: 'SENT',
    }
  } catch (error: any) {
    console.error('[Square Invoices API Error]', error?.message || error)
    return {
      success: false,
      error: error?.message || 'Failed to create Square invoice',
    }
  }
}

/**
 * Creates a Square Checkout Payment Link (Square Online Checkout API)
 */
export async function createSquarePaymentLink(options: {
  invoiceId: string
  invoiceNumber: string
  amount: number
  currency?: string
  title: string
  clientEmail?: string
  redirectUrl: string
}): Promise<{
  success: boolean
  url?: string
  orderId?: string
  paymentLinkId?: string
  error?: string
}> {
  const client = getSquareClient()
  const locationId = await getSquareLocationId()

  if (!client || !locationId) {
    return {
      success: false,
      error: 'Square payment processing is not configured with live credentials. Please configure SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in environment variables.',
    }
  }

  try {
    const amountCents = BigInt(Math.max(1, Math.round(options.amount * 100)))
    const res = await client.checkout.paymentLinks.create({
      idempotencyKey: `chk_${options.invoiceId}_${Date.now()}`,
      quickPay: {
        name: `Super Snap Studio — ${options.invoiceNumber} (${options.title})`,
        priceMoney: {
          amount: amountCents,
          currency: (options.currency || 'CAD') as any,
        },
        locationId,
      },
      checkoutOptions: {
        redirectUrl: options.redirectUrl,
        askForShippingAddress: false,
      },
      prePopulatedData: {
        buyerEmail: options.clientEmail || undefined,
      },
    })

    const link = res.paymentLink
    const checkoutUrl = link?.url || link?.longUrl

    if (checkoutUrl) {
      return {
        success: true,
        url: checkoutUrl,
        orderId: link?.orderId,
        paymentLinkId: link?.id,
      }
    }

    return {
      success: false,
      error: 'No checkout URL returned by Square Checkout API',
    }
  } catch (err: any) {
    console.error('[Square Payment Link API Error]', err?.message || err)
    return {
      success: false,
      error: err?.message || 'Failed to create Square payment link',
    }
  }
}

/**
 * Verifies a payment with Square's official Payments API
 */
export async function verifySquarePayment(paymentId: string): Promise<{
  verified: boolean
  status?: string
  amount?: number
  currency?: string
  error?: string
}> {
  const client = getSquareClient()
  if (!client) {
    return { verified: false, error: 'Square API is not configured' }
  }

  try {
    const res = await (client.payments as any).get(paymentId)
    const p = res.payment
    if (p && p.status === 'COMPLETED') {
      const amountVal = p.amountMoney?.amount ? Number(p.amountMoney.amount) / 100 : 0
      return {
        verified: true,
        status: p.status,
        amount: amountVal,
        currency: p.amountMoney?.currency || 'CAD',
      }
    }
    return {
      verified: false,
      status: p?.status || 'UNKNOWN',
      error: `Square payment status is ${p?.status}`,
    }
  } catch (err: any) {
    return { verified: false, error: err?.message || 'Failed to verify payment with Square' }
  }
}

/**
 * Validates a Square Webhook notification HMAC-SHA256 signature
 */
export function verifySquareWebhook(
  body: string,
  signature: string,
  signatureKey: string,
  notificationUrl: string
): boolean {
  if (!signatureKey || !signature) return false

  try {
    const combined = notificationUrl + body
    const hmac = crypto.createHmac('sha256', signatureKey)
    hmac.update(combined)
    const expectedSignature = hmac.digest('base64')
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (err) {
    console.error('[Square Webhook Verification Error]', err)
    return false
  }
}
