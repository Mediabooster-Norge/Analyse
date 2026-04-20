import { randomBytes, createHash } from 'crypto';

const FREE_SHARE_TTL_MS = 24 * 60 * 60 * 1000;

export function generateShareToken() {
  return randomBytes(32).toString('hex');
}

export function hashShareToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getShareExpiration(isPremium: boolean) {
  if (isPremium) return null;
  return new Date(Date.now() + FREE_SHARE_TTL_MS).toISOString();
}

export function isShareExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}
