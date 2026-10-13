import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateRegistrationName } from '../lib/profileValidation';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const nameError = validateRegistrationName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-violet-950/20 lg:grid-cols-2">
        <div className="p-8 sm:p-10">
          <h2 className="text-3xl font-semibold text-white">Create your account</h2>
          <p className="mt-2 text-slate-400">Start solving low-level design problems with structure and context.</p>
          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Name</span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 focus-within:border-violet-400">
                <UserRound className="h-4 w-4 text-slate-400" />
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-white outline-none" placeholder="Alex Morgan" required aria-invalid={Boolean(error && validateRegistrationName(name))} aria-describedby={error && validateRegistrationName(name) ? 'registration-name-error' : undefined} />
              </div>
            </label>
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
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-white outline-none" placeholder="At least 8 characters" required />
              </div>
            </label>
            {error && <div id={validateRegistrationName(name) ? 'registration-name-error' : undefined} role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <div className="mt-6 text-sm text-slate-400">
            Already have an account? <Link to="/login" className="text-violet-300">Sign in</Link>
          </div>
        </div>
        <div className="hidden bg-[#091827] p-10 lg:block">
          <div className="text-sm uppercase tracking-[0.2em] text-violet-300">Why join</div>
          <h3 className="mt-6 text-2xl font-semibold text-white">Practice with intent.</h3>
          <div className="mt-8 space-y-4 text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">Review your design against domain requirements.</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">Keep every submission and evaluation history in one place.</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">Improve by iterating on the same problem in a structured flow.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
