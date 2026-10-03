export const MAX_MEDIA_SIZE = 25 * 1024 * 1024;
export const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
export function validMediaHeader(type: string, a: Uint8Array) {
  const text = (i: number, j: number) => new TextDecoder().decode(a.slice(i, j));
  const valid: Record<string, boolean> = {
    'image/jpeg': a[0] === 255 && a[1] === 216 && a[2] === 255,
    'image/png': a[0] === 137 && text(1, 4) === 'PNG' && a[4] === 13 && a[5] === 10 && a[6] === 26 && a[7] === 10,
    'image/webp': text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP',
    'video/mp4': text(4, 8) === 'ftyp',
    'video/webm': a[0] === 26 && a[1] === 69 && a[2] === 223 && a[3] === 163,
  };
  return valid[type] === true;
}
