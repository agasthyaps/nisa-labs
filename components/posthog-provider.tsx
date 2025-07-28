'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

declare global {
  interface Window {
    posthog: any;
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.posthog &&
      status === 'authenticated' &&
      session?.user
    ) {
      try {
        const userProperties: Record<string, any> = {
          user_type: session.user.type || 'unknown',
        };

        // Only add email and name for regular users, not guests
        if (session.user.type === 'regular') {
          if (session.user.email) userProperties.email = session.user.email;
          if (session.user.name) userProperties.name = session.user.name;
        }

        // Identify the user in PostHog
        window.posthog.identify(session.user.id, userProperties);

        // Set user properties
        window.posthog.people.set(userProperties);

        console.log(
          'PostHog user identified:',
          session.user.id,
          userProperties,
        );
      } catch (error) {
        console.warn('Failed to identify user in PostHog:', error);
      }
    }
  }, [session, status]);

  // Reset user on logout
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.posthog &&
      status === 'unauthenticated'
    ) {
      try {
        window.posthog.reset();
        console.log('PostHog user reset');
      } catch (error) {
        console.warn('Failed to reset PostHog user:', error);
      }
    }
  }, [status]);

  return <>{children}</>;
}
