import { needsNameUpdate } from '../lib/profileValidation';

export function ProfileDetails({ name, email }: { name?: string; email?: string }) {
  const shouldUpdateName = needsNameUpdate(name);
  const displayedName = name?.trim() || 'Name unavailable';

  return (
    <>
      <h1 className="mt-2 text-3xl font-semibold text-white">{displayedName}</h1>
      {shouldUpdateName && (
        <p role="alert" className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          This account has a saved name containing numbers. Please contact support to update your name; no account details have been changed.
        </p>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-sm text-slate-400">Name</div>
          <div className="mt-2 text-lg text-white">{displayedName}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-sm text-slate-400">Email</div>
          <div className="mt-2 text-lg text-white">{email || 'Email unavailable'}</div>
        </div>
      </div>
    </>
  );
}
