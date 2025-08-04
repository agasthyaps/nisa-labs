import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  isInitializing?: boolean;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  isInitializing = false,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {messages.length === 0 && !isInitializing && <Greeting />}

      {isInitializing && messages.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 dark:border-gray-400" />
            <span>Starting conversation...</span>
          </div>
        </div>
      )}

      {messages
        .filter((message) => {
          // Hide conversation starter messages to maintain the illusion that Nisa initiates
          if (message.role === 'user' && typeof message.content === 'string') {
            return !message.content.startsWith('Start our conversation');
          }
          return true;
        })
        .map((message, index, filteredMessages) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={
              status === 'streaming' && filteredMessages.length - 1 === index
            }
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            requiresScrollPadding={
              hasSentMessage && index === filteredMessages.length - 1
            }
          />
        ))}

      {(() => {
        const visibleMessages = messages.filter((message) => {
          if (message.role === 'user' && typeof message.content === 'string') {
            return !message.content.startsWith('Start our conversation');
          }
          return true;
        });

        if (
          status === 'submitted' &&
          visibleMessages.length > 0 &&
          visibleMessages[visibleMessages.length - 1]?.role === 'user'
        ) {
          return (
            <ThinkingMessage
              hasImages={
                visibleMessages[
                  visibleMessages.length - 1
                ].experimental_attachments?.some((attachment) =>
                  attachment.contentType?.startsWith('image/'),
                ) || false
              }
            />
          );
        }
        return null;
      })()}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
