import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PencilRuler } from 'lucide-react';
import { api } from '../lib/api';
import type { Problem } from '../types';

export default function ProblemDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get(`/problems/${slug}`);
      setProblem(data.problem);
    };
    void load();
  }, [slug]);

  const startAttempt = async () => {
    const { data } = await api.post('/attempts', { slug });
    navigate(`/practice/${data.attempt.id}`);
  };

  if (!problem) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-slate-300">Loading challenge…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link to="/problems" className="text-violet-300">← Back to problems</Link>
        <button onClick={startAttempt} className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-3 text-white hover:bg-violet-400">
          <PencilRuler className="h-4 w-4" /> Start attempt
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-[#091827] p-6">
          <div className="inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">{problem.difficulty}</div>
          <h1 className="mt-4 text-4xl font-semibold text-white">{problem.title}</h1>
          <p className="mt-4 text-slate-300">{problem.description}</p>

          <div className="mt-8 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-white">Requirements</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                {problem.requirements.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">Evaluation criteria</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                {problem.evaluationCriteria.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#091827] p-6">
            <h2 className="text-lg font-semibold text-white">Design notes</h2>
            <div className="mt-4 space-y-3 text-slate-300">
              <div>Context: {problem.context}</div>
              <div>Important concepts: {problem.requiredConcepts.join(', ')}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#091827] p-6">
            <h2 className="text-lg font-semibold text-white">Expected submission guidance</h2>
            <p className="mt-3 text-slate-300">Your attempt should include clear domain classes, responsibilities, attributes, methods, and relationships. Include notes on design trade-offs and key assumptions so the evaluator can assess intent.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
