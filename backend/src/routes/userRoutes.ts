import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { findUserById } from '../services/authService.js';

export const userRouter = Router();

userRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await findUserById(req.user!.id);
  return res.json({ user });
});
