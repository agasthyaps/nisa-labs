'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

declare global {
  interface Window {
    posthog: any;
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.posthog && session?.user) {
      // Identify the user in PostHog
      window.posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session]);

  // Reset user on logout
  useEffect(() => {
    if (typeof window !== 'undefined' && window.posthog && !session) {
      window.posthog.reset();
    }
  }, [session]);

  return <>{children}</>;
}
