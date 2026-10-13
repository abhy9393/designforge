import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

type Evaluation = {
  summary?: string;
  overallScore?: number;
  categoryScores?: Record<string, number>;
  feedback?: {
    summary?: string;
    overall?: number;
    strengths?: string[];
    recommendations?: string[];
    criteria?: {
      name: string;
      status: string;
      severity?: string;
      explanation?: string;
      evidence?: string[];
      suggestion?: string;
    }[];
  };
};

export default function EvaluationReportPage() {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadReport = async () => {
      setLoading(true);
      setError('');
      setEvaluation(null);
      try {
        if (!id) throw new Error('Attempt ID is missing.');
        const { data } = await api.get(`/attempts/${id}/evaluation`);
        if (String(data.evaluation?.attemptId) !== String(id)) {
          throw new Error('The evaluation report does not match this attempt.');
        }
        if (active) setEvaluation(data.evaluation);
      } catch (requestError: any) {
        if (active) {
          setError(requestError.response?.data?.message || 'Unable to load this evaluation report.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadReport();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-slate-300">Loading evaluation report…</div>;
  }

  if (error || !evaluation) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <EvaluationReportError message={error || 'No saved evaluation report exists for this attempt.'} />
      </div>
    );
  }

  const feedback = evaluation.feedback || {};
  const score = evaluation.overallScore ?? feedback.overall;
  const criteria = feedback.criteria || [];
  const issues = criteria.filter((criterion) => criterion.status !== 'pass');
  const recommendations = feedback.recommendations || [];
  const categoryScores = evaluation.categoryScores || {};

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Saved evaluation report</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Attempt feedback</h1>
        </div>
        {typeof score === 'number' && (
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-5 py-3 text-right">
            <div className="text-sm text-violet-200">Overall score</div>
            <div className="text-3xl font-semibold text-white">{score}<span className="text-lg text-slate-400">/100</span></div>
          </div>
        )}
      </div>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-[#091827] p-6">
        <h2 className="text-lg font-semibold text-white">Summary</h2>
        <p className="mt-3 text-slate-300">{evaluation.summary || feedback.summary || 'No summary was included in this saved evaluation.'}</p>
      </section>

      {Object.keys(categoryScores).length > 0 && (
        <section className="mb-6 rounded-2xl border border-slate-800 bg-[#091827] p-6">
          <h2 className="text-lg font-semibold text-white">Progress by category</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(categoryScores).map(([category, value]) => (
              <div key={category} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex justify-between gap-3 text-sm text-slate-300">
                  <span className="capitalize">{category.replace(/([A-Z])/g, ' $1')}</span>
                  <span>{value}/100</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-violet-400" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-[#091827] p-6">
          <h2 className="text-lg font-semibold text-white">Strengths</h2>
          {feedback.strengths?.length ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
              {feedback.strengths.map((strength, index) => <li key={`${index}-${strength}`}>{strength}</li>)}
            </ul>
          ) : <p className="mt-3 text-slate-400">No strengths were included in this saved evaluation.</p>}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#091827] p-6">
          <h2 className="text-lg font-semibold text-white">Issues to address</h2>
          {issues.length ? (
            <ul className="mt-4 space-y-4">
              {issues.map((criterion, index) => (
                <li key={`${criterion.name}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                  <div className="font-medium text-white">{criterion.name} <span className="text-xs uppercase text-amber-300">{criterion.status}</span></div>
                  {criterion.explanation && <p className="mt-2 text-sm text-slate-300">{criterion.explanation}</p>}
                  {!!criterion.evidence?.length && <ul className="mt-2 list-disc pl-5 text-sm text-slate-400">{criterion.evidence.map((item, evidenceIndex) => <li key={`${evidenceIndex}-${item}`}>{item}</li>)}</ul>}
                  {criterion.suggestion && <p className="mt-2 text-sm text-violet-200">Suggestion: {criterion.suggestion}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-slate-400">No issues were reported.</p>}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-[#091827] p-6">
        <h2 className="text-lg font-semibold text-white">Actionable improvements</h2>
        {recommendations.length ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
            {recommendations.map((recommendation, index) => <li key={`${index}-${recommendation}`}>{recommendation}</li>)}
          </ul>
        ) : <p className="mt-3 text-slate-400">No additional recommendations were included.</p>}
      </section>

      <Link to="/history" className="mt-6 inline-block text-violet-300">Back to attempt history</Link>
    </div>
  );
}

export function EvaluationReportError({ message }: { message: string }) {
  return (
    <>
      <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
        {message}
      </div>
      <Link to="/history" className="mt-5 inline-block text-violet-300">Back to attempt history</Link>
    </>
  );
}
