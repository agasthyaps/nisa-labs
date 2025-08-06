export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  // OpenAI models
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },

  // Anthropic models
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: "Anthropic's most capable model, excellent for complex tasks",
  },
  {
    id: 'claude-haiku',
    name: 'Claude 3.5 Haiku',
    description: "Anthropic's fastest model, great for quick responses",
  },
  {
    id: 'claude-opus',
    name: 'Claude 3 Opus',
    description: "Anthropic's most powerful model for complex reasoning",
  },

  // Google models
  {
    id: 'gemini-flash',
    name: 'Gemini 1.5 Flash',
    description: "Google's fast and efficient model",
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 1.5 Pro',
    description: "Google's most capable model for complex tasks",
  },
  {
    id: 'gemini-flash-2',
    name: 'Gemini 2.0 Flash',
    description: "Google's latest multimodal model",
  },
];
