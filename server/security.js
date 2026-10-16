import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const SESSION_SECONDS = 8 * 60 * 60;
const REMEMBERED_SESSION_SECONDS = 30 * 24 * 60 * 60;
const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters.');
}

const encryptionKey = crypto
  .createHash('sha256')
  .update('secchance-case-data-v1:')
  .update(secret)
  .digest();

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password, digest) {
  if (typeof digest !== 'string' || !digest.startsWith('$2')) return false;
  return bcrypt.compare(password, digest);
}

export function createSessionToken(user, rememberMe = false) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: Number(user.id),
      iat: now,
      exp: now + (rememberMe ? REMEMBERED_SESSION_SECONDS : SESSION_SECONDS),
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  let received;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isInteger(decoded.sub) || decoded.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function encryptValue(value) {
  if (value === null || value === undefined || value === '') return value;
  if (typeof value === 'string' && value.startsWith('enc:v1:')) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8')),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptValue(value, asBuffer = false) {
  if (typeof value !== 'string' || !value.startsWith('enc:v1:')) {
    return asBuffer && typeof value === 'string' ? Buffer.from(value, 'base64') : value;
  }
  const [ivText, tagText, encryptedText] = value.slice('enc:v1:'.length).split('.');
  if (!ivText || !tagText || !encryptedText) {
    throw new HttpError(500, 'تعذر فك تشفير سجل محفوظ.');
  }
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(ivText, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
    const result = Buffer.concat([
      decipher.update(Buffer.from(encryptedText, 'base64url')),
      decipher.final(),
    ]);
    return asBuffer ? result : result.toString('utf8');
  } catch {
    throw new HttpError(500, 'تعذر فك تشفير سجل محفوظ.');
  }
}

export function cookieHeader(name, value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

export function clearCookieHeader(name) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

export function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map((part) => {
      const separator = part.indexOf('=');
      if (separator < 0) return ['', ''];
      const key = part.slice(0, separator).trim();
      try {
        return [key, decodeURIComponent(part.slice(separator + 1).trim())];
      } catch {
        return [key, ''];
      }
    }).filter(([key]) => key)
  );
}

export function safeUser(row, { publicProfile = false } = {}) {
  if (!row) return null;
  const roleSlug = row.role_slug ?? row.roleSlug;
  const isPublicProvider =
    publicProfile &&
    ['psychologist', 'doctor', 'lawyer', 'legal_advisor', 'clinic', 'hospital', 'association', 'treatment_center'].includes(roleSlug);

  return {
    id: Number(row.id),
    firstName: row.first_name ?? row.firstName ?? '',
    lastName: row.last_name ?? row.lastName ?? '',
    email: isPublicProvider ? '' : row.email ?? '',
    phone: isPublicProvider ? '' : row.phone ?? '',
    roleSlug,
    wilayaName: row.wilaya_name ?? row.wilayaName ?? null,
    status: row.status,
    specialty: row.specialty ?? undefined,
    subSpecialty: row.sub_specialty ?? undefined,
    licenseNumber: isPublicProvider ? undefined : row.license_number ?? row.licenseNumber ?? undefined,
    professionalDetailsVerified: Boolean(row.is_verified || row.verification_status === 'approved'),
    availabilitySlots: parseAvailability(row.availability_schedule),
    address: isPublicProvider ? undefined : row.address ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    organizationName: row.organization_name ?? undefined,
    managerName: row.manager_name ?? undefined,
    activityField: row.activity_field ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

function parseAvailability(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function sessionMaxAge(rememberMe = false) {
  return rememberMe ? REMEMBERED_SESSION_SECONDS : SESSION_SECONDS;
}
