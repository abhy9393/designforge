import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-violet-300">404</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">This page is not part of the system.</h1>
      <Link to="/" className="mt-6 inline-flex rounded-full bg-violet-500 px-5 py-3 text-white">Return home</Link>
    </div>
  );
}
