import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        // OpenAI models (original)
        'chat-model': openai('gpt-4.1'),
        'chat-model-reasoning': wrapLanguageModel({
          model: google('gemini-2.5-pro'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': google('gemini-2.5-flash'),
        'artifact-model': openai('gpt-4.1'),

        // Anthropic models (new)
        'claude-sonnet': anthropic('claude-3-5-sonnet-20241022'),
        'claude-haiku': anthropic('claude-3-5-haiku-20241022'),
        'claude-opus': anthropic('claude-3-opus-20240229'),

        // Google models (new)
        'gemini-flash': google('gemini-2.5-flash'),
        'gemini-pro': google('gemini-2.5-pro'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-3'),
      },
    });
