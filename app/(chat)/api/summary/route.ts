import { auth } from '@/app/(auth)/auth';
import { getRecentChatsWithMessages } from '@/lib/db/queries';
import { generatePersonalizedGreeting } from '@/lib/ai/chat-summary';
import { ChatSDKError } from '@/lib/errors';

export async function GET() {
  try {
    // Get the authenticated user
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Get the user's recent chats with messages
    const recentChats = await getRecentChatsWithMessages({
      userId: session.user.id,
      limit: 3,
    });

    // Generate personalized greeting based on chat history
    const personalizedGreeting = await generatePersonalizedGreeting(
      recentChats,
      session.user.email || '',
    );

    return Response.json({ summary: personalizedGreeting });
  } catch (error) {
    console.error('Error generating personalized greeting:', error);
    return Response.json(
      { error: 'Failed to generate personalized greeting' },
      { status: 500 },
    );
  }
}
