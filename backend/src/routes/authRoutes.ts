import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import { createAuthToken, findUserById, registerUser, revokeAuthCookie, setAuthCookie, verifyCredentials } from '../services/authService.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait a moment and try again.' },
});

authRouter.get('/csrf', (req, res) => {
  const token = req.csrfToken ? req.csrfToken() : 'csrf-token';
  res.cookie(env.CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 12 * 60 * 60 * 1000,
  });
  return res.json({ csrfToken: token });
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid registration data.' });
    }
    const user = await registerUser(parsed.data.name, parsed.data.email, parsed.data.password);
    const token = createAuthToken(user.id);
    setAuthCookie(res, token);
    return res.status(201).json({ user, token });
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }
    return next(error);
  }
});

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid login data.' });
    }
    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = createAuthToken(user.id);
    setAuthCookie(res, token);
    return res.json({ user, token });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/logout', (req, res) => {
  revokeAuthCookie(res);
  res.clearCookie(env.CSRF_COOKIE_NAME, { path: '/' });
  return res.json({ message: 'Logged out successfully.' });
});

authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await findUserById(req.user!.id);
  return res.json({ user });
});
