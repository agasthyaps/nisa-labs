import { auth } from '@/app/(auth)/auth';
import { getUserSettings, saveUserSettings } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';

const settingsSchema = z.object({
  googleSheetsUrl: z.string().url().optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const settings = await getUserSettings({ userId: session.user.id });

    return Response.json({
      googleSheetsUrl: settings?.googleSheetsUrl || '',
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return new ChatSDKError('bad_request:database').toResponse();
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const body = await request.json();
    const { googleSheetsUrl } = settingsSchema.parse(body);

    await saveUserSettings({
      userId: session.user.id,
      googleSheetsUrl,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return new ChatSDKError('bad_request:database').toResponse();
  }
}
