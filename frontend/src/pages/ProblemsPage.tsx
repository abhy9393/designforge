import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import type { Problem } from '../types';

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/problems');
      setProblems(data.problems || []);
    };
    void load();
  }, []);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesText = `${problem.title} ${problem.description}`.toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty = difficulty === 'All' || problem.difficulty === difficulty;
      return matchesText && matchesDifficulty;
    });
  }, [problems, search, difficulty]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Problem library</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Choose a system to design.</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-white outline-none" placeholder="Search challenges" />
          </div>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none">
            <option value="All">All levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProblems.map((problem) => (
          <Link key={problem.id} to={`/problems/${problem.slug}`} className="rounded-2xl border border-slate-800 bg-[#091827] p-6 transition hover:border-violet-500/40">
            <div className="mb-4 inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">{problem.difficulty}</div>
            <h2 className="text-2xl font-semibold text-white">{problem.title}</h2>
            <p className="mt-3 text-slate-300">{problem.description}</p>
            <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
              <span>{problem.requirements.length} requirements</span>
              <span className="inline-flex items-center gap-1 text-violet-300"><Sparkles className="h-4 w-4" /> Open</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
