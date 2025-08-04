import { auth } from '@/app/(auth)/auth';
import { getUserSettings, saveUserSettings } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';

const settingsSchema = z.object({
  googleSheetsUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || z.string().url().safeParse(val).success,
      { message: 'Must be a valid URL or empty' },
    ),
  googleDriveFolderUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || z.string().url().safeParse(val).success,
      { message: 'Must be a valid URL or empty' },
    ),
  curriculumEurekaMath: z.boolean().optional(),
  curriculumIllustrativeMath: z.boolean().optional(),
  curriculumCheckKnowledgeBase: z.boolean().optional(),
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
      googleDriveFolderUrl: settings?.googleDriveFolderUrl || '',
      curriculumEurekaMath: settings?.curriculumEurekaMath || false,
      curriculumIllustrativeMath: settings?.curriculumIllustrativeMath || false,
      curriculumCheckKnowledgeBase:
        settings?.curriculumCheckKnowledgeBase || false,
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
    const {
      googleSheetsUrl,
      googleDriveFolderUrl,
      curriculumEurekaMath,
      curriculumIllustrativeMath,
      curriculumCheckKnowledgeBase,
    } = settingsSchema.parse(body);

    await saveUserSettings({
      userId: session.user.id,
      googleSheetsUrl: googleSheetsUrl === '' ? undefined : googleSheetsUrl,
      googleDriveFolderUrl:
        googleDriveFolderUrl === '' ? undefined : googleDriveFolderUrl,
      curriculumEurekaMath,
      curriculumIllustrativeMath,
      curriculumCheckKnowledgeBase,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return new ChatSDKError('bad_request:database').toResponse();
  }
}
