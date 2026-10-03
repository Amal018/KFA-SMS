import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

export const CARD_PREFIX = 'KFA1';
const SIGNATURE_BYTES = 16;

export interface Credential {
  id: string;
  studentId: string;
  type: 'qr' | 'nfc';
  /** QR: card version as a decimal string. NFC: normalised sticker UID. */
  value: string;
  status: 'active' | 'revoked';
}

export type CredentialScan =
  | { type: 'qr'; payload: string }
  | { type: 'nfc'; uid: string; payload?: string | null };

export type CredentialIdentification =
  | { result: 'identified'; studentId: string; credentialId: string }
  | { result: 'invalid_credential' }
  | { result: 'revoked_credential'; studentId: string }
  | { result: 'unknown_credential' };

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function base64url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let c = 0; c < chars; c++) out += B64URL[(n >> (18 - 6 * c)) & 63];
  }
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function sign(secret: string, message: string): string {
  return base64url(hmac(sha256, utf8ToBytes(secret), utf8ToBytes(message)).slice(0, SIGNATURE_BYTES));
}

/** The text printed in a student's QR code and written to their NFC sticker (spec §5.3). */
export function cardPayload(secret: string, studentId: string, version: number): string {
  const body = `${CARD_PREFIX}.${studentId}.${version}`;
  return `${body}.${sign(secret, body)}`;
}

export function parseCardPayload(
  secret: string,
  payload: string,
): { ok: true; studentId: string; version: number } | { ok: false } {
  const parts = payload.trim().split('.');
  if (parts.length !== 4 || parts[0] !== CARD_PREFIX) return { ok: false };
  const [, studentId, versionText, signature] = parts as [string, string, string, string];
  if (!studentId || !/^\d+$/.test(versionText)) return { ok: false };
  if (!constantTimeEqual(sign(secret, `${CARD_PREFIX}.${studentId}.${versionText}`), signature)) return { ok: false };
  return { ok: true, studentId, version: Number(versionText) };
}

export function normalizeUid(uid: string): string {
  return uid.replace(/[^0-9a-f]/gi, '').toUpperCase();
}

/** Identify a student from a QR or NFC scan (M-10 to M-23). */
export function identifyCredential(
  scan: CredentialScan,
  credentials: Credential[],
  secret: string,
): CredentialIdentification {
  if (scan.type === 'qr') {
    const parsed = parseCardPayload(secret, scan.payload);
    if (!parsed.ok) return { result: 'invalid_credential' };
    const cards = credentials.filter((c) => c.type === 'qr' && c.studentId === parsed.studentId);
    const scanned = cards.find((c) => Number(c.value) === parsed.version);
    const current = cards.find((c) => c.status === 'active');
    if (scanned?.status === 'active') {
      return { result: 'identified', studentId: parsed.studentId, credentialId: scanned.id };
    }
    // A signed card we issued earlier, now replaced or revoked.
    if (scanned || (current && parsed.version < Number(current.value))) {
      return { result: 'revoked_credential', studentId: parsed.studentId };
    }
    return { result: 'invalid_credential' };
  }

  const uid = normalizeUid(scan.uid);
  const sticker = credentials.find((c) => c.type === 'nfc' && c.value === uid);
  if (!sticker) return { result: 'unknown_credential' };
  if (sticker.status === 'revoked') return { result: 'revoked_credential', studentId: sticker.studentId };
  if (scan.payload) {
    const parsed = parseCardPayload(secret, scan.payload);
    if (!parsed.ok || parsed.studentId !== sticker.studentId) return { result: 'invalid_credential' };
  }
  return { result: 'identified', studentId: sticker.studentId, credentialId: sticker.id };
}
