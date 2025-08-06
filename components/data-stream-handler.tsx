'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { artifactDefinitions, type ArtifactKind } from './artifact';
import type { Suggestion } from '@/lib/db/schema';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';

export type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'sheet-delta'
    | 'image-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'kind'
    | 'student-privacy-protection'
    | 'status-update'
    | 'status-clear';
  content:
    | string
    | Suggestion
    | {
        fileName: string;
        status: 'clean' | 'redacted' | 'pii-preserved';
        message: string;
        details: string;
      }
    | {
        message: string;
        stage: 'initializing' | 'context-loading' | 'generating';
        timestamp: number;
      }
    | {
        message: string;
        timestamp: number;
      };
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      // Handle status updates for immediate feedback
      if (delta.type === 'status-update') {
        const statusData = delta.content as {
          message: string;
          stage: 'initializing' | 'context-loading' | 'generating';
          timestamp: number;
        };

        // Show subtle loading toast for immediate feedback
        toast.loading(statusData.message, {
          id: 'processing-status',
          description:
            statusData.stage === 'context-loading'
              ? 'Gathering context from your knowledge base...'
              : undefined,
        });
        return;
      }

      // Handle status clear
      if (delta.type === 'status-clear') {
        // Dismiss the loading toast as we start generating
        toast.dismiss('processing-status');
        return;
      }

      // Handle student privacy protection updates
      if (delta.type === 'student-privacy-protection') {
        const privacyData = delta.content as {
          fileName: string;
          status: 'clean' | 'redacted' | 'pii-preserved';
          message: string;
          details: string;
        };

        if (privacyData.status === 'clean') {
          toast.success(privacyData.message, {
            description: 'File processed safely without privacy concerns',
          });
        } else if (privacyData.status === 'redacted') {
          toast.info(privacyData.message, {
            description: privacyData.details,
          });
        } else if (privacyData.status === 'pii-preserved') {
          toast.warning(privacyData.message, {
            description:
              'File contains student info but was preserved due to file type. Please review responses carefully.',
          });
        }
        return; // Don't process further for privacy protection updates
      }

      const artifactDefinition = artifactDefinitions.find(
        (artifactDefinition) => artifactDefinition.kind === artifact.kind,
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'id':
            return {
              ...draftArtifact,
              documentId: delta.content as string,
              status: 'streaming',
            };

          case 'title':
            return {
              ...draftArtifact,
              title: delta.content as string,
              status: 'streaming',
            };

          case 'kind':
            return {
              ...draftArtifact,
              kind: delta.content as ArtifactKind,
              status: 'streaming',
            };

          case 'clear':
            return {
              ...draftArtifact,
              content: '',
              status: 'streaming',
            };

          case 'finish':
            return {
              ...draftArtifact,
              status: 'idle',
            };

          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return null;
}
