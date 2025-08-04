'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: initialChatModel,
      selectedVisibilityType: visibilityType,
    }),
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      // Don't show error toast during initialization to avoid confusion
      if (error instanceof ChatSDKError && !isInitializing) {
        // Also check if it's a chat-related error that might be due to timing
        const isChatTimingError =
          error.message.includes('chat') ||
          error.message.includes('not found') ||
          error.message.includes('Failed to get');

        if (!isChatTimingError) {
          toast({
            type: 'error',
            description: error.message,
          });
        }
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationTimeout, setInitializationTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      setIsInitializing(true);

      // Small delay to ensure chat is properly initialized
      const timeout = setTimeout(() => {
        // Always append as user message - we'll filter in the UI
        append({
          role: 'user',
          content: query,
        });

        setHasAppendedQuery(true);
        window.history.replaceState({}, '', `/chat/${id}`);

        // Set a longer timeout to ensure initialization period covers the entire process
        const initTimeout = setTimeout(() => {
          setIsInitializing(false);
        }, 3000); // 3 seconds should be enough for the entire process

        setInitializationTimeout(initTimeout);
      }, 200);

      return () => {
        clearTimeout(timeout);
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
        }
      };
    }
  }, [query, append, hasAppendedQuery, id, initializationTimeout]);

  // Keep loading state active until we start receiving a response
  useEffect(() => {
    if (isInitializing && status === 'streaming') {
      // Clear the timeout since we're now streaming
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
        setInitializationTimeout(null);
      }
      setIsInitializing(false);
    }
  }, [isInitializing, status, initializationTimeout]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader chatId={id} isReadonly={isReadonly} session={session} />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          isInitializing={isInitializing}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              selectedVisibilityType={visibilityType}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
