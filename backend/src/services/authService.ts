import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isMemoryMode, memoryStore } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function registerUser(name: string, email: string, password: string) {
  if (isMemoryMode()) {
    const existing = memoryStore.users.find((u) => u.email === email.toLowerCase());
    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      _id: cryptoRandomId(),
      id: cryptoRandomId(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.users.push(user);
    return { id: user._id, name: user.name, email: user.email };
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error('EMAIL_EXISTS');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash });
  return { id: user._id.toString(), name: user.name, email: user.email };
}

export async function verifyCredentials(email: string, password: string) {
  if (isMemoryMode()) {
    const user = memoryStore.users.find((entry) => entry.email === email.toLowerCase());
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return { id: user._id, name: user.name, email: user.email };
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user._id.toString(), name: user.name, email: user.email };
}

export function createAuthToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '12h' });
}

export function revokeAuthCookie(res: any) {
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export function setAuthCookie(res: any, token: string) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });
}

export function setCsrfCookie(res: any, token: string) {
  res.cookie(env.CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function findUserById(id: string) {
  if (isMemoryMode()) {
    const user = memoryStore.users.find((entry) => entry._id === id || entry.id === id);
    return user ? { id: user._id, name: user.name, email: user.email } : null;
  }
  const user = await User.findById(id).select('-passwordHash');
  if (!user) return null;
  return { id: user._id.toString(), name: user.name, email: user.email };
}

function cryptoRandomId() {
  return `id_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`;
}
