'use client';

import { useEffect, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Messages } from '@/components/messages';
import { Input as UIInput } from '@/components/ui/input';
import { Button as UIButton } from '@/components/ui/button';
import { Card as UICard } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
// Clean up alias imports only
import {
  MINI_NISA_ASSET_CSV_PATH,
  MINI_NISA_ASSET_IMAGE_PATH,
  MINI_NISA_MAX_TOKENS_CSV,
  MINI_NISA_MAX_TOKENS_GENERAL,
  MINI_NISA_MAX_TOKENS_IMAGE,
} from '@/lib/constants';

type Mode = 'general' | 'csv' | 'image';

export default function MiniNisaEmbedPage() {
  const generateId = () =>
    globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const [isIframe, setIsIframe] = useState(false);
  const [mode, setMode] = useState<Mode>('general');
  const [conversationIds] = useState({
    general: generateId(),
    csv: generateId(),
    image: generateId(),
  });
  const [remaining, setRemaining] = useState({
    general: MINI_NISA_MAX_TOKENS_GENERAL,
    csv: MINI_NISA_MAX_TOKENS_CSV,
    image: MINI_NISA_MAX_TOKENS_IMAGE,
  });

  useEffect(() => {
    setIsIframe(typeof window !== 'undefined' && window.top !== window.self);
  }, []);

  useEffect(() => {
    // reset messages on tab switch
    setMessages([]);
    setInput('');
  }, [mode]);

  const conversationId = useMemo(
    () => conversationIds[mode],
    [conversationIds, mode],
  );
  const tokenCap = useMemo(() => {
    if (mode === 'csv') return MINI_NISA_MAX_TOKENS_CSV;
    if (mode === 'image') return MINI_NISA_MAX_TOKENS_IMAGE;
    return MINI_NISA_MAX_TOKENS_GENERAL;
  }, [mode]);

  const placeholder =
    mode === 'csv'
      ? 'Ask questions about this dataset'
      : mode === 'image'
        ? 'Tell me about these notes'
        : 'Ask me anything';

  const {
    messages,
    setMessages,
    handleSubmit,
    status,
    stop,
    reload,
    append,
    input,
    setInput,
    data,
  } = useChat({
    id: conversationId,
    api: '/api/mini-nisa/chat',
    sendExtraMessageFields: true,
    generateId: generateId,
    experimental_prepareRequestBody: (body) => ({
      conversationId,
      mode,
      messages: body.messages,
    }),
  });

  // Update token counter from streaming data
  useEffect(() => {
    if (data && Array.isArray(data)) {
      const tokenEvents = data.filter((d: any) => d.type === 'token-usage');
      const latest = tokenEvents[tokenEvents.length - 1];
      if (latest && latest.content.mode === mode) {
        setRemaining((prev) => ({
          ...prev,
          [mode]: latest.content.remaining,
        }));
      }
    }
  }, [data, mode]);

  if (!isIframe) {
    return (
      <div className="p-4 text-sm">This widget is intended to be embedded.</div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-full flex-col">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-2 text-sm bg-white">
          <Tab
            label="CSV"
            active={mode === 'csv'}
            onClick={() => setMode('csv')}
          />
          <Tab
            label="Notes Image"
            active={mode === 'image'}
            onClick={() => setMode('image')}
          />
          <Tab
            label="General"
            active={mode === 'general'}
            onClick={() => setMode('general')}
          />
          <div className="ml-auto text-xs text-muted-foreground">
            Tokens remaining: {remaining[mode]}/{tokenCap}
          </div>
        </div>

        {(mode === 'csv' || mode === 'image') && (
          <div className="border-b px-3 py-2 text-xs">
            {mode === 'csv' ? (
              <div>
                <div className="mb-1 font-medium">Dataset preview</div>
                <UICard className="rounded border p-2">
                  <div className="mb-1">
                    CSV attached: {MINI_NISA_ASSET_CSV_PATH}
                  </div>
                  <CsvPreview path={MINI_NISA_ASSET_CSV_PATH} />
                </UICard>
              </div>
            ) : (
              <div>
                <div className="mb-1 font-medium">
                  Observation notes (image)
                </div>
                <UICard className="rounded border p-2">
                  <div className="mb-2">Image attached:</div>
                  <img
                    src={MINI_NISA_ASSET_IMAGE_PATH}
                    alt="Observation notes"
                    className="max-h-40 w-auto rounded border"
                  />
                </UICard>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto p-3">
          <Messages
            chatId={conversationId}
            status={status}
            votes={undefined}
            messages={messages as any}
            setMessages={setMessages as any}
            reload={reload}
            isReadonly={false}
            isArtifactVisible={false}
          />
        </div>

        <form
          className="sticky bottom-0 z-10 flex gap-2 border-t p-3 bg-white"
          onSubmit={(e) => {
            e.preventDefault();
            const extra: any = {};
            const isFirst = messages.length === 0;
            if (isFirst && mode === 'csv') {
              extra.experimental_attachments = [
                {
                  url: MINI_NISA_ASSET_CSV_PATH,
                  name: 'sample.csv',
                  contentType: 'text/csv',
                },
              ];
            } else if (isFirst && mode === 'image') {
              extra.experimental_attachments = [
                {
                  url: MINI_NISA_ASSET_IMAGE_PATH,
                  name: 'observation-notes.png',
                  contentType: 'image/png',
                },
              ];
            }
            handleSubmit(undefined, extra);
          }}
        >
          <UIInput
            name="input"
            className="flex-1"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status === 'streaming'}
          />
          <UIButton disabled={status === 'streaming'} type="submit" size="sm">
            Send
          </UIButton>
        </form>
      </div>
    </TooltipProvider>
  );
}

function Tab({
  label,
  active,
  onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`${'rounded px-3 py-1 '} ${
        active
          ? 'bg-black text-white'
          : 'bg-transparent text-black hover:bg-gray-100'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function CsvPreview({ path }: { path: string }) {
  const [text, setText] = useState<string>('');
  useEffect(() => {
    let isMounted = true;
    fetch(path)
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => {
        if (!isMounted) return;
        const lines = t.split('\n').slice(0, 6).join('\n');
        setText(lines);
      })
      .catch(() => setText(''));
    return () => {
      isMounted = false;
    };
  }, [path]);
  if (!text) return null;
  return (
    <pre className="max-h-40 overflow-auto rounded bg-gray-50 p-2 text-[10px] leading-tight">
      {text}
      {text.split('\n').length >= 6 ? '\n...' : ''}
    </pre>
  );
}
