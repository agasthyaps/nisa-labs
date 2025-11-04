export const CONVERSATION_MODES = ['default', 'onboarding'] as const;
export type ConversationMode = (typeof CONVERSATION_MODES)[number];

export const ONBOARDING_TRIGGER_PREFIX =
  'Start our conversation in onboarding mode';

export const isOnboardingStarter = (text: string) =>
  text.startsWith(ONBOARDING_TRIGGER_PREFIX);
