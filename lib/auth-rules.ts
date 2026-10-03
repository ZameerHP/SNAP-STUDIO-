export function ownerEmailMatches(email: string, configured: string | undefined) {
  return !!configured?.trim() && email.trim().toLowerCase() === configured.trim().toLowerCase();
}
export function safeNext(value: unknown, fallback = '/client') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  try { const url = new URL(value, 'https://studio.invalid'); return url.origin === 'https://studio.invalid' ? url.pathname + url.search : fallback; } catch { return fallback; }
}
