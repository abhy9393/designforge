import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboardStats, getRecentActivity } from '../services/dashboardService.js';

export const dashboardRouter = Router();

import type { AuthenticatedRequest } from '../middleware/auth.js';

dashboardRouter.get('/stats', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const stats = await getDashboardStats(req.user!.id);
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
});

dashboardRouter.get('/recent-activity', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const activity = await getRecentActivity(req.user!.id);
    return res.json({ activity });
  } catch (error) {
    return next(error);
  }
});
