import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChartColumn, FileClock, LibraryBig, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ totalAttempts: number; completedEvaluations: number } | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-activity'),
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data.activity || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Welcome back, {user?.name || 'Engineer'}.</h1>
        </div>
        <Link to="/problems" className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400">
          View library
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? <div className="text-slate-300">Loading dashboard…</div> : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <StatCard icon={<ChartColumn className="h-5 w-5" />} label="Total attempts" value={String(stats?.totalAttempts ?? 0)} />
            <StatCard icon={<FileClock className="h-5 w-5" />} label="Completed evaluations" value={String(stats?.completedEvaluations ?? 0)} />
            <StatCard icon={<Sparkles className="h-5 w-5" />} label="Available challenges" value="3" />
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-2xl border border-slate-800 bg-[#091827] p-6">
              <div className="mb-4 flex items-center gap-2 text-lg font-medium text-white"><LibraryBig className="h-5 w-5 text-violet-300" /> Recent activity</div>
              {activity.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No attempts yet. Begin with a new LLD challenge and build your first design draft.</div>
              ) : (
                <div className="space-y-3">
                  {activity.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                      <span>Attempt #{entry.attemptNumber || 1}</span>
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-xs uppercase">{entry.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#091827] p-6">
              <div className="mb-4 text-lg font-medium text-white">Continue practicing</div>
              <div className="space-y-3">
                <Link to="/problems/parking-lot-system" className="block rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-violet-500/40">Parking Lot System</Link>
                <Link to="/problems/elevator-system" className="block rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-violet-500/40">Elevator System</Link>
                <Link to="/problems/vending-machine-system" className="block rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-violet-500/40">Vending Machine System</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#091827] p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">{icon}</div>
      <div className="text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}
