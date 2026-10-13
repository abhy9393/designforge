import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-violet-950/20 lg:grid-cols-2">
        <div className="hidden bg-[#091827] p-10 lg:block">
          <div className="mb-8 text-sm uppercase tracking-[0.2em] text-violet-300">DesignForge</div>
          <h1 className="text-4xl font-semibold text-white">Build better systems.</h1>
          <p className="mt-4 text-slate-300">Practice architecture thinking with real constraints, clear feedback, and a structured workflow.</p>
          <div className="mt-10 space-y-4 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">Write strong class boundaries</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">Validate object relationships</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">Review thoughtful trade-offs</div>
          </div>
        </div>
        <div className="p-8 sm:p-10">
          <h2 className="text-3xl font-semibold text-white">Welcome back</h2>
          <p className="mt-2 text-slate-400">Sign in to continue your practice track.</p>
          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 focus-within:border-violet-400">
                <Mail className="h-4 w-4 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-white outline-none" placeholder="name@example.com" required />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 focus-within:border-violet-400">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-white outline-none" placeholder="••••••••" required />
              </div>
            </label>
            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <div className="mt-6 text-sm text-slate-400">
            Need an account? <Link to="/register" className="text-violet-300">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
