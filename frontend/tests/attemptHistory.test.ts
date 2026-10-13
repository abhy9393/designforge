import { describe, expect, it } from 'vitest';
import { getAttemptHistoryDate, getAttemptOpenPath } from '../src/lib/attemptHistory.js';

describe('attempt history presentation', () => {
  it('opens drafts for editing and submitted/evaluated attempts at their own report route', () => {
    expect(getAttemptOpenPath({ id: 'draft-1', status: 'draft' })).toBe('/practice/draft-1');
    expect(getAttemptOpenPath({ id: 'submission-1', status: 'submitted' })).toBe('/attempts/submission-1/report');
    expect(getAttemptOpenPath({ id: 'submission-2', status: 'evaluated' })).toBe('/attempts/submission-2/report');
  });

  it('uses the last saved time for drafts and submitted time for submissions in local time', () => {
    const lastSaved = '2026-10-13T13:00:00.000Z';
    const submitted = '2026-10-13T13:15:00.000Z';
    const expectedLocal = (value: string) =>
      new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

    expect(getAttemptHistoryDate({
      id: 'draft-1',
      status: 'draft',
      createdAt: '2026-10-13T12:00:00.000Z',
      updatedAt: lastSaved,
      submittedAt: submitted,
    })).toEqual({ label: 'Last saved', value: expectedLocal(lastSaved) });
    expect(getAttemptHistoryDate({
      id: 'submission-1',
      status: 'evaluated',
      createdAt: '2026-10-13T13:14:00.000Z',
      updatedAt: '2026-10-13T14:00:00.000Z',
      submittedAt: submitted,
    })).toEqual({ label: 'Submitted', value: expectedLocal(submitted) });
  });

  it('falls back to an actual creation date and gracefully handles missing legacy dates', () => {
    const createdAt = '2026-10-13T12:00:00.000Z';
    expect(getAttemptHistoryDate({ id: 'legacy-draft', status: 'draft', createdAt })).toEqual({
      label: 'Created',
      value: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(createdAt)),
    });
    expect(getAttemptHistoryDate({ id: 'legacy-submission', status: 'evaluated' })).toEqual({
      label: 'Date',
      value: 'Date unavailable',
    });
  });
});
