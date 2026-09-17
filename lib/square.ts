import { Client, Environment } from 'square'
import crypto from 'crypto'

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production'

// Official Square Node SDK Client
export const squareClient = new Client({
  environment: isProduction ? Environment.Production : Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
})

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
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim()
  const locationId = process.env.SQUARE_LOCATION_ID?.trim()

  if (!token || !locationId || token.length < 10) {
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
    const amountCents = BigInt(Math.round(options.amount * 100))
    const res = await squareClient.checkoutApi.createPaymentLink({
      idempotencyKey: `chk_${options.invoiceId}_${Date.now()}`,
      quickPay: {
        name: `Super Snap Studio — ${options.invoiceNumber} (${options.title})`,
        priceMoney: {
          amount: amountCents,
          currency: (options.currency || 'CAD') as any,
        },
        locationId: locationId,
      },
      checkoutOptions: {
        redirectUrl: options.redirectUrl,
        askForShippingAddress: false,
      },
      prePopulatedData: {
        buyerEmail: options.clientEmail || undefined,
      },
    })

    const link = res.result.paymentLink
    return {
      url: link?.url || link?.longUrl || `/portal/payments/simulate?invoiceId=${encodeURIComponent(options.invoiceId)}`,
      orderId: link?.orderId,
      paymentLinkId: link?.id,
      isSimulation: false,
    }
  } catch (err: any) {
    console.warn('[Square Payment Link API Fallback]', err.message)
    return {
      url: `/portal/payments/simulate?invoiceId=${encodeURIComponent(
        options.invoiceId
      )}&amount=${options.amount}&invoiceNumber=${encodeURIComponent(
        options.invoiceNumber
      )}&title=${encodeURIComponent(options.title)}&error=${encodeURIComponent(err.message)}`,
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
