import { Link } from 'react-router-dom';

export function HouseBack({ size = 20 }) {
  return (
    <Link
      to="/"
      aria-label="Volver a inicio"
      className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-brand-c3 text-brand-c4 shadow hover:bg-white transition-colors"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10l9-7 9 7" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10v10h14V10" />
        <rect x="10" y="13" width="4" height="4" rx="1" fill="currentColor" />
      </svg>
    </Link>
  );
}
