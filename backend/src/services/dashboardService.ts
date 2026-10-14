import { isMemoryMode, memoryStore } from '../config/db.js';
import { Evaluation } from '../models/Evaluation.js';
import { PracticeAttempt } from '../models/PracticeAttempt.js';

const submittedStatuses = ['submitted', 'evaluating', 'evaluated', 'failed'] as const;

type DashboardAttempt = {
  _id: unknown;
  problemId: unknown;
  status: string;
  updatedAt: Date;
  attemptNumber: number;
};

function toActivity(attempt: DashboardAttempt) {
  return {
    id: String(attempt._id),
    problemId: String(attempt.problemId),
    status: attempt.status,
    updatedAt: attempt.updatedAt,
    attemptNumber: attempt.attemptNumber,
  };
}

export async function getDashboardStats(userId: string) {
  if (isMemoryMode()) {
    const attempts = memoryStore.attempts.filter((a) =>
      String(a.userId) === userId && submittedStatuses.includes(a.status),
    );
    const attemptIds = new Set(attempts.map((attempt) => String(attempt._id)));
    const completedEvaluations = memoryStore.evaluations.filter((evaluation) =>
      evaluation.status === 'completed' && attemptIds.has(String(evaluation.attemptId)),
    ).length;
    return {
      totalAttempts: attempts.length,
      completedEvaluations,
      recentActivity: attempts
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
        .map(toActivity),
    };
  }

  const filter = { userId, status: { $in: submittedStatuses } };
  const [totalAttempts, recentAttempts, submittedAttemptIds] = await Promise.all([
    PracticeAttempt.countDocuments(filter),
    PracticeAttempt.find(filter)
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('_id problemId status updatedAt attemptNumber')
      .lean<DashboardAttempt[]>(),
    PracticeAttempt.distinct('_id', filter),
  ]);
  const completedEvaluations = submittedAttemptIds.length
    ? await Evaluation.countDocuments({
      attemptId: { $in: submittedAttemptIds },
      status: 'completed',
    })
    : 0;

  return {
    totalAttempts,
    completedEvaluations,
    recentActivity: recentAttempts.map(toActivity),
  };
}

export async function getRecentActivity(userId: string) {
  if (isMemoryMode()) {
    return memoryStore.attempts
      .filter((a) => String(a.userId) === userId && submittedStatuses.includes(a.status))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(toActivity);
  }

  const attempts = await PracticeAttempt.find({
    userId,
    status: { $in: submittedStatuses },
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('_id problemId status updatedAt attemptNumber')
    .lean<DashboardAttempt[]>();
  return attempts.map(toActivity);
}
