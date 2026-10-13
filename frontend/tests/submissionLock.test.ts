import { describe, expect, it } from 'vitest';
import { acquireSubmissionLock } from '../src/lib/submissionLock';

describe('submission click guard', () => {
  it('blocks rapid repeated submit-handler invocations until the first request finishes', () => {
    const lock = { current: false };

    expect(acquireSubmissionLock(lock)).toBe(true);
    expect(acquireSubmissionLock(lock)).toBe(false);

    lock.current = false;
    expect(acquireSubmissionLock(lock)).toBe(true);
  });
});
