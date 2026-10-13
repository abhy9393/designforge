import { isMemoryMode, memoryStore } from '../config/db.js';

export async function getDashboardStats(userId: string) {
  if (isMemoryMode()) {
    const attempts = memoryStore.attempts.filter((a) => a.userId === userId);
    const completedEvaluations = attempts.filter((a) => a.status === 'evaluated' || a.status === 'failed').length;
    return {
      totalAttempts: attempts.length,
      completedEvaluations,
      recentActivity: attempts.slice(-3).map((a) => ({
        id: a._id,
        status: a.status,
        updatedAt: a.updatedAt,
        problemId: a.problemId,
      })),
    };
  }

  return {
    totalAttempts: 0,
    completedEvaluations: 0,
    recentActivity: [],
  };
}

export async function getRecentActivity(userId: string) {
  if (isMemoryMode()) {
    return memoryStore.attempts
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((a) => ({
        id: a._id,
        problemId: a.problemId,
        status: a.status,
        updatedAt: a.updatedAt,
        attemptNumber: a.attemptNumber,
      }));
  }

  return [];
}
