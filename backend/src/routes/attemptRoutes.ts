import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { createAttempt, getAttemptById, listAttemptsForUser, submitAttempt, updateDraft } from '../services/attemptService.js';
import { fetchProblemBySlug, fetchProblems } from '../services/problemService.js';
import { draftAttemptSchema, submitAttemptSchema } from '../validators/auth.js';
import { EvaluationService, RuleBasedEvaluator } from '../services/evaluationService.js';
import { Evaluation } from '../models/Evaluation.js';
import { isMemoryMode, memoryStore } from '../config/db.js';
import { finalizeEvaluation } from '../services/evaluationPersistence.js';

export const attemptRouter = Router();

attemptRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { problemId, slug } = req.body || {};
    const typedSlug = typeof slug === 'string' ? slug : undefined;
    const typedProblemId = typeof problemId === 'string' ? problemId : undefined;
    if (!typedProblemId && !typedSlug) {
      return res.status(400).json({ message: 'A problem identifier is required.' });
    }
    const problem = typedSlug ? await fetchProblemBySlug(typedSlug) : null;
    const targetProblemId = typedProblemId || (problem ? problem.id : null);
    if (!targetProblemId) {
      return res.status(404).json({ message: 'Problem not found.' });
    }
    const attempt = await createAttempt(req.user!.id, targetProblemId);
    return res.status(201).json({ attempt });
  } catch (error: any) {
    return next(error);
  }
});

attemptRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const attempts = await listAttemptsForUser(req.user!.id);
    return res.json({ attempts });
  } catch (error) {
    return next(error);
  }
});

attemptRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const attempt = await getAttemptById(req.user!.id, String(req.params.id));
    if (!attempt) return res.status(404).json({ message: 'Attempt not found.' });
    return res.json({ attempt });
  } catch (error) {
    if (isInvalidIdError(error)) return res.status(404).json({ message: 'Attempt not found.' });
    return next(error);
  }
});

attemptRouter.patch('/:id/draft', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = draftAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Draft data is invalid.' });
    }
    const attempt = await updateDraft(req.user!.id, String(req.params.id), parsed.data);
    return res.json({ attempt });
  } catch (error: any) {
    if (error.message === 'ATTEMPT_NOT_FOUND') return res.status(404).json({ message: 'Attempt not found.' });
    if (error.message === 'SUBMISSION_LOCKED') return res.status(409).json({ message: 'This attempt is locked because it has already been submitted.' });
    if (isInvalidIdError(error)) return res.status(404).json({ message: 'Attempt not found.' });
    return next(error);
  }
});

