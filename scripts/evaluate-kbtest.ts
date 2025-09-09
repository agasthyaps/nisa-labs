#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { Langfuse } from 'langfuse';
import { streamText } from 'ai';
import { myProvider } from '../lib/ai/providers';
import { readFileSync } from 'node:fs';

// Import tools that don't have server-only dependencies
// import { getWeather } from '../lib/ai/tools/get-weather'; // Causing import issues
import { tool } from 'ai';
import { z } from 'zod';

// Mock tools that have server-only dependencies
const createMockTool = (name: string, description: string) =>
  tool({
    description: `[MOCK] ${description}`,
    parameters: z.object({
      input: z.any().optional(),
    }),
    execute: async () => {
      // Removed console.log to avoid double logging with real tools
      return {
        message: `Mock response from ${name}`,
        mockTool: true,
      };
    },
  });

// Create mock versions of tools that would cause server-only errors
const getWeather = createMockTool('getWeather', 'Get weather information');
const createDocument = createMockTool('createDocument', 'Create a document');
const updateDocument = createMockTool('updateDocument', 'Update a document');
const requestSuggestions = createMockTool(
  'requestSuggestions',
  'Request suggestions',
);
const readGoogleSheet = createMockTool('readGoogleSheet', 'Read Google Sheet');
const writeGoogleSheet = createMockTool(
  'writeGoogleSheet',
  'Write to Google Sheet',
);
const addNewDecisionLog = createMockTool(
  'addNewDecisionLog',
  'Add decision log entry',
);
const readDecisionLog = createMockTool('readDecisionLog', 'Read decision log');
const listKnowledgeBaseFiles = createMockTool(
  'listKnowledgeBaseFiles',
  'List KB files',
);
const readKnowledgeBaseFile = createMockTool(
  'readKnowledgeBaseFile',
  'Read KB file',
);
const reviewNotes = createMockTool('reviewNotes', 'Review notes');
const updateNotes = createMockTool('updateNotes', 'Update notes');
const getExpertiseTree = createMockTool(
  'getExpertiseTree',
  'Get expertise tree',
);
const listExpertiseFiles = createMockTool(
  'listExpertiseFiles',
  'List expertise files',
);
const readExpertiseFile = createMockTool(
  'readExpertiseFile',
  'Read expertise file',
);
const searchExpertiseContent = createMockTool(
  'searchExpertiseContent',
  'Search expertise',
);
const getExpertiseOverview = createMockTool(
  'getExpertiseOverview',
  'Get expertise overview',
);

// Mock session for evaluation metadata
const mockSession = {
  user: {
    id: 'eval-user-123',
    email: 'eval@test.com',
    name: 'Evaluation User',
    type: 'coach' as const,
  },
};

interface KBTestItem {
  input: {
    ability: number;
    context: string;
    topic_hint: string[];
    constraints: string[];
    allowed_time: string;
    user_request: string;
  };
  expectedOutput: {
    'expected_output.kb_expectation': 'SHOULD_CALL' | 'MUST_NOT' | 'FLEXIBLE';
    'expected_output.expected_tools'?: string;
    'expected_output.expected_topics'?: string;
    'expected_output.forbidden_behaviors'?: string;
  };
  metadata?: any;
}

// Ability-based KB expectations from system prompt
const ABILITY_KB_EXPECTATIONS = {
  1: 'FLEXIBLE', // Review/update logs
  2: 'MUST_CALL', // Draft debrief emails [USE EXPERTISE]
  3: 'MUST_CALL', // Synthesizing notes through frameworks [USE EXPERTISE]
  4: 'MUST_CALL', // Suggest next steps for teachers [USE EXPERTISE]
  5: 'MUST_CALL', // Plan data analysis sessions [USE EXPERTISE]
  6: 'FLEXIBLE', // Collaborative help
  7: 'FLEXIBLE', // Planning coaching conversations
} as const;

