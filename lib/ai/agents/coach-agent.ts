import { Agent } from '@mastra/core/agent';
import { myProvider } from '../providers';
import { coachMemory } from '../memory/coach-memory';
import { getWeather } from '../tools/get-weather';
import { createDocument } from '../tools/create-document';
import { updateDocument } from '../tools/update-document';
import { requestSuggestions } from '../tools/request-suggestions';
import {
  readGoogleSheet,
  writeGoogleSheet,
  addNewDecisionLog,
  readDecisionLog,
} from '../tools/google-sheets';
import { systemPrompt, type RequestHints } from '../prompts';
import type { Session } from 'next-auth';
import type { DataStreamWriter } from 'ai';

interface AgentToolContext {
  session: Session;
  dataStream: DataStreamWriter;
}

export function createCoachAgent(
  modelId: string,
  requestHints: RequestHints,
  toolContext: AgentToolContext,
) {
  const { session, dataStream } = toolContext;

  return new Agent({
    name: 'CoachAssistant',
    model: myProvider.languageModel(modelId),
    instructions: systemPrompt({ selectedChatModel: modelId, requestHints }),
    memory: coachMemory,
    tools: {
      getWeather,
      createDocument: createDocument({ session, dataStream }),
      updateDocument: updateDocument({ session, dataStream }),
      requestSuggestions: requestSuggestions({ session, dataStream }),
      readGoogleSheet: readGoogleSheet({ session }),
      writeGoogleSheet: writeGoogleSheet({ session }),
      addNewDecisionLog: addNewDecisionLog({ session }),
      readDecisionLog: readDecisionLog({ session }),
    },
  });
}
