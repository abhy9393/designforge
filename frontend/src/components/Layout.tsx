import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, Menu, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="border-b border-slate-800 bg-[#091827]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>DesignForge</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <NavLink to="/" className={({ isActive }) => isActive ? 'text-violet-300' : ''}>Home</NavLink>
            <NavLink to="/problems" className={({ isActive }) => isActive ? 'text-violet-300' : ''}>Problems</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'text-violet-300' : ''}>Dashboard</NavLink>
                <NavLink to="/history" className={({ isActive }) => isActive ? 'text-violet-300' : ''}>History</NavLink>
                <NavLink to="/profile" className={({ isActive }) => isActive ? 'text-violet-300' : ''}>Profile</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'text-violet-300' : ''}>Login</NavLink>
                <NavLink to="/register" className={({ isActive }) => isActive ? 'text-violet-300' : ''}>Register</NavLink>
              </>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400">
                Start Practicing
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg border border-slate-700" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-800 bg-[#091827] md:hidden">
            <div className="mx-auto max-w-7xl flex flex-col gap-3 px-4 py-3 text-sm text-slate-300">
              <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
              <NavLink to="/problems" onClick={() => setMenuOpen(false)}>Problems</NavLink>
              {user ? (
                <>
                  <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
                  <NavLink to="/history" onClick={() => setMenuOpen(false)}>History</NavLink>
                  <NavLink to="/profile" onClick={() => setMenuOpen(false)}>Profile</NavLink>
                  <button onClick={handleLogout} className="text-left">Logout</button>
                </>
              ) : (
                <>
                  <NavLink to="/login" onClick={() => setMenuOpen(false)}>Login</NavLink>
                  <NavLink to="/register" onClick={() => setMenuOpen(false)}>Register</NavLink>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
