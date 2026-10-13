import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { PracticeAttempt } from '../models/PracticeAttempt.js';
import { ensureRepeatSubmissionIndex } from '../services/attemptService.js';
import { ensureSeededProblems } from '../services/problemService.js';
import { env } from '../config/env.js';
import { validateMongoTestUri } from '../config/mongoTestSafety.js';

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

describe('MongoDB submission idempotency integration', () => {
  beforeAll(async () => {
    const mongoUri = validateMongoTestUri(process.env.DESIGNFORGE_TEST_MONGO_URI, env.MONGO_URI);
    await mongoose.connect(mongoUri);
    await ensureRepeatSubmissionIndex();
    await ensureSeededProblems();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('atomically blocks identical concurrent submissions and preserves distinct reports', async () => {
    const submissionIndex = (await PracticeAttempt.collection.indexes())
      .find((index) => index.name === 'unique_submission_design_per_draft');
    expect(submissionIndex?.unique).toBe(true);

    const emailSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const owner = await register('Mongo Integration User', `owner-${emailSuffix}@example.com`);
    const otherUser = await register('Other Integration User', `other-${emailSuffix}@example.com`);
    const draftResponse = await owner.agent
      .post('/api/attempts')
      .set('X-CSRF-Token', owner.csrfToken)
      .send({ slug: 'parking-lot-system' });
    expect(draftResponse.status).toBe(201);
    const draftId = draftResponse.body.attempt.id;

    const initialDesign = {
      classes: [{
        id: 'lot',
        name: 'ParkingLot',
        responsibilities: ['Manage parking'],
        attributes: [{ name: 'capacity', type: 'number' }],
        methods: [{ name: 'assign', returnType: 'void', params: [] }],
      }],
      interfaces: [],
      relationships: [],
      notes: ['Initial saved design.'],
    };
    const editedDesign = {
      ...initialDesign,
      classes: [{
        ...initialDesign.classes[0],
        responsibilities: ['Manage parking', 'Track occupancy changes'],
      }],
      notes: ['Edited design submitted after review.'],
    };
    const submit = (design: typeof initialDesign) => owner.agent
      .post(`/api/attempts/${draftId}/submit`)
      .set('X-CSRF-Token', owner.csrfToken)
      .send({ design });

    const [first, concurrentDuplicate] = await Promise.all([
      submit(initialDesign),
      submit(initialDesign),
    ]);
    expect([first.status, concurrentDuplicate.status].sort()).toEqual([201, 409]);
    const firstSuccess = first.status === 201 ? first : concurrentDuplicate;
    const firstAttemptId = String(firstSuccess.body.attempt.id || firstSuccess.body.attempt._id);
    expect(firstSuccess.body.attempt.designSubmission).toEqual(initialDesign);

    expect((await submit(initialDesign)).status).toBe(409);
    const firstReport = await owner.agent.get(`/api/attempts/${firstAttemptId}/evaluation`);
    expect(firstReport.status).toBe(200);
    expect(firstReport.body.evaluation.attemptId).toBe(firstAttemptId);

    const editedSubmission = await submit(editedDesign);
    expect(editedSubmission.status).toBe(201);
    const editedAttemptId = String(editedSubmission.body.attempt.id || editedSubmission.body.attempt._id);
    expect(editedAttemptId).not.toBe(firstAttemptId);
    expect(editedSubmission.body.attempt.designSubmission).toEqual(editedDesign);
    const editedReport = await owner.agent.get(`/api/attempts/${editedAttemptId}/evaluation`);
    expect(editedReport.status).toBe(200);
    expect(editedReport.body.evaluation.attemptId).toBe(editedAttemptId);
    expect(editedReport.body.evaluation._id).toBe(editedSubmission.body.evaluation._id);

    const firstReportAfterResubmit = await owner.agent.get(`/api/attempts/${firstAttemptId}/evaluation`);
    expect(firstReportAfterResubmit.body.evaluation).toEqual(firstReport.body.evaluation);
    expect((await owner.agent.get(`/api/attempts/${firstAttemptId}`)).body.attempt.designSubmission).toEqual(initialDesign);
    expect(await PracticeAttempt.countDocuments({ sourceDraftId: draftId })).toBe(2);
    expect((await otherUser.agent.get(`/api/attempts/${firstAttemptId}/evaluation`)).status).toBe(404);
    expect((await otherUser.agent.get(`/api/attempts/${editedAttemptId}/evaluation`)).status).toBe(404);
  });
});
