import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'scp_super_secure_jwt_secret_production_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'scp_super_secure_jwt_refresh_secret_2026';

export interface JwtPayloadUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  role_slug: string;
  wilaya_id?: number;
}

export function generateAccessToken(user: JwtPayloadUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });
}

export function generateRefreshToken(user: JwtPayloadUser): string {
  return jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtPayloadUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayloadUser;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { id: number } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: number };
  } catch (err) {
    return null;
  }
}

export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

export function comparePassword(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}