async function runMyLLMApplication(input: any): Promise<[any, any]> {
  // Extract ability and user_request from the input structure
  const ability = input.ability || input.input?.ability;
  const userRequest =
    input.user_request || input.input?.user_request || input.input;

  console.log(
    `\n🎯 Processing ability ${ability}: ${typeof userRequest === 'string' ? userRequest.slice(0, 80) : JSON.stringify(userRequest).slice(0, 80)}...`,
  );
  console.log('⚠️  Using mock tools to avoid server-only imports');

  const langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY || '',
    publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
    baseUrl: process.env.LANGFUSE_HOST || 'https://us.cloud.langfuse.com',
  });

  // Create a trace for this evaluation
  const trace = langfuse.trace({
    name: 'kb-test-evaluation',
    input: input,
    metadata: {
      ability: ability,
      evaluation: true,
      timestamp: new Date().toISOString(),
    },
  });

  try {
    // Load the hardcoded system prompt from promptforevals.md
    const systemPromptContent = readFileSync(
      resolve(process.cwd(), 'promptforevals.md'),
      'utf-8',
    );

    console.log(
      `📝 System prompt length: ${systemPromptContent.length} characters`,
    );

    // Prepare tools - using mock tools to avoid server-only imports
    const tools = {
      getWeather,
      createDocument,
      updateDocument,
      requestSuggestions,
      readGoogleSheet,
      writeGoogleSheet,
      addNewDecisionLog,
      readDecisionLog,
      listKnowledgeBaseFiles,
      readKnowledgeBaseFile,
      reviewNotes,
      updateNotes,
      getExpertiseTree,
      listExpertiseFiles,
      readExpertiseFile,
      searchExpertiseContent,
      getExpertiseOverview,
    };

    // Track tool usage
    const toolCalls: Array<{
      name: string;
      timestamp: number;
      input?: any;
      output?: any;
    }> = [];
    let finalMessage = '';
    const startTime = Date.now();
    let firstToolTime: number | null = null;

    // Run the actual streamText call - exactly like your chat route
    const result = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: systemPromptContent,
      messages: [
        {
          role: 'user',
          content:
            typeof userRequest === 'string'
              ? userRequest
              : JSON.stringify(userRequest),
        },
      ],
      maxSteps: 5,
      tools,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'kb-test-evaluation',
        metadata: {
          sessionId: trace.id,
          userId: mockSession.user.id,
          ability: ability,
          evaluation: true,
          promptSource: 'hardcoded-promptforevals.md',
        },
      },
    });

    // Process the stream
    for await (const delta of result.fullStream) {
      if (delta.type === 'text-delta') {
        finalMessage += delta.textDelta;
      } else if (delta.type === 'tool-call') {
        const toolCallTime = Date.now();
        if (firstToolTime === null) {
          firstToolTime = toolCallTime;
        }
        toolCalls.push({
          name: delta.toolName,
          timestamp: toolCallTime,
          input: delta.args,
        });
        console.log(`🔧 Tool called: ${delta.toolName}`);
      } else if (delta.type === 'tool-result') {
        // Find the corresponding tool call and add the result
        const lastToolCall = toolCalls[toolCalls.length - 1];
        if (lastToolCall && !lastToolCall.output) {
          lastToolCall.output = delta.result;
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log(
      `🔧 Tools used: ${toolCalls.map((tc) => tc.name).join(', ') || 'None'}`,
    );
    console.log(`💬 Response length: ${finalMessage.length} characters`);

    // Update trace with final results
    trace.update({
      output: {
        message: finalMessage,
        toolCalls: toolCalls.map((tc) => tc.name),
        totalLatency: totalTime,
        firstToolLatency: firstToolTime ? firstToolTime - startTime : null,
      },
    });

    const output = {
      message: finalMessage,
      toolCalls,
      totalLatency: totalTime,
      firstToolLatency: firstToolTime ? firstToolTime - startTime : null,
    };

    return [trace, output];
  } catch (error) {
    console.error('❌ Error in LLM application:', error);
    trace.update({
      output: { error: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}

// Evaluation functions
function calculateProgrammaticScores(item: KBTestItem, output: any) {
  const scores: Record<string, { value: number; comment: string }> = {};

  // Extract ability from input structure
  const ability = item.input?.ability || item.input;
  const expectedKBUsage =
    ABILITY_KB_EXPECTATIONS[ability as keyof typeof ABILITY_KB_EXPECTATIONS];
  const actuallyCalledKB = output.toolCalls.length > 0;
  const kbToolNames = [
    'listKnowledgeBaseFiles',
    'readKnowledgeBaseFile',
    'listExpertiseFiles',
    'readExpertiseFile',
    'searchExpertiseContent',
    'getExpertiseOverview',
  ];

  console.log(`🔍 Evaluating ability ${ability} (${expectedKBUsage})`);
  console.log(
    `📊 Tool calls made: ${output.toolCalls.map((tc: any) => tc.name).join(', ') || 'None'}`,
  );
  const actualKBTools = output.toolCalls.filter((tc: any) =>
    kbToolNames.includes(tc.name),
  );

  // 1. Tool Presence
  scores.tool_presence = {
    value: actuallyCalledKB ? 1 : 0,
    comment: `Found ${output.toolCalls.length} tool calls total`,
  };

  // 2. KB Tool Presence (more specific)
  scores.kb_tool_presence = {
    value: actualKBTools.length > 0 ? 1 : 0,
    comment: `Found ${actualKBTools.length} KB tool calls: ${actualKBTools.map((tc: any) => tc.name).join(', ') || 'None'}`,
  };

  // 3. Ability Compliance
  let abilityCompliant = false;
  if (expectedKBUsage === 'MUST_CALL') {
    abilityCompliant = actualKBTools.length > 0;
  } else if (expectedKBUsage === 'FLEXIBLE') {
    abilityCompliant = true; // Both calling and not calling are acceptable
  }

  scores.ability_compliance = {
    value: abilityCompliant ? 1 : 0,
    comment: `Ability ${ability} (${expectedKBUsage}): ${abilityCompliant ? 'Compliant' : 'Non-compliant'} - KB tools used: ${actualKBTools.length > 0}`,
  };

  // 4. Tool Set Appropriateness
  const expectedToolsString =
    item.expectedOutput?.['expected_output.expected_tools'] || '';
  const expectedTools =
    expectedToolsString && typeof expectedToolsString === 'string'
      ? expectedToolsString.split(',').map((t: string) => t.trim())
      : [];
  const actualToolNames = output.toolCalls.map((tc: any) => tc.name);
  const toolSetOk =
    expectedTools.length === 0 ||
    expectedTools.some((tool) => actualToolNames.includes(tool));

  scores.tool_set_ok = {
    value: toolSetOk ? 1 : 0,
    comment: `Expected: [${expectedTools.join(', ')}], Got: [${actualToolNames.join(', ')}]`,
  };

  // 5. Performance metrics
  if (output.firstToolLatency !== null) {
    scores.first_tool_latency_ms = {
      value: output.firstToolLatency,
      comment: `Time to first tool call`,
    };
  }

  scores.num_tool_calls = {
    value: output.toolCalls.length,
    comment: `Total tool calls made`,
  };

  // 6. Filename leak check (basic regex)
  const filenameLeakRegex = /\b\w+\.\w{1,4}\b|[\/\\][^\s]*[\/\\]/g;
  const hasFilenameLeak = filenameLeakRegex.test(output.message);
  scores.no_filename_leak_regex = {
    value: hasFilenameLeak ? 0 : 1,
    comment: hasFilenameLeak
      ? `Potential filename/path leak detected`
      : 'No filename leaks detected',
  };

  return scores;
}

async function main() {
  console.log('🚀 Starting KB Test Evaluation...\n');

  const langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY || '',
    publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
    baseUrl: process.env.LANGFUSE_HOST || 'https://us.cloud.langfuse.com',
  });

  try {
    // Load the KBTEST dataset
    console.log('📊 Loading KBTEST dataset...');
    const dataset = await langfuse.getDataset('KBTEST');
    console.log(`Found ${dataset.items.length} items in dataset\n`);

    const runName = `kbtest-eval-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;

    // Process each dataset item
    for (let i = 0; i < dataset.items.length; i++) {
      const item = dataset.items[i] as KBTestItem;
      const datasetItemAny = dataset.items[i] as any;
      console.log(`\n📋 Processing item ${i + 1}/${dataset.items.length}`);

      // Extract ability and expected KB behavior from the dataset structure
      const ability = item.input?.ability || item.input;
      const expectedKB =
        item.expectedOutput?.['expected_output.kb_expectation'];

      console.log(`   Ability: ${ability} | Expected KB: ${expectedKB}`);

      try {
        // Run the actual application
        const [langfuseObject, output] = await runMyLLMApplication(item.input);

        // Link to dataset item (optional: depends on SDK object shape)
        if (typeof datasetItemAny?.link === 'function') {
          await datasetItemAny.link(langfuseObject, runName, {
            description: 'KB Test Evaluation - Real App Flow',
            metadata: {
              model: 'chat-model',
              ability: ability,
              expected_kb: expectedKB,
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Calculate and add programmatic scores
        const scores = calculateProgrammaticScores(item, output);

        for (const [scoreName, scoreData] of Object.entries(scores)) {
          langfuseObject.score({
            name: scoreName,
            value: scoreData.value,
            comment: scoreData.comment,
          });
        }

        console.log(`✅ Item ${i + 1} completed successfully`);
        console.log(
          `   Ability compliance: ${scores.ability_compliance.value ? '✅' : '❌'}`,
        );
        console.log(
          `   KB tools used: ${scores.kb_tool_presence.value ? '✅' : '❌'}`,
        );
      } catch (error) {
        console.error(`❌ Error processing item ${i + 1}:`, error);
        // Continue with next item
      }
    }

    // Flush to ensure all data is sent
    console.log('\n🔄 Flushing data to Langfuse...');
    await langfuse.flushAsync();

    console.log('\n🎉 Evaluation completed!');
    console.log(
      `📊 View results in Langfuse: Datasets → KBTEST → Runs → ${runName}`,
    );
    console.log('\n📈 Key metrics to check:');
    console.log(
      '   - ability_compliance: % following explicit [USE EXPERTISE] directives',
    );
    console.log('   - kb_tool_presence: % using KB tools when appropriate');
    console.log(
      '   - no_filename_leak_regex: % responses without filename leaks',
    );
    console.log('   - first_tool_latency_ms: Speed of KB consultation');
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n⏹️  Evaluation interrupted. Flushing data...');
  const langfuse = new Langfuse();
  await langfuse.flushAsync();
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

export { runMyLLMApplication, calculateProgrammaticScores };
