import { Router } from 'express';
import { fetchProblemBySlug, fetchProblems } from '../services/problemService.js';

export const problemRouter = Router();

problemRouter.get('/', async (_req, res, next) => {
  try {
    const problems = await fetchProblems();
    res.json({ problems });
  } catch (error) {
    next(error);
  }
});

problemRouter.get('/:slug', async (req, res, next) => {
  try {
    const problem = await fetchProblemBySlug(req.params.slug);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found.' });
    }
    return res.json({ problem });
  } catch (error) {
    return next(error);
  }
});
