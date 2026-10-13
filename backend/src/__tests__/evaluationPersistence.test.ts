import { describe, expect, it, vi } from 'vitest';
import { finalizeEvaluation } from '../services/evaluationPersistence.js';

describe('evaluation persistence finalization', () => {
  it('removes the saved report and marks the submission failed if attaching the report fails', async () => {
    const removeEvaluation = vi.fn().mockResolvedValue(undefined);
    const markFailed = vi.fn().mockResolvedValue(undefined);

    await expect(finalizeEvaluation({
      markEvaluated: vi.fn().mockRejectedValue(new Error('Attempt update unavailable')),
      removeEvaluation,
      markFailed,
    })).rejects.toThrow('Attempt update unavailable');

    expect(removeEvaluation).toHaveBeenCalledOnce();
    expect(markFailed).toHaveBeenCalledOnce();
  });

  it('surfaces incomplete compensation instead of reporting a saved evaluation', async () => {
    const compensationError = new Error('Report cleanup unavailable');

    await expect(finalizeEvaluation({
      markEvaluated: vi.fn().mockResolvedValue(null),
      removeEvaluation: vi.fn().mockRejectedValue(compensationError),
      markFailed: vi.fn().mockResolvedValue(undefined),
    })).rejects.toMatchObject({
      message: 'Evaluation persistence failed and compensation was incomplete.',
      errors: expect.arrayContaining([compensationError]),
    });
  });
});
