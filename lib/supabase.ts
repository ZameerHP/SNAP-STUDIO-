import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null

export function getSupabaseConfig() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.SUPA_BASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''

  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUBA_BASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPA_BASE_SECRET ||
    process.env.SUPABASE_SECRET ||
    ''

  // Extract project ref (e.g. ljihvxzqvplhenkorjiq)
  let projectRef = ''
  if (url) {
    try {
      const parsed = new URL(url)
      projectRef = parsed.hostname.split('.')[0] || ''
    } catch {
      // fallback
    }
  }

  const isConfigured = Boolean(url && (anonKey || serviceRoleKey))

  return {
    url,
    anonKey,
    serviceRoleKey,
    projectRef,
    isConfigured,
  }
}

/**
 * Returns an initialized Supabase client using the anon key (or service key fallback).
 * Fails gracefully and returns null if credentials are not configured.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance

  const { url, anonKey, serviceRoleKey } = getSupabaseConfig()
  const keyToUse = anonKey || serviceRoleKey

  if (!url || !keyToUse) {
    return null
  }

  try {
    supabaseInstance = createClient(url, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    return supabaseInstance
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err)
    return null
  }
}

/**
 * Returns an administrative Supabase client using the service role key if available.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdminInstance) return supabaseAdminInstance

  const { url, serviceRoleKey, anonKey } = getSupabaseConfig()
  const keyToUse = serviceRoleKey || anonKey

  if (!url || !keyToUse) {
    return null
  }

  try {
    supabaseAdminInstance = createClient(url, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    return supabaseAdminInstance
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase admin client:', err)
    return null
  }
}

/**
 * Checks connection to the configured Supabase instance
 */
export async function checkSupabaseHealth(): Promise<{
  configured: boolean
  connected: boolean
  url: string
  projectRef: string
  message: string
}> {
  const config = getSupabaseConfig()

  if (!config.isConfigured) {
    return {
      configured: false,
      connected: false,
      url: '',
      projectRef: '',
      message: 'Supabase credentials not configured in environment',
    }
  }

  try {
    const client = getSupabase()
    if (!client) {
      return {
        configured: true,
        connected: false,
        url: config.url,
        projectRef: config.projectRef,
        message: 'Client could not be initialized',
      }
    }

    const { error } = await client.auth.getSession()
    if (error) {
      return {
        configured: true,
        connected: false,
        url: config.url,
        projectRef: config.projectRef,
        message: error.message,
      }
    }

    return {
      configured: true,
      connected: true,
      url: config.url,
      projectRef: config.projectRef,
      message: 'Connected to Supabase project successfully',
    }
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      url: config.url,
      projectRef: config.projectRef,
      message: err?.message || 'Connection error',
    }
  }
}
