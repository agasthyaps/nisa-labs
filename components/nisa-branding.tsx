import Link from 'next/link';

export function NisaBranding() {
  return (
    <div className="absolute top-8 right-8 z-50">
      <Link
        href="https://nisa.coach"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xl font-semibold text-gray-800 dark:text-zinc-200 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
      >
        nisa labs
      </Link>
    </div>
  );
}
