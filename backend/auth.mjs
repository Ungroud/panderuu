import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const DEFAULT_TEMPORARY_PASSWORD = 'Panderuu123!';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const PASSWORD_KEY_LENGTH = 64;

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  assertPasswordPolicy(password);
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const [algorithm, salt, expectedHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;

  const actual = Buffer.from(scryptSync(password || '', salt, PASSWORD_KEY_LENGTH).toString('hex'), 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token) {
  return createHash('sha256').update(String(token || '')).digest('hex');
}

export function normalizeUsername(username) {
  const value = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{4,40}$/.test(value)) {
    const error = new Error('Usuario invalido: use 4 a 40 caracteres con letras, numeros, punto, guion o subguion');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  return value;
}

export function defaultUsernameForActor(actor) {
  if (actor?.id === 'admin-seed') return 'admin.seed';
  if (actor?.id === 'admin-caja') return 'caja.nivel2';
  if (actor?.id === 'admin-reportes') return 'reportes.nivel1';
  return normalizeUsername(actor?.username || actor?.id || actor?.name || `admin-${Date.now()}`);
}

export function usernameFromPerson(person) {
  const emailUser = String(person?.email || '').split('@')[0];
  const source = emailUser || String(person?.name || '').trim().toLowerCase().replace(/\s+/g, '.');
  const normalized = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 30);
  return normalizeUsername(normalized || `admin-${Date.now()}`);
}

export function assertPasswordPolicy(password) {
  const value = String(password || '');
  if (value.length < 10) {
    const error = new Error('La clave debe tener al menos 10 caracteres');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
}
