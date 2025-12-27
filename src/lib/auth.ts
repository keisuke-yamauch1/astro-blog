import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET = import.meta.env.JWT_SECRET || 'fallback-dev-secret';
const PASSWORD_HASH = import.meta.env.ADMIN_PASSWORD_HASH;

// localhostかどうかを判定
export function isLocalhost(request: Request): boolean {
  const url = new URL(request.url);
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

// bcryptでパスワードを検証（平文比較を避ける）
export async function verifyPassword(password: string): Promise<boolean> {
  if (!PASSWORD_HASH) {
    throw new Error('ADMIN_PASSWORD_HASH not configured');
  }

  return await bcrypt.compare(password, PASSWORD_HASH);
}

export function generateToken(): string {
  return jwt.sign(
    { admin: true, iat: Math.floor(Date.now() / 1000) },
    SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}
