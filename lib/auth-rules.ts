export function ownerEmailMatches(email: string, ...configured: Array<string | undefined>) {
  const actual = email.trim().toLowerCase();
  return configured
    .flatMap(value => (value || '').split(','))
    .some(value => value.trim().toLowerCase() === actual);
}
export function safeNext(value: unknown, fallback = '/client') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  try { const url = new URL(value, 'https://studio.invalid'); return url.origin === 'https://studio.invalid' ? url.pathname + url.search : fallback; } catch { return fallback; }
}
