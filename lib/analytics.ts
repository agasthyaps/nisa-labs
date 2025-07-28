import { usePostHog } from '@/hooks/use-posthog';

// Common analytics events for the AI chatbot
export const AnalyticsEvents = {
  // Authentication events
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  USER_REGISTERED: 'user_registered',
  GUEST_SESSION_STARTED: 'guest_session_started',

  // Chat events
  CHAT_STARTED: 'chat_started',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  CHAT_ENDED: 'chat_ended',

  // AI Model events
  MODEL_SELECTED: 'model_selected',
  MODEL_SWITCHED: 'model_switched',

  // Tool/Feature usage
  TOOL_USED: 'tool_used',
  ARTIFACT_CREATED: 'artifact_created',
  ARTIFACT_MODIFIED: 'artifact_modified',
  DOCUMENT_UPLOADED: 'document_uploaded',
  IMAGE_UPLOADED: 'image_uploaded',

  // Settings and preferences
  THEME_CHANGED: 'theme_changed',
  SETTINGS_UPDATED: 'settings_updated',

  // Performance events
  PAGE_LOAD_TIME: 'page_load_time',
  API_RESPONSE_TIME: 'api_response_time',

  // Error events
  API_ERROR: 'api_error',
  CHAT_ERROR: 'chat_error',
  UPLOAD_ERROR: 'upload_error',
} as const;

// Helper functions for common tracking scenarios
export function trackChatEvent(
  event: string,
  properties?: Record<string, any>,
) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event, {
      ...properties,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    });
  }
}

export function trackUserAction(
  action: string,
  properties?: Record<string, any>,
) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(action, {
      ...properties,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      page: window.location.pathname,
    });
  }
}

export function trackPerformance(
  metric: string,
  value: number,
  properties?: Record<string, any>,
) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(metric, {
      ...properties,
      value,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    });
  }
}

export function trackError(error: Error, context?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.captureException(error, {
      ...context,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      user_agent: navigator.userAgent,
    });
  }
}

// Hook for easy usage in components
export function useAnalytics() {
  const posthog = usePostHog();

  return {
    trackChatEvent,
    trackUserAction,
    trackPerformance,
    trackError,
    ...posthog,
  };
}
