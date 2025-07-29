import { tool } from 'ai';
import { z } from 'zod';
import { google } from 'googleapis';
import { getUserSettings } from '@/lib/db/queries';
import type { Session } from 'next-auth';

// Helper function to extract folder ID from Google Drive URL
function extractFolderId(url: string): string | null {
  // Handle different Google Drive folder URL formats:
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  // https://drive.google.com/open?id=FOLDER_ID
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch) return folderMatch[1];

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (idMatch) return idMatch[1];

  return null;
}

// Helper function to get Google Drive client
async function getDriveClient() {
  const jsonCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  const base64Credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE_BASE64;

  let credentials: { client_email: string; private_key: string };
  if (base64Credentials) {
    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    credentials = JSON.parse(decoded);
  } else if (jsonCredentials) {
    try {
      credentials = JSON.parse(jsonCredentials);
    } catch (error) {
      console.error(
        'Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY_FILE JSON:',
        error,
      );
      throw new Error(
        'Failed to parse service account credentials. Please ensure it is valid JSON.',
      );
    }
  } else {
    throw new Error(
      'Google service account credentials not found. Please set GOOGLE_SERVICE_ACCOUNT_KEY_FILE or GOOGLE_SERVICE_ACCOUNT_KEY_FILE_BASE64.',
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return auth.getClient();
}

interface GoogleDriveToolProps {
  session: Session;
}

const drive = google.drive('v3');

export const listKnowledgeBaseFiles = ({ session }: GoogleDriveToolProps) =>
  tool({
    description:
      'List all files in the configured Google Drive knowledge base folder. Shows file names, types, and IDs.',
    parameters: z.object({}),
    execute: async () => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const userSettings = await getUserSettings({ userId: session.user.id });

        if (!userSettings?.googleDriveFolderUrl) {
          return {
            error:
              'No Google Drive folder configured. Please set up your Google Drive folder in settings.',
          };
        }

        const folderId = extractFolderId(userSettings.googleDriveFolderUrl);
        if (!folderId) {
          return {
            error:
              'Invalid Google Drive folder URL format. Please check your settings.',
          };
        }

        const authClient = await getDriveClient();

        const response = await drive.files.list({
          auth: authClient as any,
          q: `'${folderId}' in parents and trashed=false`,
          fields: 'files(id,name,mimeType,size,modifiedTime)',
          orderBy: 'name',
        });

        const files = response.data.files || [];

        return {
          message: `Found ${files.length} files in knowledge base`,
          files: files.map((file) => ({
            id: file.id,
            name: file.name,
            type: file.mimeType,
            size: file.size,
            lastModified: file.modifiedTime,
          })),
        };
      } catch (error: any) {
        console.error('Error listing knowledge base files:', error);
        return {
          error:
            error.message ||
            'Failed to list knowledge base files. Please check your credentials and permissions.',
        };
      }
    },
  });

export const readKnowledgeBaseFile = ({ session }: GoogleDriveToolProps) =>
  tool({
    description:
      'Read the content of a specific file from the Google Drive knowledge base by file name.',
    parameters: z.object({
      fileName: z
        .string()
        .describe('The name of the file to read (e.g., "document.txt")'),
    }),
    execute: async ({ fileName }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const userSettings = await getUserSettings({ userId: session.user.id });

        if (!userSettings?.googleDriveFolderUrl) {
          return {
            error:
              'No Google Drive folder configured. Please set up your Google Drive folder in settings.',
          };
        }

        const folderId = extractFolderId(userSettings.googleDriveFolderUrl);
        if (!folderId) {
          return {
            error:
              'Invalid Google Drive folder URL format. Please check your settings.',
          };
        }

        const authClient = await getDriveClient();

        // First, find the file by name
        const searchResponse = await drive.files.list({
          auth: authClient as any,
          q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
          fields: 'files(id,name,mimeType)',
        });

        const files = searchResponse.data.files || [];
        if (files.length === 0) {
          return { error: `File "${fileName}" not found in knowledge base` };
        }

        const file = files[0];

        if (!file.id) {
          return { error: 'File ID not available' };
        }

        // Get file content based on type
        let content = '';

        if (file.mimeType === 'application/vnd.google-apps.document') {
          // Google Docs - export as plain text
          const response = await drive.files.export({
            auth: authClient as any,
            fileId: file.id,
            mimeType: 'text/plain',
          });
          content = response.data as string;
        } else if (
          file.mimeType === 'application/vnd.google-apps.spreadsheet'
        ) {
          // Google Sheets - export as CSV
          const response = await drive.files.export({
            auth: authClient as any,
            fileId: file.id,
            mimeType: 'text/csv',
          });
          content = response.data as string;
        } else if (
          file.mimeType?.startsWith('text/') ||
          file.mimeType === 'application/json' ||
          file.mimeType === 'text/markdown'
        ) {
          // Plain text files
          const response = await drive.files.get({
            auth: authClient as any,
            fileId: file.id,
            alt: 'media',
          });
          content = response.data as string;
        } else {
          return {
            error: `Unsupported file type: ${file.mimeType}. Currently supported: Google Docs, Google Sheets, text files, markdown files.`,
          };
        }

        return {
          message: `Successfully read file "${fileName}"`,
          fileName: file.name,
          fileType: file.mimeType,
          content,
        };
      } catch (error: any) {
        console.error('Error reading knowledge base file:', error);

        // Check for common permission issues
        if (
          error.message?.includes('does not have permission') ||
          error.message?.includes('access')
        ) {
          return {
            error:
              'Permission denied. Please ensure the file and folder are shared directly with your service account email address.',
            suggestion:
              'Share the Google Drive folder and all files directly with your service account email (not "anyone with the link").',
          };
        }

        return {
          error:
            error.message ||
            'Failed to read knowledge base file. Please check your credentials and permissions.',
        };
      }
    },
  });

