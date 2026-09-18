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
  squareInvoiceId: string
  paymentUrl: string
  status: string
  isSimulation?: boolean
}

/**
 * Creates or retrieves a Customer in Square via the Customers API
 */
export async function getOrCreateSquareCustomer(params: CreateSquareCustomerParams): Promise<string> {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim()
  if (!token || token.length < 10) {
    return `sim_cust_${Date.now()}`
  }

  try {
    // Search for existing customer by email
    const searchRes = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: params.email,
          },
        },
      },
    })

    if (searchRes.result.customers && searchRes.result.customers.length > 0) {
      return searchRes.result.customers[0].id!
    }

    // Create new customer
    const createRes = await squareClient.customersApi.createCustomer({
      givenName: params.name,
      emailAddress: params.email,
      phoneNumber: params.phone || undefined,
      note: 'Super Snap Studio Client',
    })

    return createRes.result.customer?.id || `cust_${Date.now()}`
  } catch (error: any) {
    console.error('[Square Customer API Error]', error)
    return `sim_cust_${Date.now()}`
  }
}

/**
 * Creates and publishes an official Square Invoice via Square Invoices API & Orders API
 */
export async function createSquareInvoice(params: CreateSquareInvoiceParams): Promise<SquareInvoiceResult> {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim()
  const locationId = process.env.SQUARE_LOCATION_ID?.trim()

  // If no Square credentials configured yet, return testing simulation URL
  if (!token || !locationId || token.length < 10) {
    return {
      squareInvoiceId: `sq_sim_inv_${Date.now()}`,
      paymentUrl: `/portal/payments/simulate?invoiceId=${encodeURIComponent(
        params.invoiceId
      )}&amount=${params.amount}&invoiceNumber=${encodeURIComponent(
        params.invoiceNumber
      )}&title=${encodeURIComponent(params.title)}`,
      status: 'SENT',
      isSimulation: true,
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
    const amountCents = BigInt(Math.round(params.amount * 100))
    const idempotencyKey = `ord_${params.invoiceId}_${Date.now()}`

    const orderRes = await squareClient.ordersApi.createOrder({
      order: {
        locationId: locationId,
        customerId: customerId,
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

    const orderId = orderRes.result.order?.id
    if (!orderId) {
      throw new Error('Square Order creation failed')
    }

    // 3. Create Invoice against the Order
    const dueDateString = (params.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      .toISOString()
      .split('T')[0]

    const invoiceRes = await squareClient.invoicesApi.createInvoice({
      invoice: {
        locationId: locationId,
        orderId: orderId,
        primaryRecipient: {
          customerId: customerId,
        },
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

    const invoice = invoiceRes.result.invoice
    const invoiceId = invoice?.id
    if (!invoiceId) {
      throw new Error('Square Invoice creation failed')
    }

    // 4. Publish the Invoice so Square generates the hosted payment URL
    const publishRes = await squareClient.invoicesApi.publishInvoice(invoiceId, {
      version: invoice.version || 0,
      idempotencyKey: `pub_${params.invoiceId}_${Date.now()}`,
    })

    const publishedInvoice = publishRes.result.invoice
    const paymentUrl = publishedInvoice?.publicUrl || `/portal/payments/simulate?invoiceId=${encodeURIComponent(params.invoiceId)}`

    return {
      squareInvoiceId: invoiceId,
      paymentUrl: paymentUrl,
      status: 'SENT',
      isSimulation: false,
    }
  } catch (error: any) {
    console.warn('[Square Invoices API Fallback to Simulation]', error.message)
    return {
      squareInvoiceId: `sq_sim_inv_${Date.now()}`,
      paymentUrl: `/portal/payments/simulate?invoiceId=${encodeURIComponent(
        params.invoiceId
      )}&amount=${params.amount}&invoiceNumber=${encodeURIComponent(
        params.invoiceNumber
      )}&title=${encodeURIComponent(params.title)}&error=${encodeURIComponent(error.message)}`,
      status: 'SENT',
      isSimulation: true,
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
}) {
  const client = getSquareClient()
  const locationId = await getSquareLocationId()

  if (!client || !locationId) {
    return {
      url: `/portal/payments/simulate?invoiceId=${encodeURIComponent(
        options.invoiceId
      )}&amount=${options.amount}&invoiceNumber=${encodeURIComponent(
        options.invoiceNumber
      )}&title=${encodeURIComponent(options.title)}`,
      orderId: `sim_order_${Date.now()}`,
      paymentLinkId: `sim_pl_${Date.now()}`,
      isSimulation: true,
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
        url: checkoutUrl,
        orderId: link?.orderId,
        paymentLinkId: link?.id,
        isSimulation: false,
      }
    }

    throw new Error('No checkout URL returned by Square')
  } catch (err: any) {
    console.warn('[Square Payment Link API]', err?.message || err)
    return {
      url: `/portal/payments/simulate?invoiceId=${encodeURIComponent(
        options.invoiceId
      )}&amount=${options.amount}&invoiceNumber=${encodeURIComponent(
        options.invoiceNumber
      )}&title=${encodeURIComponent(options.title)}&error=${encodeURIComponent(err?.message || 'Square API link error')}`,
      orderId: `sim_order_${Date.now()}`,
      paymentLinkId: `sim_pl_${Date.now()}`,
      isSimulation: true,
    }
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
