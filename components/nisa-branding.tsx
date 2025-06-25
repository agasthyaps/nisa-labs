import Link from 'next/link';

export function NisaBranding() {
  return (
    <div
      className="z-50
        md:absolute md:top-8 md:right-8
        fixed bottom-4 left-1/2 -translate-x-1/2
        md:bottom-auto md:left-auto md:translate-x-0
        pointer-events-auto"
    >
      <Link
        href="https://nisa.coach"
        target="_blank"
        rel="noopener noreferrer"
        className="text-base md:text-xl font-semibold text-gray-800 dark:text-zinc-200 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors bg-white/80 dark:bg-black/40 px-3 py-1 rounded-full shadow md:bg-transparent md:dark:bg-transparent"
      >
        nisa labs
      </Link>
    </div>
  );
}
