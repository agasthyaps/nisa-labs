'use client';

import Link from 'next/link';
import { NisaBranding } from '@/components/nisa-branding';

export default function LandingPage() {
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <NisaBranding />
      <div className="w-full max-w-md px-6 text-center">
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-zinc-50">
              welcome to nisa labs
            </h1>
            <p className="text-lg text-gray-600 dark:text-zinc-400">
              experimental features for coaches
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-4 pt-8">
            <Link
              href="/api/auth/guest"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">
                  chat with an experimental version of nisa as guest
                </h3>
                <p className="text-blue-100 opacity-90">
                  start chatting immediately without an account
                </p>
              </div>
            </Link>

            <Link
              href="https://coaching-frontend-p2qg.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-600 to-green-700 p-6 text-white transition-all duration-300 hover:from-green-700 hover:to-green-800 hover:shadow-lg"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">
                  coaching turing test
                </h3>
                <p className="text-green-100 opacity-90">
                  see if you can tell which response came from a human coach and
                  which came from an LLM
                </p>
              </div>
            </Link>

            <Link
              href="/login"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 p-6 text-white transition-all duration-300 hover:from-gray-700 hover:to-gray-800 hover:shadow-lg"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">sign in</h3>
                <p className="text-gray-100 opacity-90">
                  access your account and save your conversations
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
