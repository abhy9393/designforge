import { ArrowRight, Blocks, CheckCheck, Database, Layers3, PencilRuler, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const challengeCards = [
  { title: 'Parking Lot System', difficulty: 'Intermediate' },
  { title: 'Elevator System', difficulty: 'Advanced' },
  { title: 'Vending Machine System', difficulty: 'Beginner' },
];

export default function LandingPage() {
  return (
    <div className="bg-[#07111f] text-slate-100">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> Think in systems. Design with intent.
            </div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.06em] text-white md:text-6xl">
              Learn low-level design with real engineering judgment.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              DesignForge gives you structured LLD practice with challenge-driven diagrams, review criteria, and persistent attempts for serious software design work.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400">
                Start Practicing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/problems" className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-200 hover:border-violet-500/50 hover:text-violet-200">
                Explore Challenges
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-2xl shadow-violet-950/30">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Architecture</div>
                <div className="mt-2 text-lg font-semibold text-white">Class blueprint</div>
              </div>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">Live model</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-2 flex items-center gap-2 text-violet-300"><Blocks className="h-4 w-4" /> Vehicle</div>
                <div className="text-slate-400">entry, parking state, expiry</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-2 flex items-center gap-2 text-violet-300"><Layers3 className="h-4 w-4" /> ParkingLot</div>
                <div className="text-slate-400">slot assignment and gate flow</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-2 flex items-center gap-2 text-violet-300"><Database className="h-4 w-4" /> Ticket</div>
                <div className="text-slate-400">issued, validated, and charged</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-2 flex items-center gap-2 text-violet-300"><PencilRuler className="h-4 w-4" /> Billing</div>
                <div className="text-slate-400">pricing and slot release path</div>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-slate-800 bg-[#0c1b2d] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300"> <CheckCheck className="h-4 w-4 text-emerald-400" /> Validated design flow</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-400">
                <div className="rounded-lg bg-slate-900 py-2">Classes</div>
                <div className="rounded-lg bg-violet-500/10 py-2 text-violet-200">Relations</div>
                <div className="rounded-lg bg-slate-900 py-2">Feedback</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Practice workflow</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Sketch the design, justify the model, and improve the trade-offs.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[{title:'Frame the system', text:'Read the problem statement and identify boundaries, actors, and responsibilities.'},{title:'Define the model', text:'Add classes, interfaces, methods, attributes, and relationships in a structured workspace.'},{title:'Review the feedback', text:'Use deterministic evaluation rules and clear suggestions to improve design quality.'}].map((item) => (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6" key={item.title}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">{item.title.split(' ')[0].slice(0,1)}</div>
              <h3 className="text-xl font-medium text-white">{item.title}</h3>
              <p className="mt-3 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Sample LLD challenges</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {challengeCards.map((challenge) => (
            <div key={challenge.title} className="rounded-2xl border border-slate-800 bg-[#091827] p-5">
              <div className="mb-4 inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">{challenge.difficulty}</div>
              <h3 className="text-xl font-medium text-white">{challenge.title}</h3>
              <p className="mt-3 text-slate-300">Focused on responsibilities, abstraction, and domain boundaries.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
