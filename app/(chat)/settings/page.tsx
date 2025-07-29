'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/toast';
import { LoaderIcon } from '@/components/icons';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadUserSettings();
    }
  }, [session?.user?.id]);

  const loadUserSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const settings = await response.json();
        setGoogleSheetsUrl(settings.googleSheetsUrl || '');
        setGoogleDriveFolderUrl(settings.googleDriveFolderUrl || '');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        type: 'error',
        description: 'Failed to load settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!session?.user?.id) {
      toast({
        type: 'error',
        description: 'You must be logged in to save settings',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleSheetsUrl,
          googleDriveFolderUrl,
        }),
      });

      if (response.ok) {
        toast({
          type: 'success',
          description: 'Settings saved successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        type: 'error',
        description: 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderIcon />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You must be logged in to access settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Google Sheets Integration</CardTitle>
            <CardDescription>
              Configure your Google Sheets URL to enable reading and writing to
              spreadsheets via chat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="googleSheetsUrl">Google Sheets URL</Label>
              <Input
                id="googleSheetsUrl"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit"
                value={googleSheetsUrl}
                onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Paste the full URL of your Google Sheet. Make sure the sheet is
                shared with the service account.
              </p>
            </div>

            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? <LoaderIcon /> : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Google Drive Knowledge Base</CardTitle>
            <CardDescription>
              Configure your Google Drive folder to enable reading from and
              taking notes about your knowledge base documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="googleDriveFolderUrl">
                Google Drive Folder URL
              </Label>
              <Input
                id="googleDriveFolderUrl"
                type="url"
                placeholder="https://drive.google.com/drive/folders/your-folder-id"
                value={googleDriveFolderUrl}
                onChange={(e) => setGoogleDriveFolderUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Paste the full URL of your Google Drive folder. Make sure the
                folder is shared with the service account for read access.
              </p>
            </div>

            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? <LoaderIcon /> : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
            <CardDescription>
              Instructions for setting up and using Google Sheets integration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Google Sheets Setup:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Create a Google Sheet and share it with your service account
                  email
                </li>
                <li>Copy the Google Sheets URL and paste it above</li>
                <li>Save your settings</li>
                <li>
                  In chat, you can now use commands like:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>&ldquo;Read data from Sheet1!A1:D10&rdquo;</li>
                    <li>&ldquo;Write this data to Sheet1!A1:D5&rdquo;</li>
                    <li>&ldquo;Append this row to Sheet1!A:D&rdquo;</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                Google Drive Knowledge Base Setup:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Create a Google Drive folder and share it{' '}
                  <strong>directly</strong> with your service account email with{' '}
                  <strong>Editor</strong> permissions (not &ldquo;anyone with
                  the link&rdquo;)
                </li>
                <li>
                  <strong>Important:</strong> Create an empty text file named
                  &ldquo;nisa_notes.txt&rdquo; in your folder
                </li>
                <li>
                  <strong>Critical:</strong> Share the
                  &ldquo;nisa_notes.txt&rdquo; file
                  <strong>directly</strong> with your service account email with{' '}
                  <strong>Editor</strong> permissions
                </li>
                <li>Copy the Google Drive folder URL and paste it above</li>
                <li>Save your settings</li>
                <li>
                  The assistant can now:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>List all files in your knowledge base</li>
                    <li>
                      Read content from Google Docs, Sheets, text files, and
                      markdown files
                    </li>
                    <li>
                      Update notes in the &ldquo;nisa_notes.txt&rdquo; file
                      about what it learns
                    </li>
                    <li>Reference specific documents when giving advice</li>
                  </ul>
                </li>
              </ol>
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> Service accounts require explicit
                  sharing with the exact service account email address.
                  &ldquo;Anyone with the link&rdquo; permissions will NOT work.
                  You must share both the folder and the nisa_notes.txt file
                  directly with your service account email.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Note:</h3>
              <p className="text-sm text-muted-foreground">
                This feature requires proper Google service account setup.
                Contact your administrator for credentials configuration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
