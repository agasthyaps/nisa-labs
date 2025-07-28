'use client';

export function usePostHog() {
  const captureEvent = (
    eventName: string,
    properties?: Record<string, any>,
  ) => {
    try {
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture(eventName, properties);
        console.log('PostHog event captured:', eventName, properties);
      } else {
        console.warn('PostHog not available, event not captured:', eventName);
      }
    } catch (error) {
      console.warn('Failed to capture PostHog event:', error);
    }
  };

  const setUserProperty = (property: string, value: any) => {
    try {
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.people.set({ [property]: value });
        console.log('PostHog user property set:', property, value);
      } else {
        console.warn('PostHog not available, property not set:', property);
      }
    } catch (error) {
      console.warn('Failed to set PostHog user property:', error);
    }
  };

  const captureException = (error: Error, properties?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.captureException(error, properties);
        console.log('PostHog exception captured:', error.message);
      } else {
        console.warn(
          'PostHog not available, exception not captured:',
          error.message,
        );
      }
    } catch (captureError) {
      console.warn('Failed to capture PostHog exception:', captureError);
    }
  };

  const identify = (userId: string, properties?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.identify(userId, properties);
        console.log('PostHog user identified:', userId, properties);
      } else {
        console.warn('PostHog not available, user not identified:', userId);
      }
    } catch (error) {
      console.warn('Failed to identify user in PostHog:', error);
    }
  };

  const isFeatureEnabled = (flag: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.posthog) {
        return window.posthog.isFeatureEnabled(flag);
      }
      return false;
    } catch (error) {
      console.warn('Failed to check PostHog feature flag:', error);
      return false;
    }
  };

  return {
    captureEvent,
    setUserProperty,
    captureException,
    identify,
    isFeatureEnabled,
  };
}
