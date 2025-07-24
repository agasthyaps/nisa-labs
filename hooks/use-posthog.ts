'use client';

export function usePostHog() {
  const captureEvent = (
    eventName: string,
    properties?: Record<string, any>,
  ) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(eventName, properties);
    }
  };

  const setUserProperty = (property: string, value: any) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.people.set({ [property]: value });
    }
  };

  const captureException = (error: Error, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.captureException(error, properties);
    }
  };

  return {
    captureEvent,
    setUserProperty,
    captureException,
  };
}