export const reviewNotes = ({ session }: GoogleDriveToolProps) =>
  tool({
    description:
      'Review the current notes that the assistant has saved about the knowledge base. These are stored in a special "nisa_notes.txt" file.',
    parameters: z.object({}),
    execute: async () => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const userSettings = await getUserSettings({ userId: session.user.id });

        if (!userSettings?.googleDriveFolderUrl) {
          return {
            error:
              'No Google Drive folder configured. Please set up your Google Drive folder in settings.',
          };
        }

        const folderId = extractFolderId(userSettings.googleDriveFolderUrl);
        if (!folderId) {
          return {
            error:
              'Invalid Google Drive folder URL format. Please check your settings.',
          };
        }

        const authClient = await getDriveClient();

        // Look for nisa_notes.txt file
        const searchResponse = await drive.files.list({
          auth: authClient as any,
          q: `'${folderId}' in parents and name='nisa_notes.txt' and trashed=false`,
          fields: 'files(id,name)',
        });

        const files = searchResponse.data.files || [];
        if (files.length === 0) {
          return {
            message:
              'No notes file found. Please create an empty "nisa_notes.txt" file in your Google Drive folder to enable note-taking.',
            notes: '',
            suggestion:
              'Due to Google Drive limitations, service accounts cannot create new files. You need to manually create the "nisa_notes.txt" file first.',
          };
        }

        const file = files[0];

        if (!file.id) {
          return { error: 'Notes file ID not available' };
        }

        // Read the notes file content
        const response = await drive.files.get({
          auth: authClient as any,
          fileId: file.id,
          alt: 'media',
        });

        const notes = response.data as string;

        return {
          message: 'Successfully retrieved notes',
          notes,
        };
      } catch (error: any) {
        console.error('Error reviewing notes:', error);
        return {
          error:
            error.message ||
            'Failed to review notes. Please check your credentials and permissions.',
        };
      }
    },
  });

export const updateNotes = ({ session }: GoogleDriveToolProps) =>
  tool({
    description:
      'Update the assistant\'s notes about the knowledge base. This creates or updates a "nisa_notes.txt" file in the Drive folder.',
    parameters: z.object({
      notes: z
        .string()
        .describe('The updated notes content to save about the knowledge base'),
    }),
    execute: async ({ notes }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const userSettings = await getUserSettings({ userId: session.user.id });

        if (!userSettings?.googleDriveFolderUrl) {
          return {
            error:
              'No Google Drive folder configured. Please set up your Google Drive folder in settings.',
          };
        }

        const folderId = extractFolderId(userSettings.googleDriveFolderUrl);
        if (!folderId) {
          return {
            error:
              'Invalid Google Drive folder URL format. Please check your settings.',
          };
        }

        const authClient = await getDriveClient();

        // Check if nisa_notes.txt already exists
        const searchResponse = await drive.files.list({
          auth: authClient as any,
          q: `'${folderId}' in parents and name='nisa_notes.txt' and trashed=false`,
          fields: 'files(id,name)',
        });

        const files = searchResponse.data.files || [];

        if (files.length > 0) {
          // Update existing file
          const fileId = files[0].id;

          if (!fileId) {
            return { error: 'Notes file ID not available' };
          }

          await drive.files.update({
            auth: authClient as any,
            fileId,
            media: {
              mimeType: 'text/plain',
              body: notes,
            },
          });

          return {
            message: 'Successfully updated notes',
            action: 'updated',
          };
        } else {
          // Service accounts can't create files due to storage quota limitations
          // Provide helpful guidance to the user
          return {
            error:
              'Cannot create notes file. Service accounts have storage limitations. Please create an empty "nisa_notes.txt" file in your Google Drive folder and share it with the service account, then try again.',
            suggestion:
              'Alternative: Use a Google Shared Drive instead of a personal folder, which allows service accounts to create files.',
          };
        }
      } catch (error: any) {
        console.error('Error updating notes:', error);

        // Check for common permission issues
        if (error.message?.includes('write access')) {
          return {
            error:
              'Permission denied. The nisa_notes.txt file must be shared directly with your service account email address (not "anyone with the link").',
            suggestion:
              'Right-click the nisa_notes.txt file → Share → Enter your service account email → Give Editor access.',
          };
        }

        return {
          error:
            error.message ||
            'Failed to update notes. Please check your credentials and permissions.',
        };
      }
    },
  });
