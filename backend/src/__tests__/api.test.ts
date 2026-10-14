import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../index.js';
import { connectDatabase, memoryStore } from '../config/db.js';
import { ensureSeededProblems } from '../services/problemService.js';
import { EvaluationService } from '../services/evaluationService.js';

const getCsrfToken = async (agent: ReturnType<typeof request.agent>) => {
  const response = await agent.get('/api/auth/csrf');
  expect(response.status).toBe(200);
  return response.body.csrfToken as string;
};

const register = async (agent: ReturnType<typeof request.agent>, name: string, email: string) => {
  const csrfToken = await getCsrfToken(agent);
  const response = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrfToken)
    .send({ name, email, password: 'Password123' });
  expect(response.status).toBe(201);
  return csrfToken;
};

const createParkingAttempt = async (
  agent: ReturnType<typeof request.agent>,
  csrfToken: string,
  slug = 'parking-lot-system',
) => {
  const response = await agent
    .post('/api/attempts')
    .set('X-CSRF-Token', csrfToken)
    .send({ slug });
  expect(response.status).toBe(201);
  return response.body.attempt.id as string;
};

beforeEach(async () => {
  memoryStore.users = [];
  memoryStore.problems = [];
  memoryStore.attempts = [];
  memoryStore.evaluations = [];
  await connectDatabase('');
  await ensureSeededProblems();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DesignForge API', () => {
  it('returns a healthy status payload', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('registers a user and retrieves the authenticated profile', async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    const registerResponse = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'Password123',
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.email).toBe('ada@example.com');

    const meResponse = await agent.get('/api/auth/me');
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.name).toBe('Ada Lovelace');
  });

  it.each(['121', 'Alex2'])('rejects registration names containing digits: %s', async (name) => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const response = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({ name, email: 'numeric-name@example.com', password: 'Password123' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Name must contain letters');
  });

  it('creates a draft, saves it, and submits a valid LLD attempt', async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', csrfToken)
      .send({
        name: 'Grace Hopper',
        email: 'grace@example.com',
        password: 'Password123',
      });

    const problemListResponse = await agent.get('/api/problems');
    expect(problemListResponse.status).toBe(200);
    expect(problemListResponse.body.problems.length).toBeGreaterThan(0);

    const createAttemptResponse = await agent
      .post('/api/attempts')
      .set('X-CSRF-Token', csrfToken)
      .send({ slug: 'parking-lot-system' });

    expect(createAttemptResponse.status).toBe(201);
    const attemptId = createAttemptResponse.body.attempt.id;

    const design = {
      classes: [
        {
          id: 'lot',
          name: 'ParkingLot',
          responsibilities: ['Track available spots', 'Assign vehicle to slot'],
          attributes: [{ name: 'capacity', type: 'int' }],
          methods: [{ name: 'assignSpot', returnType: 'ParkingSpot', params: [{ name: 'vehicle', type: 'Vehicle' }] }],
        },
        {
          id: 'vehicle',
          name: 'Vehicle',
          responsibilities: ['Hold plate number'],
          attributes: [{ name: 'licensePlate', type: 'string' }],
          methods: [],
        },
      ],
      interfaces: [],
      relationships: [{ id: 'rel1', source: 'ParkingLot', target: 'Vehicle', type: 'associates' }],
      notes: ['Design uses a mapping of spots to vehicles.'],
    };

    const draftResponse = await agent
      .patch(`/api/attempts/${attemptId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design });

    expect(draftResponse.status).toBe(200);
    expect(draftResponse.body.attempt.designSubmission.classes[0].name).toBe('ParkingLot');

    const submitResponse = await agent
      .post(`/api/attempts/${attemptId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design });

    expect(submitResponse.status).toBe(201);
    expect(submitResponse.body.evaluation).toBeTruthy();
    expect(submitResponse.body.attempt.status).toBe('evaluated');
  });

  it('rejects empty and incomplete draft saves without changing the draft, and accepts a valid design', async () => {
    const agent = request.agent(app);
    const csrfToken = await register(agent, 'Draft Validation User', 'draft-validation@example.com');
    const draftId = await createParkingAttempt(agent, csrfToken);
    const emptyDesignResponse = await agent
      .patch(`/api/attempts/${draftId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: { classes: [], interfaces: [], relationships: [], notes: [] } });
    expect(emptyDesignResponse.status).toBe(400);
    expect(emptyDesignResponse.body.message).toContain('At least one class is required');

    const emptyFieldsResponse = await agent
      .patch(`/api/attempts/${draftId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({
        design: {
          classes: [{
            id: 'lot',
            name: '  ',
            responsibilities: [''],
            attributes: [{ name: '', type: '' }],
            methods: [{ name: '', returnType: '', params: [{ name: '', type: '' }] }],
          }],
          interfaces: [],
          relationships: [{ id: 'rel', source: '', target: '', type: 'associates' }],
          notes: [''],
        },
      });
    expect(emptyFieldsResponse.status).toBe(400);
    expect(emptyFieldsResponse.body.message).toContain('design.classes[0].name');

    const missingRequiredFieldResponse = await agent
      .patch(`/api/attempts/${draftId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({
        design: {
          classes: [{
            id: 'lot',
            name: 'ParkingLot',
            responsibilities: [],
            attributes: [{ name: 'capacity', type: '  ' }],
            methods: [],
          }],
          interfaces: [],
          relationships: [],
          notes: [],
        },
      });
    expect(missingRequiredFieldResponse.status).toBe(400);
    expect(missingRequiredFieldResponse.body.message).toContain('design.classes[0].attributes[0].type');

    const unchangedDraft = await agent.get(`/api/attempts/${draftId}`);
    expect(unchangedDraft.body.attempt.designSubmission.classes).toEqual([]);

    const validDesign = {
      classes: [{
        id: 'lot',
        name: 'ParkingLot',
        responsibilities: [''],
        attributes: [{ name: '', type: '' }],
        methods: [{ name: '', returnType: '', params: [{ name: '', type: '' }] }],
      }],
      interfaces: [],
      relationships: [{ id: 'rel', source: '', target: '', type: 'associates' }],
      notes: [''],
    };
    const validDraftResponse = await agent
      .patch(`/api/attempts/${draftId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: validDesign });
    expect(validDraftResponse.status).toBe(200);
    expect(validDraftResponse.body.attempt.designSubmission).toEqual(validDesign);
  });

  it("shows only the authenticated user's submitted attempts and completed evaluations on the dashboard", async () => {
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
    const owner = request.agent(app);
    const ownerCsrf = await register(owner, 'Dashboard Owner', 'dashboard-owner@example.com');
    const savedDraftId = await createParkingAttempt(owner, ownerCsrf);
    await owner
      .patch(`/api/attempts/${savedDraftId}/draft`)
      .set('X-CSRF-Token', ownerCsrf)
      .send({ design });
    const ownerSubmission = await owner
      .post(`/api/attempts/${savedDraftId}/submit`)
      .set('X-CSRF-Token', ownerCsrf)
      .send({ design });
    expect(ownerSubmission.status).toBe(201);

    const otherUser = request.agent(app);
    const otherCsrf = await register(otherUser, 'Other Dashboard User', 'other-dashboard@example.com');
    const otherDraftId = await createParkingAttempt(otherUser, otherCsrf);
    const otherSubmission = await otherUser
      .post(`/api/attempts/${otherDraftId}/submit`)
      .set('X-CSRF-Token', otherCsrf)
      .send({ design: { ...design, notes: ["Another user's design."] } });
    expect(otherSubmission.status).toBe(201);

    const stats = await owner.get('/api/dashboard/stats');
    expect(stats.status).toBe(200);
    expect(stats.body).toMatchObject({ totalAttempts: 1, completedEvaluations: 1 });
    expect(stats.body.recentActivity).toEqual([
      expect.objectContaining({
        id: ownerSubmission.body.attempt.id,
        problemId: ownerSubmission.body.attempt.problemId,
        status: 'evaluated',
      }),
    ]);

    const recentActivity = await owner.get('/api/dashboard/recent-activity');
    expect(recentActivity.status).toBe(200);
    expect(recentActivity.body.activity).toHaveLength(1);
    expect(recentActivity.body.activity[0]).toMatchObject({
      id: ownerSubmission.body.attempt.id,
      status: 'evaluated',
      attemptNumber: 1,
    });
    expect(recentActivity.body.activity.map((entry: any) => entry.id)).not.toContain(otherSubmission.body.attempt.id);
    expect(recentActivity.body.activity.map((entry: any) => entry.id)).not.toContain(savedDraftId);
  });

  it('retrieves the exact saved draft design by its attempt ID without creating another attempt', async () => {
    const agent = request.agent(app);
    const csrfToken = await register(agent, 'Katherine Johnson', 'katherine@example.com');
    const attemptId = await createParkingAttempt(agent, csrfToken);
    const design = {
      classes: [
        {
          id: 'lot',
          name: 'ParkingLot',
          responsibilities: ['Assign parking spaces'],
          attributes: [{ name: 'spots', type: 'ParkingSpot[]', visibility: 'private' }],
          methods: [{ name: 'assign', returnType: 'ParkingSpot', params: [{ name: 'vehicle', type: 'Vehicle' }] }],
        },
        {
          id: 'spot',
          name: 'ParkingSpot',
          responsibilities: ['Track occupancy'],
          attributes: [{ name: 'number', type: 'string' }],
          methods: [
            { name: 'occupy', returnType: 'void', params: [{ name: 'vehicleId', type: 'string' }] },
          ],
        },
      ],
      interfaces: [],
      relationships: [
        { id: 'lot-spot', source: 'ParkingLot', target: 'ParkingSpot', type: 'composes' },
        { id: 'lot-entry', source: 'ParkingLot', target: 'ParkingSpot', type: 'associates' },
      ],
      notes: ['A spot belongs to exactly one lot.'],
    };

    const saveResponse = await agent
      .patch(`/api/attempts/${attemptId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design });
    expect(saveResponse.status).toBe(200);

    const openedResponse = await agent.get(`/api/attempts/${attemptId}`);
    expect(openedResponse.status).toBe(200);
    expect(openedResponse.body.attempt.id).toBe(attemptId);
    expect(openedResponse.body.attempt.designSubmission).toEqual(design);
    expect(openedResponse.body.attempt.designSubmission.classes[1].methods[0].params[0]).toEqual({
      name: 'vehicleId',
      type: 'string',
    });

    const historyResponse = await agent.get('/api/attempts');
    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.attempts).toHaveLength(1);
    expect(historyResponse.body.attempts[0]).toMatchObject({
      id: attemptId,
      status: 'draft',
      designSubmission: design,
    });
  });

  it('preserves saved drafts separately from submissions and keeps multiple reports linked to their own attempts', async () => {
    const agent = request.agent(app);
    const csrfToken = await register(agent, 'Margaret Hamilton', 'margaret@example.com');
    const firstDraftId = await createParkingAttempt(agent, csrfToken);
    const firstDesign = {
      classes: [
        {
          id: 'lot',
          name: 'ParkingLot',
          responsibilities: ['Assign available spaces'],
          attributes: [{ name: 'spots', type: 'ParkingSpot[]' }],
          methods: [{ name: 'assign', returnType: 'ParkingSpot', params: [{ name: 'vehicle', type: 'Vehicle' }] }],
        },
        {
          id: 'spot',
          name: 'ParkingSpot',
          responsibilities: ['Track occupancy'],
          attributes: [{ name: 'number', type: 'string' }],
          methods: [{ name: 'occupy', returnType: 'void', params: [{ name: 'vehicleId', type: 'string' }] }],
        },
        {
          id: 'vehicle',
          name: 'Vehicle',
          responsibilities: ['Represent a vehicle entering the facility'],
          attributes: [{ name: 'licensePlate', type: 'string' }],
          methods: [],
        },
        {
          id: 'ticket',
          name: 'Ticket',
          responsibilities: ['Record parking entry and exit'],
          attributes: [{ name: 'ticketId', type: 'string' }],
          methods: [],
        },
      ],
      interfaces: [],
      relationships: [
        { id: 'lot-spot', source: 'ParkingLot', target: 'ParkingSpot', type: 'composes' },
        { id: 'lot-vehicle', source: 'ParkingLot', target: 'Vehicle', type: 'associates' },
        { id: 'lot-ticket', source: 'ParkingLot', target: 'Ticket', type: 'associates' },
      ],
      notes: ['Keep the saved draft unchanged when submitting.'],
    };

    const saveFirstDraft = await agent
      .patch(`/api/attempts/${firstDraftId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: firstDesign });
    expect(saveFirstDraft.status).toBe(200);

    const beforeSubmitHistory = await agent.get('/api/attempts');
    expect(beforeSubmitHistory.body.attempts).toHaveLength(1);
    expect(beforeSubmitHistory.body.attempts[0]).toMatchObject({
      id: firstDraftId,
      status: 'draft',
      designSubmission: firstDesign,
      problem: { title: 'Parking Lot System' },
    });

    const reopenedDraft = await agent.get(`/api/attempts/${firstDraftId}`);
    expect(reopenedDraft.body.attempt.id).toBe(firstDraftId);
    expect(reopenedDraft.body.attempt.designSubmission).toEqual(firstDesign);
    const draftTimestampsBeforeSubmit = {
      createdAt: reopenedDraft.body.attempt.createdAt,
      updatedAt: reopenedDraft.body.attempt.updatedAt,
    };

    const firstSubmissionResponse = await agent
      .post(`/api/attempts/${firstDraftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: firstDesign });
    expect(firstSubmissionResponse.status).toBe(201);
    const firstSubmissionId = firstSubmissionResponse.body.attempt.id;
    expect(firstSubmissionId).not.toBe(firstDraftId);
    expect(firstSubmissionResponse.body.attempt.sourceDraftId).toBe(firstDraftId);
    expect(firstSubmissionResponse.body.attempt.attemptNumber).toBe(1);
    expect(firstSubmissionResponse.body.attempt.submittedAt).toBeTruthy();
    expect(new Date(firstSubmissionResponse.body.attempt.submittedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(draftTimestampsBeforeSubmit.updatedAt).getTime(),
    );
    const duplicateSubmissionResponse = await agent
      .post(`/api/attempts/${firstDraftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: firstDesign });
    expect(duplicateSubmissionResponse.status).toBe(409);

    const historyAfterFirstSubmit = await agent.get('/api/attempts');
    const firstDraftRecord = historyAfterFirstSubmit.body.attempts.find((item: any) => item.id === firstDraftId);
    const firstEvaluatedRecord = historyAfterFirstSubmit.body.attempts.find((item: any) => item.id === firstSubmissionId);
    expect(firstDraftRecord).toMatchObject({ status: 'draft', designSubmission: firstDesign });
    expect(firstEvaluatedRecord).toMatchObject({
      status: 'evaluated',
      sourceDraftId: firstDraftId,
      designSubmission: firstDesign,
    });
    expect(firstDraftRecord.submittedToAttemptId).toBe(firstSubmissionId);
    expect(firstDraftRecord.createdAt).toBe(draftTimestampsBeforeSubmit.createdAt);
    expect(firstDraftRecord.updatedAt).toBe(draftTimestampsBeforeSubmit.updatedAt);
    expect(firstEvaluatedRecord.submittedAt).toBe(firstSubmissionResponse.body.attempt.submittedAt);

    const editedDraftDesign = {
      ...firstDesign,
      classes: firstDesign.classes.map((cls) => cls.id === 'lot'
        ? { ...cls, responsibilities: ['Assign available spaces', 'Track occupancy changes'] }
        : cls),
      notes: ['Revised after reviewing the first evaluation.'],
    };
    const historicalDraftUpdate = await agent
      .patch(`/api/attempts/${firstDraftId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: editedDraftDesign });
    expect(historicalDraftUpdate.status).toBe(200);
    expect((await agent.get(`/api/attempts/${firstDraftId}`)).body.attempt.designSubmission).toEqual(editedDraftDesign);

    const firstReport = await agent.get(`/api/attempts/${firstSubmissionId}/evaluation`);
    expect(firstReport.status).toBe(200);
    expect(firstReport.body.evaluation.attemptId).toBe(firstSubmissionId);
    expect(firstReport.body.evaluation.feedback.strengths.length).toBeGreaterThan(0);
    const originalEvaluation = firstReport.body.evaluation;

    const resubmissionResponse = await agent
      .post(`/api/attempts/${firstDraftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: editedDraftDesign });
    expect(resubmissionResponse.status).toBe(201);
    const resubmissionId = resubmissionResponse.body.attempt.id;
    expect(resubmissionId).not.toBe(firstSubmissionId);
    expect(resubmissionResponse.body.attempt.sourceDraftId).toBe(firstDraftId);
    expect(resubmissionResponse.body.attempt.attemptNumber).toBe(1);
    expect((await agent.get(`/api/attempts/${resubmissionId}`)).body.attempt.designSubmission).toEqual(editedDraftDesign);
    expect((await agent.get(`/api/attempts/${firstSubmissionId}`)).body.attempt.designSubmission).toEqual(firstDesign);
    const resubmissionReport = await agent.get(`/api/attempts/${resubmissionId}/evaluation`);
    expect(resubmissionReport.status).toBe(200);
    expect(resubmissionReport.body.evaluation.attemptId).toBe(resubmissionId);
    expect(resubmissionReport.body.evaluation._id).toBe(resubmissionResponse.body.evaluation._id);
    const firstReportAfterResubmission = await agent.get(`/api/attempts/${firstSubmissionId}/evaluation`);
    expect(firstReportAfterResubmission.body.evaluation).toEqual(originalEvaluation);

    const secondDraftId = await createParkingAttempt(agent, csrfToken, 'elevator-system');
    const secondDesign = {
      classes: [
        {
          id: 'elevator',
          name: 'Elevator',
          responsibilities: ['Move passengers between floors'],
          attributes: [{ name: 'currentFloor', type: 'number' }],
          methods: [{ name: 'moveToFloor', returnType: 'void', params: [{ name: 'floor', type: 'number' }] }],
        },
        {
          id: 'request',
          name: 'Request',
          responsibilities: ['Represent a passenger floor request'],
          attributes: [{ name: 'destinationFloor', type: 'number' }],
          methods: [],
        },
      ],
      interfaces: [],
      relationships: [{ id: 'elevator-request', source: 'Elevator', target: 'Request', type: 'associates' }],
      notes: ['A separate second attempt.'],
    };
    const saveSecondDraft = await agent
      .patch(`/api/attempts/${secondDraftId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: secondDesign });
    expect(saveSecondDraft.status).toBe(200);

    const secondSubmissionResponse = await agent
      .post(`/api/attempts/${secondDraftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: secondDesign });
    expect(secondSubmissionResponse.status).toBe(201);
    const secondSubmissionId = secondSubmissionResponse.body.attempt.id;
    expect(secondSubmissionId).not.toBe(secondDraftId);
    expect(secondSubmissionId).not.toBe(firstSubmissionId);
    expect(secondSubmissionResponse.body.attempt.attemptNumber).toBe(1);

    const completeHistory = await agent.get('/api/attempts');
    expect(completeHistory.status).toBe(200);
    expect(completeHistory.body.attempts).toHaveLength(5);
    expect(completeHistory.body.attempts.map((item: any) => item.id)).toEqual(
      expect.arrayContaining([firstDraftId, firstSubmissionId, resubmissionId, secondDraftId, secondSubmissionId]),
    );
    expect(completeHistory.body.attempts.find((item: any) => item.id === firstDraftId).designSubmission).toEqual(editedDraftDesign);
    expect(completeHistory.body.attempts.find((item: any) => item.id === firstSubmissionId).designSubmission).toEqual(firstDesign);
    expect(completeHistory.body.attempts.find((item: any) => item.id === resubmissionId).designSubmission).toEqual(editedDraftDesign);
    expect(completeHistory.body.attempts.find((item: any) => item.id === secondDraftId).designSubmission).toEqual(secondDesign);
    expect(completeHistory.body.attempts.find((item: any) => item.id === secondSubmissionId).designSubmission).toEqual(secondDesign);
    expect(completeHistory.body.attempts.find((item: any) => item.id === secondSubmissionId).problem.title).toBe('Elevator System');

    const secondReport = await agent.get(`/api/attempts/${secondSubmissionId}/evaluation`);
    expect(secondReport.status).toBe(200);
    expect(secondReport.body.evaluation.attemptId).toBe(secondSubmissionId);
    expect(secondReport.body.evaluation.attemptId).not.toBe(firstSubmissionId);
    expect(secondReport.body.evaluation._id).toBe(secondSubmissionResponse.body.evaluation._id);
    expect(secondReport.body.evaluation.overallScore).not.toBe(firstReport.body.evaluation.overallScore);
    expect((await agent.get(`/api/attempts/${firstDraftId}`)).body.attempt.designSubmission).toEqual(editedDraftDesign);
  });

  it('allows only one concurrent unchanged submission for a draft', async () => {
    const agent = request.agent(app);
    const csrfToken = await register(agent, 'Dorothy Vaughan', 'dorothy-concurrent@example.com');
    const draftId = await createParkingAttempt(agent, csrfToken);
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
      notes: ['Concurrent idempotency test.'],
    };
    const submit = () => agent
      .post(`/api/attempts/${draftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design });

    const [first, second] = await Promise.all([submit(), submit()]);
    expect([first.status, second.status].sort()).toEqual([201, 409]);
    const history = await agent.get('/api/attempts');
    const submissions = history.body.attempts.filter((item: any) => item.sourceDraftId === draftId);
    expect(submissions).toHaveLength(1);
    expect((await agent.get(`/api/attempts/${submissions[0].id}/evaluation`)).status).toBe(200);
  });

  it('returns the saved evaluation for the selected attempt without creating another attempt', async () => {
    const agent = request.agent(app);
    const csrfToken = await register(agent, 'Dorothy Vaughan', 'dorothy@example.com');
    const attemptId = await createParkingAttempt(agent, csrfToken);
    const originalDesign = {
      classes: [{
        id: 'lot',
        name: 'ParkingLot',
        responsibilities: ['Manage parking'],
        attributes: [{ name: 'capacity', type: 'number' }],
        methods: [{ name: 'assign', returnType: 'void', params: [] }],
      }],
      interfaces: [],
      relationships: [],
      notes: ['Original draft.'],
    };
    const design = {
      classes: [
        {
          id: 'lot',
          name: 'ParkingLot',
          responsibilities: ['Track and assign spots'],
          attributes: [{ name: 'spots', type: 'ParkingSpot[]' }],
          methods: [{ name: 'assign', returnType: 'ParkingSpot', params: [{ name: 'vehicle', type: 'Vehicle' }] }],
        },
        {
          id: 'spot',
          name: 'ParkingSpot',
          responsibilities: ['Track occupancy'],
          attributes: [{ name: 'number', type: 'string' }],
          methods: [],
        },
        {
          id: 'vehicle',
          name: 'Vehicle',
          responsibilities: ['Represent a parked vehicle'],
          attributes: [{ name: 'licensePlate', type: 'string' }],
          methods: [],
        },
        {
          id: 'ticket',
          name: 'Ticket',
          responsibilities: ['Record vehicle entry and exit'],
          attributes: [{ name: 'ticketId', type: 'string' }],
          methods: [],
        },
      ],
      interfaces: [],
      relationships: [
        { id: 'lot-spot', source: 'ParkingLot', target: 'ParkingSpot', type: 'composes' },
        { id: 'lot-vehicle', source: 'ParkingLot', target: 'Vehicle', type: 'associates' },
        { id: 'lot-ticket', source: 'ParkingLot', target: 'Ticket', type: 'associates' },
      ],
      notes: ['Release a spot when the vehicle exits.'],
    };
    const saveOriginal = await agent
      .patch(`/api/attempts/${attemptId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: originalDesign });
    expect(saveOriginal.status).toBe(200);
    const saveEdited = await agent
      .patch(`/api/attempts/${attemptId}/draft`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design });
    expect(saveEdited.status).toBe(200);

    const submissionResponse = await agent
      .post(`/api/attempts/${attemptId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design });
    expect(submissionResponse.status).toBe(201);
    expect(submissionResponse.body.attempt.id).not.toBe(attemptId);
    expect(submissionResponse.body.attempt.designSubmission).toEqual(design);
    const submittedEvaluation = submissionResponse.body.evaluation;

    const reportResponse = await agent.get(`/api/attempts/${submissionResponse.body.attempt.id}/evaluation`);
    expect(reportResponse.status).toBe(200);
    expect(reportResponse.body.evaluation.attemptId).toBe(submissionResponse.body.attempt.id);
    expect(reportResponse.body.evaluation.overallScore).toBe(submittedEvaluation.overallScore);
    expect(reportResponse.body.evaluation.feedback).toEqual(submittedEvaluation.feedback);
    expect(reportResponse.body.evaluation.feedback.strengths.length).toBeGreaterThan(0);
    expect(reportResponse.body.evaluation.categoryScores).toEqual(submittedEvaluation.categoryScores);
    expect(submittedEvaluation.overallScore).toBeGreaterThan(92);

    const historyResponse = await agent.get('/api/attempts');
    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.attempts).toHaveLength(2);
    expect(historyResponse.body.attempts.map((item: any) => item.id)).toEqual(
      expect.arrayContaining([attemptId, submissionResponse.body.attempt.id]),
    );
    expect(historyResponse.body.attempts.find((item: any) => item.id === attemptId).status).toBe('draft');
    expect(historyResponse.body.attempts.find((item: any) => item.id === submissionResponse.body.attempt.id).status).toBe('evaluated');
  });

  it('returns a field-specific validation error for an incomplete design entry', async () => {
    const agent = request.agent(app);
    const csrfToken = await register(agent, 'Nina Simone', 'nina@example.com');
    const draftId = await createParkingAttempt(agent, csrfToken);
    const emptyDesignResponse = await agent
      .post(`/api/attempts/${draftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: { classes: [], interfaces: [], relationships: [], notes: [] } });
    expect(emptyDesignResponse.status).toBe(400);
    expect(emptyDesignResponse.body.message).toContain('At least one class is required');

    const invalidNameResponse = await agent
      .post(`/api/attempts/${draftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({
        design: {
          classes: [{
            id: 'lot',
            name: '   ',
            responsibilities: [],
            attributes: [],
            methods: [],
          }],
          interfaces: [],
          relationships: [],
          notes: [],
        },
      });

    expect(invalidNameResponse.status).toBe(400);
    expect(invalidNameResponse.body.message).toContain('design.classes[0].name');
    const nameError = invalidNameResponse.body.errors.find((issue: any) => issue.field === 'design.classes[0].name');
    expect(nameError?.message).toBeTruthy();
    expect((await agent.get('/api/attempts')).body.attempts).toHaveLength(1);

    const invalidResponsibilityResponse = await agent
      .post(`/api/attempts/${draftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({
        design: {
          classes: [{
            id: 'lot',
            name: 'ParkingLot',
            responsibilities: ['   '],
            attributes: [],
            methods: [],
          }],
          interfaces: [],
          relationships: [],
          notes: [],
        },
      });
    expect(invalidResponsibilityResponse.status).toBe(400);
    expect(invalidResponsibilityResponse.body.message).toContain('design.classes[0].responsibilities[0]');

    const validDesign = {
      classes: [{
        id: 'lot',
        name: 'ParkingLot',
        responsibilities: ['Manage parking'],
        attributes: [{ name: 'capacity', type: 'number', visibility: 'private' }],
        methods: [],
      }],
      interfaces: [],
      relationships: [],
      notes: [],
    };
    const validResponse = await agent
      .post(`/api/attempts/${draftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design: validDesign });
    expect(validResponse.status).toBe(201);
    expect(validResponse.body.attempt.designSubmission).toEqual(validDesign);
  });

  it('marks the submission as failed and returns an explicit error when evaluation fails', async () => {
    const agent = request.agent(app);
    const csrfToken = await register(agent, 'Katherine Johnson', 'katherine@example.com');
    const draftId = await createParkingAttempt(agent, csrfToken);
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
      notes: ['Keep this saved design.'],
    };
    vi.spyOn(EvaluationService.prototype, 'evaluateAttempt').mockRejectedValueOnce(new Error('Evaluator unavailable'));

    const response = await agent
      .post(`/api/attempts/${draftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design });

    expect(response.status).toBe(502);
    expect(response.body.message).toContain('evaluation could not be completed');
    const history = await agent.get('/api/attempts');
    const failedSubmission = history.body.attempts.find((item: any) => item.sourceDraftId === draftId);
    expect(failedSubmission).toMatchObject({ status: 'failed', designSubmission: design });
    expect((await agent.get(`/api/attempts/${draftId}`)).body.attempt.status).toBe('draft');
    expect((await agent.get(`/api/attempts/${failedSubmission.id}/evaluation`)).status).toBe(404);
  });

  it('returns not found when a submission has no saved evaluation report', async () => {
    const agent = request.agent(app);
    const csrfToken = await register(agent, 'Evelyn Boyd Granville', 'evelyn@example.com');
    const draftId = await createParkingAttempt(agent, csrfToken);
    const design = {
      classes: [{
        id: 'lot',
        name: 'ParkingLot',
        responsibilities: ['Manage parking'],
        attributes: [{ name: 'capacity', type: 'number' }],
        methods: [],
      }],
      interfaces: [],
      relationships: [],
      notes: ['Test missing report handling.'],
    };
    const submission = await agent
      .post(`/api/attempts/${draftId}/submit`)
      .set('X-CSRF-Token', csrfToken)
      .send({ design });
    expect(submission.status).toBe(201);

    const submissionId = submission.body.attempt.id;
    memoryStore.evaluations = memoryStore.evaluations.filter((item) => String(item.attemptId) !== submissionId);
    const report = await agent.get(`/api/attempts/${submissionId}/evaluation`);
    expect(report.status).toBe(404);
    expect(report.body.message).toBe('Evaluation not found.');
  });

  it('does not allow another user to access an attempt or its evaluation', async () => {
    const owner = request.agent(app);
    const ownerCsrf = await register(owner, 'Mary Jackson', 'mary@example.com');
    const attemptId = await createParkingAttempt(owner, ownerCsrf);
    const design = {
      classes: [{
        id: 'lot',
        name: 'ParkingLot',
        responsibilities: ['Manage spots'],
        attributes: [{ name: 'spots', type: 'ParkingSpot[]' }],
        methods: [],
      }],
      interfaces: [],
      relationships: [],
      notes: ['Single-user access test.'],
    };
    const submitResponse = await owner
      .post(`/api/attempts/${attemptId}/submit`)
      .set('X-CSRF-Token', ownerCsrf)
      .send({ design });
    expect(submitResponse.status).toBe(201);

    const otherUser = request.agent(app);
    await register(otherUser, 'Annie Easley', 'annie@example.com');

    expect((await otherUser.get(`/api/attempts/${attemptId}`)).status).toBe(404);
    expect((await otherUser.get(`/api/attempts/${attemptId}/evaluation`)).status).toBe(404);
    expect((await otherUser.get('/api/attempts')).body.attempts).toHaveLength(0);
  });

  it('returns a clear not-found response for invalid attempt IDs', async () => {
    const agent = request.agent(app);
    await register(agent, 'Edith Clarke', 'edith@example.com');

    expect((await agent.get('/api/attempts/missing-attempt-id')).status).toBe(404);
    expect((await agent.get('/api/attempts/missing-attempt-id/evaluation')).status).toBe(404);
  });
});
