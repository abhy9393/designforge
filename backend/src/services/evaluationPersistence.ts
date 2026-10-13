export interface EvaluationFinalizationOperations<T> {
  markEvaluated(): Promise<T | null>;
  removeEvaluation(): Promise<void>;
  markFailed(): Promise<void>;
}

export async function finalizeEvaluation<T>(
  operations: EvaluationFinalizationOperations<T>,
): Promise<T> {
  try {
    const attempt = await operations.markEvaluated();
    if (!attempt) throw new Error('Submitted attempt could not be marked evaluated.');
    return attempt;
  } catch (finalizationError) {
    try {
      await operations.removeEvaluation();
      await operations.markFailed();
    } catch (compensationError) {
      throw new AggregateError(
        [finalizationError, compensationError],
        'Evaluation persistence failed and compensation was incomplete.',
      );
    }
    throw finalizationError;
  }
}
