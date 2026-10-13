import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { api } from '../lib/api';
import { getAttemptHistoryDate, getAttemptOpenPath } from '../lib/attemptHistory';

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/attempts');
        if (active) setAttempts(data.attempts || []);
      } catch (requestError: any) {
        if (active) setError(requestError.response?.data?.message || 'Unable to load attempt history.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Attempt history</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Your previous submissions</h1>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-[#091827] p-6 text-slate-300">Loading attempt history…</div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">{error}</div>
      ) : attempts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-[#091827] p-10 text-center text-slate-400">No attempts yet. Start a challenge from the problem library.</div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const timestamp = getAttemptHistoryDate(attempt);
            return (
            <div key={attempt.id} className="rounded-2xl border border-slate-800 bg-[#091827] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><FileText className="h-5 w-5" /></div>
                  <div>
                    <div className="text-lg font-medium text-white">{attempt.problem?.title || 'LLD challenge'} · Attempt #{attempt.attemptNumber || 1}</div>
                    <div className="mt-1 break-all text-xs text-slate-500">ID: {attempt.id}</div>
                    {attempt.submittedToAttemptId && (
                      <div className="mt-1 break-all text-xs text-amber-200/80">
                        Previous submission · latest {attempt.submittedToAttemptId}
                      </div>
                    )}
                    <div className="mt-1 text-sm text-slate-400">
                      {timestamp.label}: {timestamp.value}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2 py-1 text-xs uppercase ${
                    attempt.status === 'draft'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                      : 'border-violet-500/30 bg-violet-500/10 text-violet-200'
                  }`}>
                    {attempt.status}
                  </span>
                  <Link
                    to={getAttemptOpenPath(attempt)}
                    className="text-violet-300"
                  >
                    {attempt.status === 'draft' ? 'Continue Editing' : 'Open'}
                  </Link>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
