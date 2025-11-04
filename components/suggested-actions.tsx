'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import {
  type ConversationMode,
  ONBOARDING_TRIGGER_PREFIX,
} from '@/lib/chat/conversation-mode';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
  onConversationModeChange: (mode: ConversationMode) => void;
}

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
  onConversationModeChange,
}: SuggestedActionsProps) {
  const suggestedActions: Array<{
    title: string;
    label: string;
    action: string;
    mode: ConversationMode;
  }> = [
    {
      title: 'Uncover insights',
      label: "about a trend I haven't noticed",
      action:
        'Use your expertise and the tools available to you to uncover insights or surface something interesting or useful that I might not have noticed myself.',
      mode: 'default',
    },
    {
      title: 'Help me plan a debrief',
      label: `for a teacher.`,
      action: `Help me plan a debrief for a teacher based on what you know about them.`,
      mode: 'default',
    },
    {
      title: 'Write a follow-up email',
      label: `to a teacher based on our last conversation.`,
      action: `Write a follow-up email to a teacher based on our last conversation.`,
      mode: 'default',
    },
    {
      title: 'Mock onboarding',
      label: 'to practice the walkthrough.',
      action: `${ONBOARDING_TRIGGER_PREFIX}. Kick things off by welcoming me and outlining the mock onboarding flow you will guide me through.`,
      mode: 'onboarding',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);
              onConversationModeChange(suggestedAction.mode);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
