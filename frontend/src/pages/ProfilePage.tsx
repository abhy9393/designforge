import { useAuth } from '../contexts/AuthContext';
import { ProfileDetails } from '../components/ProfileDetails';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-800 bg-[#091827] p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Profile</p>
        <ProfileDetails name={user?.name} email={user?.email} />
      </div>
    </div>
  );
}
