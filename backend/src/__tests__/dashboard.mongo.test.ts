import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { ensureSeededProblems } from '../services/problemService.js';
import { ensureRepeatSubmissionIndex } from '../services/attemptService.js';

let mongoServer: MongoMemoryServer;

async function register(name: string, email: string) {
  const agent = request.agent(app);
  const csrfResponse = await agent.get('/api/auth/csrf');
  const response = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrfResponse.body.csrfToken)
    .send({ name, email, password: 'Password123' });
  expect(response.status).toBe(201);
  return { agent, csrfToken: csrfResponse.body.csrfToken };
}

describe('MongoDB dashboard integration', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: { dbName: 'designforge_test_dashboard' },
    });
    await mongoose.connect(mongoServer.getUri());
    await ensureRepeatSubmissionIndex();
    await ensureSeededProblems();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("counts only the authenticated user's submissions and returns their completed activity", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const owner = await register('Mongo Dashboard Owner', `owner-${suffix}@example.com`);
    const otherUser = await register('Mongo Dashboard Other', `other-${suffix}@example.com`);
    const design = {
      classes: [{
        id: 'lot',
        name: 'ParkingLot',
        responsibilities: ['Manage parking'],
        attributes: [{ name: 'capacity', type: 'number' }],
        methods: [{ name: 'assign', returnType: 'void', params: [] }],
      }],
      interfaces: [],
      relationships: [],
      notes: [],
    };

    const ownerDraft = await owner.agent
      .post('/api/attempts')
      .set('X-CSRF-Token', owner.csrfToken)
      .send({ slug: 'parking-lot-system' });
    expect(ownerDraft.status).toBe(201);
    const saveDraft = await owner.agent
      .patch(`/api/attempts/${ownerDraft.body.attempt.id}/draft`)
      .set('X-CSRF-Token', owner.csrfToken)
      .send({ design });
    expect(saveDraft.status).toBe(200);
    const ownerSubmission = await owner.agent
      .post(`/api/attempts/${ownerDraft.body.attempt.id}/submit`)
      .set('X-CSRF-Token', owner.csrfToken)
      .send({ design });
    expect(ownerSubmission.status).toBe(201);

    const otherDraft = await otherUser.agent
      .post('/api/attempts')
      .set('X-CSRF-Token', otherUser.csrfToken)
      .send({ slug: 'parking-lot-system' });
    expect(otherDraft.status).toBe(201);
    const otherSubmission = await otherUser.agent
      .post(`/api/attempts/${otherDraft.body.attempt.id}/submit`)
      .set('X-CSRF-Token', otherUser.csrfToken)
      .send({ design: { ...design, notes: ['Not owned by the dashboard user.'] } });
    expect(otherSubmission.status).toBe(201);

    const stats = await owner.agent.get('/api/dashboard/stats');
    expect(stats.status).toBe(200);
    expect(stats.body).toMatchObject({ totalAttempts: 1, completedEvaluations: 1 });
    expect(stats.body.recentActivity).toEqual([
      expect.objectContaining({
        id: String(ownerSubmission.body.attempt._id),
        problemId: ownerSubmission.body.attempt.problemId,
        status: 'evaluated',
      }),
    ]);

    const recentActivity = await owner.agent.get('/api/dashboard/recent-activity');
    expect(recentActivity.status).toBe(200);
    expect(recentActivity.body.activity).toHaveLength(1);
    expect(recentActivity.body.activity[0]).toMatchObject({
      id: String(ownerSubmission.body.attempt._id),
      status: 'evaluated',
      attemptNumber: 1,
    });
    expect(recentActivity.body.activity.map((entry: { id: string }) => entry.id))
      .not.toContain(String(otherSubmission.body.attempt._id));
    expect(recentActivity.body.activity.map((entry: { id: string }) => entry.id))
      .not.toContain(String(ownerDraft.body.attempt._id));
  });
});
