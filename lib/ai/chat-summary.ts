import { generateText } from 'ai';
import { myProvider } from './providers';
import type { DBMessage } from '../db/schema';

interface ChatWithMessages {
  id: string;
  title: string;
  createdAt: Date;
  messages: DBMessage[];
}

// Function to extract name from email (same logic as welcome page)
function getNameFromEmail(email: string | null | undefined): string {
  if (!email) return 'Coach';

  // Get the part before @
  const beforeAt = email.split('@')[0];
  if (!beforeAt) return 'Coach';

  // Split on '.' and take the first part
  const firstPart = beforeAt.split('.')[0];
  if (!firstPart) return 'Coach';

  // Remove any trailing non-letter characters
  const cleanName = firstPart.replace(/[^a-zA-Z]+$/, '');
  if (!cleanName) return 'Coach';

  // Capitalize first letter
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
}

// Extract text content from message parts
function extractTextFromMessage(message: DBMessage): string {
  try {
    const parts = message.parts as any[];
    const textParts = parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .filter(Boolean);

    return textParts.join(' ');
  } catch {
    return '';
  }
}

// Generate personalized greeting based on recent chats
export async function generatePersonalizedGreeting(
  chatsWithMessages: ChatWithMessages[],
  userEmail: string,
): Promise<string> {
  try {
    const coachName = getNameFromEmail(userEmail);

    // If no chats, return encouragement to start
    if (chatsWithMessages.length === 0) {
      return `Ready to start your first conversation with Nisa, ${coachName}!`;
    }

    // Extract relevant conversation content
    const conversationSummary = chatsWithMessages
      .map((chat) => {
        const userMessages = chat.messages
          .filter((msg) => msg.role === 'user')
          .map(extractTextFromMessage)
          .filter(Boolean)
          .slice(0, 3); // Limit to first 3 user messages per chat

        return {
          title: chat.title,
          userTopics: userMessages,
        };
      })
      .filter((chat) => chat.userTopics.length > 0);

    if (conversationSummary.length === 0) {
      return `Ready to continue our conversation, ${coachName}!`;
    }

    // Create prompt for GPT-4.1-nano
    const prompt = `You are Nisa, an AI coaching assistant. Generate a warm, casual, personalized greeting (1-2 sentences max) for ${coachName}, a coach returning to chat with you. Use language like "We've been talking about..." or "How'd___ go?". You're basically checking in on them like a friend. reference their specific topics. Address them by name. end with an emoji if appropriate.

Recent conversations between you (Nisa) and ${coachName}:
${conversationSummary
  .map(
    (chat, index) =>
      `${index + 1}. "${chat.title}" - Topics: ${chat.userTopics.join(', ')}`,
  )
  .join('\n')}

Generate a friendly, coaching-focused greeting from Nisa to ${coachName}:`;

    const result = await generateText({
      model: myProvider.languageModel('title-model'), // GPT-4.1-nano
      prompt,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'chat-based-greeting',
      },
    });

    return result.text.trim();
  } catch (error) {
    console.error('Error generating personalized greeting:', error);
    const coachName = getNameFromEmail(userEmail);
    return `Great to see you back, ${coachName}! Ready to continue coaching?`;
  }
}