attemptRouter.post('/:id/submit', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = submitAttemptSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const field = firstIssue ? formatFieldPath(firstIssue.path) : '';
      return res.status(400).json({
        message: firstIssue
          ? `${field}: ${firstIssue.message}`
          : 'Submission data is invalid.',
        errors: parsed.error.issues.map((issue) => ({
          field: formatFieldPath(issue.path),
          message: issue.message,
        })),
      });
    }
    const attempt = await submitAttempt(req.user!.id, String(req.params.id), parsed.data);

    const currentAttempt = await getAttemptById(req.user!.id, String(req.params.id));
    const allProblems = await fetchProblems();
    const problemReference = (currentAttempt as any)?.problemId;
    const problemId = typeof problemReference === 'string'
      ? problemReference
      : String(problemReference?._id || problemReference?.id || problemReference || '');
    const problemSlug = (currentAttempt as any)?.problem?.slug;
    const chosenProblem = allProblems.find(
      (problem) => String(problem.id) === problemId || (problemSlug && problem.slug === problemSlug),
    );
    const evaluationService = new EvaluationService(new RuleBasedEvaluator());
    let evaluation;
    try {
      if (!chosenProblem) throw new Error('The problem associated with this attempt could not be found.');
      evaluation = await evaluationService.evaluateAttempt(
        attempt,
        chosenProblem,
      );
    } catch (evaluationError) {
      console.error(`Evaluation failed for submission ${attempt.id}:`, evaluationError);
      if (isMemoryMode()) {
        const failedAttempt = memoryStore.attempts.find((item) => item._id === attempt.id);
        if (failedAttempt) {
          failedAttempt.status = 'failed';
          failedAttempt.updatedAt = new Date();
        }
      } else {
        await (await import('../models/PracticeAttempt.js')).PracticeAttempt.findOneAndUpdate(
          { _id: attempt.id, userId: req.user!.id },
          { status: 'failed' },
        );
      }
      return res.status(502).json({
        message: 'Your submission was saved, but evaluation could not be completed. Return to your draft in History to continue or resubmit.',
      });
    }

    try {
      const savedAttempt = await finalizeEvaluation({
        markEvaluated: async () => {
          if (isMemoryMode()) {
            const record = memoryStore.attempts.find((item) =>
              item._id === attempt.id && item.userId === req.user!.id,
            );
            if (!record) return null;
            record.status = 'evaluated';
            record.evaluationId = evaluation._id;
            record.updatedAt = new Date();
            return { id: record._id, ...record };
          }
          return (await import('../models/PracticeAttempt.js')).PracticeAttempt.findOneAndUpdate(
            { _id: attempt.id, userId: req.user!.id, status: 'submitted' },
            { status: 'evaluated', evaluationId: evaluation._id },
            { new: true },
          );
        },
        removeEvaluation: async () => {
          if (isMemoryMode()) {
            memoryStore.evaluations = memoryStore.evaluations.filter((item) =>
              String(item._id) !== String(evaluation._id)
              || String(item.attemptId) !== String(attempt.id),
            );
            return;
          }
          await Evaluation.deleteOne({ _id: evaluation._id, attemptId: attempt.id });
        },
        markFailed: async () => {
          if (isMemoryMode()) {
            const record = memoryStore.attempts.find((item) =>
              item._id === attempt.id && item.userId === req.user!.id,
            );
            if (record) {
              record.status = 'failed';
              record.updatedAt = new Date();
            }
            return;
          }
          await (await import('../models/PracticeAttempt.js')).PracticeAttempt.updateOne(
            { _id: attempt.id, userId: req.user!.id, status: { $ne: 'evaluated' } },
            { $set: { status: 'failed' } },
          );
        },
      });
      return res.status(201).json({ attempt: savedAttempt, evaluation });
    } catch (persistenceError) {
      console.error(`Evaluation persistence failed for submission ${attempt.id}:`, persistenceError);
      return res.status(502).json({
        message: 'Evaluation was generated but could not be safely attached to this submission. The report is unavailable; check History before retrying.',
      });
    }
  } catch (error: any) {
    if (error.message === 'ATTEMPT_NOT_FOUND') return res.status(404).json({ message: 'Attempt not found.' });
    if (error.message === 'ALREADY_SUBMITTED') return res.status(409).json({ message: 'This attempt has already been submitted.' });
    if (isInvalidIdError(error)) return res.status(404).json({ message: 'Attempt not found.' });
    return next(error);
  }
});

attemptRouter.get('/:id/evaluation', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const attempt = await getAttemptById(req.user!.id, String(req.params.id));
    if (!attempt) return res.status(404).json({ message: 'Attempt not found.' });
    if ((attempt as any).status !== 'evaluated') {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }

    const evaluation = isMemoryMode()
      ? memoryStore.evaluations.find((item) =>
          String(item._id) === String(attempt.evaluationId)
          && String(item.attemptId) === String(req.params.id),
        )
        || memoryStore.evaluations.find((item) => String(item.attemptId) === String(req.params.id))
      : (attempt.evaluationId
          ? await Evaluation.findOne({ _id: attempt.evaluationId, attemptId: String(req.params.id) }).lean()
          : null)
        || await Evaluation.findOne({ attemptId: String(req.params.id) }).lean();

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found.' });
    }
    return res.json({ evaluation });
  } catch (error) {
    if (isInvalidIdError(error)) return res.status(404).json({ message: 'Attempt not found.' });
    return next(error);
  }
});

attemptRouter.post('/:id/evaluation/retry', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const attempt = await getAttemptById(req.user!.id, String(req.params.id));
    if (!attempt) return res.status(404).json({ message: 'Attempt not found.' });
    const allProblems = await fetchProblems();
    const matchingProblem = allProblems.find((p) => String(p.id) === String((attempt as any).problemId) || String(p.slug) === String((attempt as any).problemId)) || allProblems[0];
    const evaluationService = new EvaluationService(new RuleBasedEvaluator());
    const result = await evaluationService.evaluateAttempt(attempt, matchingProblem || { requiredConcepts: [] });
    if (isMemoryMode()) {
      const savedAttempt = memoryStore.attempts.find((item) => item._id === attempt.id);
      if (savedAttempt) savedAttempt.evaluationId = result._id;
      return res.json({ evaluation: result });
    }
    await (await import('../models/PracticeAttempt.js')).PracticeAttempt.findByIdAndUpdate(
      attempt.id,
      { evaluationId: result._id },
    );
    return res.json({ evaluation: result });
  } catch (error) {
    return next(error);
  }
});

function isInvalidIdError(error: unknown): boolean {
  return error instanceof Error && error.name === 'CastError';
}

function formatFieldPath(path: (string | number)[]): string {
  const formatted = path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') return `${result}[${segment}]`;
    return result ? `${result}.${segment}` : segment;
  }, '');
  return formatted || 'design';
}
