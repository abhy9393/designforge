type AttemptHistoryRecord = {
  id: string;
  status: string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  submittedAt?: string | Date | null;
};

export function getAttemptOpenPath(attempt: Pick<AttemptHistoryRecord, 'id' | 'status'>) {
  return attempt.status === 'draft'
    ? `/practice/${attempt.id}`
    : `/attempts/${attempt.id}/report`;
}

export function getAttemptHistoryDate(attempt: AttemptHistoryRecord) {
  const date = attempt.status === 'draft'
    ? parseDate(attempt.updatedAt) || parseDate(attempt.createdAt)
    : parseDate(attempt.submittedAt) || parseDate(attempt.createdAt);

  if (!date) {
    return { label: 'Date', value: 'Date unavailable' };
  }

  const label = attempt.status === 'draft'
    ? parseDate(attempt.updatedAt) ? 'Last saved' : 'Created'
    : parseDate(attempt.submittedAt) ? 'Submitted' : 'Created';
  return {
    label,
    value: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date),
  };
}

function parseDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
