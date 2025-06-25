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
              Welcome to Nisa
            </h1>
            <p className="text-lg text-gray-600 dark:text-zinc-400">
              Your AI coaching companion
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-4 pt-8">
            <Link
              href="/api/auth/guest"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">Try as Guest</h3>
                <p className="text-blue-100 opacity-90">
                  Start chatting immediately without an account
                </p>
              </div>
            </Link>

            <Link
              href="/login"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 p-6 text-white transition-all duration-300 hover:from-gray-700 hover:to-gray-800 hover:shadow-lg"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">Sign In</h3>
                <p className="text-gray-100 opacity-90">
                  Access your account and save your conversations
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
