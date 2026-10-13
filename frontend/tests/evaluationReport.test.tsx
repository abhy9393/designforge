import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EvaluationReportError } from '../src/pages/EvaluationReportPage';

describe('evaluation report error state', () => {
  it('shows the API failure and a path back to history instead of a report', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <EvaluationReportError message="Evaluation not found." />
      </MemoryRouter>,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Evaluation not found.');
    expect(markup).toContain('Back to attempt history');
    expect(markup).not.toContain('Overall score');
  });
});
