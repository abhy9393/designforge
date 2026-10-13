import { isMemoryMode, memoryStore } from '../config/db.js';
import { PracticeAttempt } from '../models/PracticeAttempt.js';
import { Problem } from '../models/Problem.js';
import { createHash } from 'node:crypto';

export async function createAttempt(userId: string, problemId: string) {
  if (isMemoryMode()) {
    const problems = memoryStore.problems as any[];
    const attempts = memoryStore.attempts as any[];
    const problem = problems.find((p) => p._id === problemId || p.id === problemId);
    if (!problem) throw new Error('PROBLEM_NOT_FOUND');
    const userAttempts = attempts.filter((a) =>
      a.userId === userId && a.problemId === problemId && !a.sourceDraftId,
    );
    const attemptNumber = userAttempts.length + 1;
    const attempt = {
      _id: randomId(),
      userId,
      problemId,
      attemptNumber,
      status: 'draft',
      designSubmission: { classes: [], interfaces: [], relationships: [], notes: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    attempts.push(attempt);
    return { id: attempt._id, ...attempt, problemId: attempt.problemId, userId: attempt.userId };
  }

  const problem = await Problem.findById(problemId); 
  if (!problem) throw new Error('PROBLEM_NOT_FOUND');
  const count = await PracticeAttempt.countDocuments({ userId, problemId, sourceDraftId: { $exists: false } });
  const attempt = await PracticeAttempt.create({
    userId,
    problemId,
    attemptNumber: count + 1,
    status: 'draft',
    designSubmission: { classes: [], interfaces: [], relationships: [], notes: [] },
    version: 1,
  });
  return { id: attempt._id.toString(), ...attempt.toObject() };
}

export async function listAttemptsForUser(userId: string) {
  if (isMemoryMode()) {
    const attempts = memoryStore.attempts as any[];
    const problems = memoryStore.problems as any[];
    return attempts
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((a) => {
        const problem = problems.find((item) => item._id === a.problemId || item.id === a.problemId);
        return {
          id: a._id,
          ...a,
          problem: problem ? {
            id: problem._id || problem.id,
            title: problem.title,
            slug: problem.slug,
            difficulty: problem.difficulty,
          } : null,
        };
      });
  }

  const attempts = await PracticeAttempt.find({ userId }).populate('problemId', 'title slug difficulty').lean();
  return attempts.map((attempt: any) => ({
    id: attempt._id.toString(),
    problem: attempt.problemId,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
    submittedAt: attempt.submittedAt,
    evaluationId: attempt.evaluationId?.toString(),
    sourceDraftId: attempt.sourceDraftId?.toString(),
    submittedToAttemptId: attempt.submittedToAttemptId?.toString(),
    designSubmission: attempt.designSubmission,
  }));
}

export async function ensureRepeatSubmissionIndex() {
  if (isMemoryMode()) return;

  let indexes: Awaited<ReturnType<typeof PracticeAttempt.collection.indexes>>;
  try {
    indexes = await PracticeAttempt.collection.indexes();
  } catch (error: any) {
    if (error?.code !== 26) throw error;
    indexes = [];
  }
  const legacyUniqueIndex = indexes.find((index) =>
    index.unique
    && Object.keys(index.key || {}).length === 1
    && index.key?.sourceDraftId === 1,
  );
  if (legacyUniqueIndex) {
    if (!legacyUniqueIndex.name) {
      throw new Error('Cannot remove the legacy unique source-draft index because it has no name.');
    }
    await PracticeAttempt.collection.dropIndex(legacyUniqueIndex.name);
  }
  await PracticeAttempt.collection.createIndex(
    { userId: 1, sourceDraftId: 1, designHash: 1 },
    {
      unique: true,
      name: 'unique_submission_design_per_draft',
      partialFilterExpression: {
        sourceDraftId: { $exists: true },
        designHash: { $type: 'string' },
      },
    },
  );
}

export async function getAttemptById(userId: string, attemptId: string) {
  if (isMemoryMode()) {
    const attempts = memoryStore.attempts as any[];
    const attempt = attempts.find((a: any) => a._id === attemptId);
    if (!attempt || attempt.userId !== userId) return null;
    const record = attempt as any;
    return { id: record._id, ...record };
  }

  const attempt = await PracticeAttempt.findOne({ _id: attemptId, userId }).populate('problemId', 'title slug difficulty').lean();
  if (!attempt) return null;
  const record = attempt as any;
  return { id: String(record._id), ...record, problem: record.problemId };
}

export async function updateDraft(userId: string, attemptId: string, payload: any) {
  if (isMemoryMode()) {
    const attempts = memoryStore.attempts as any[];
    const attempt = attempts.find((a) => a._id === attemptId && a.userId === userId);
    if (!attempt) throw new Error('ATTEMPT_NOT_FOUND');
    if (attempt.status === 'submitted' || attempt.status === 'evaluated' || attempt.status === 'failed') {
      throw new Error('SUBMISSION_LOCKED');
    }
    attempt.designSubmission = payload.design || attempt.designSubmission;
    attempt.title = payload.title || attempt.title;
    attempt.updatedAt = new Date();
    attempt.version = (attempt.version || 1) + 1;
    return { id: attempt._id, ...attempt };
  }

  const attempt = await PracticeAttempt.findOne({ _id: attemptId, userId });
  if (!attempt) throw new Error('ATTEMPT_NOT_FOUND');
  if (['submitted', 'evaluated', 'failed'].includes(attempt.status)) throw new Error('SUBMISSION_LOCKED');
  attempt.designSubmission = payload.design || attempt.designSubmission;
  attempt.version = (attempt.version || 1) + 1;
  await attempt.save();
  return { id: attempt._id.toString(), ...attempt.toObject() };
}

export async function submitAttempt(userId: string, attemptId: string, payload?: any) {
  const design = payload?.design;
  const designHash = hashDesign(design);
  if (isMemoryMode()) {
    const attempts = memoryStore.attempts as any[];
    const draft = attempts.find((a) => a._id === attemptId && a.userId === userId);
    if (!draft) throw new Error('ATTEMPT_NOT_FOUND');
    const duplicate = attempts.some((item) =>
      item.userId === userId
      && item.sourceDraftId === draft._id
      && hashDesign(item.designSubmission) === designHash,
    );
    if (duplicate) throw new Error('ALREADY_SUBMITTED');
    if (draft.status !== 'draft') {
      throw new Error('ALREADY_SUBMITTED');
    }
    const submittedAt = new Date();
    const submission = {
      _id: randomId(),
      userId: draft.userId,
      problemId: draft.problemId,
      sourceDraftId: draft._id,
      designHash,
      attemptNumber: draft.attemptNumber,
      status: 'submitted',
      designSubmission: payload?.design || draft.designSubmission,
      submittedAt,
      createdAt: submittedAt,
      updatedAt: submittedAt,
      version: 1,
    };
    attempts.push(submission);
    draft.submittedToAttemptId = submission._id;
    return { id: submission._id, ...submission };
  }

  const draft = await PracticeAttempt.findOne({ _id: attemptId, userId });
  if (!draft) throw new Error('ATTEMPT_NOT_FOUND');
  if (draft.status !== 'draft') throw new Error('ALREADY_SUBMITTED');
  const previousSubmissions = await PracticeAttempt.find({ userId, sourceDraftId: draft._id })
    .select('designHash designSubmission')
    .lean();
  if (previousSubmissions.some((item: any) =>
    (item.designHash || hashDesign(item.designSubmission)) === designHash,
  )) {
    throw new Error('ALREADY_SUBMITTED');
  }
  const submittedAt = new Date();
  let submission;
  try {
    submission = await PracticeAttempt.create({
      userId: draft.userId,
      problemId: draft.problemId,
      sourceDraftId: draft._id,
      designHash,
      attemptNumber: draft.attemptNumber,
      status: 'submitted',
      designSubmission: design || draft.designSubmission,
      submittedAt,
      version: 1,
    });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.designHash) {
      throw new Error('ALREADY_SUBMITTED');
    }
    throw error;
  }
  draft.submittedToAttemptId = submission._id;
  await PracticeAttempt.updateOne(
    { _id: draft._id, userId },
    { $set: { submittedToAttemptId: submission._id } },
    { timestamps: false },
  );
  return { id: submission._id.toString(), ...submission.toObject() };
}

function randomId() {
  return `attempt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function hashDesign(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
