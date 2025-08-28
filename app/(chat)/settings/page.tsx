'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Beaker } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roleType, setRoleType] = useState<'coach' | 'teacher'>('coach');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');
  const [curriculumEurekaMath, setCurriculumEurekaMath] = useState(false);
  const [curriculumIllustrativeMath, setCurriculumIllustrativeMath] =
    useState(false);
  const [curriculumCheckKnowledgeBase, setCurriculumCheckKnowledgeBase] =
    useState(false);
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
        setRoleType(settings.roleType || 'coach');
        setGoogleSheetsUrl(settings.googleSheetsUrl || '');
        setGoogleDriveFolderUrl(settings.googleDriveFolderUrl || '');
        setCurriculumEurekaMath(settings.curriculumEurekaMath || false);
        setCurriculumIllustrativeMath(
          settings.curriculumIllustrativeMath || false,
        );
        setCurriculumCheckKnowledgeBase(
          settings.curriculumCheckKnowledgeBase || false,
        );
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
          roleType,
          googleSheetsUrl,
          googleDriveFolderUrl,
          curriculumEurekaMath,
          curriculumIllustrativeMath,
          curriculumCheckKnowledgeBase,
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
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Try to go back, but if no history, go to welcome
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/welcome');
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Role Selection</CardTitle>
            <CardDescription>
              Choose your role to customize the AI assistant's behavior and available tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="roleCoach"
                  name="roleType"
                  checked={roleType === 'coach'}
                  onChange={() => setRoleType('coach')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="roleCoach" className="text-sm font-normal">
                  <strong>Coach</strong> - Full access to all tools including Google Sheets integration for decision logging and data analysis
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="roleTeacher"
                  name="roleType"
                  checked={roleType === 'teacher'}
                  onChange={() => setRoleType('teacher')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="roleTeacher" className="text-sm font-normal">
                  <strong>Teacher</strong> - Focused on instructional support with teacher-specific guidance and resources
                </Label>
              </div>
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
                shared with <strong>nisa-drive@nisa.coach</strong>.
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
            <div className="flex items-center gap-2">
              <CardTitle>Google Drive Knowledge Base</CardTitle>
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                <Beaker className="w-3 h-3" />
                New
              </div>
            </div>
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
                folder is shared with <strong>nisa-drive@nisa.coach</strong> for
                read access.
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
            <div className="flex items-center gap-2">
              <CardTitle>Curriculum</CardTitle>
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                <Beaker className="w-3 h-3" />
                New
              </div>
            </div>
            <CardDescription>
              Select which curriculum frameworks you&apos;re working with to get
              more targeted assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="curriculumEurekaMath"
                  checked={curriculumEurekaMath}
                  onChange={(e) => setCurriculumEurekaMath(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="curriculumEurekaMath"
                  className="text-sm font-normal"
                >
                  Eureka Math
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="curriculumIllustrativeMath"
                  checked={curriculumIllustrativeMath}
                  onChange={(e) =>
                    setCurriculumIllustrativeMath(e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="curriculumIllustrativeMath"
                  className="text-sm font-normal"
                >
                  Illustrative Math
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="curriculumCheckKnowledgeBase"
                  checked={curriculumCheckKnowledgeBase}
                  onChange={(e) =>
                    setCurriculumCheckKnowledgeBase(e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="curriculumCheckKnowledgeBase"
                  className="text-sm font-normal"
                >
                  Check My Knowledge Base{' '}
                  <i>
                    (Nisa will look for curriculum info in your shared google
                    drive folder)
                  </i>
                </Label>
              </div>
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
                  Create a Google Sheet and share it with{' '}
                  <strong>nisa-drive@nisa.coach</strong>
                </li>
                <li>Copy the Google Sheets URL and paste it above</li>
                <li>Save your settings</li>
                <li>Nisa can now read from and write to your Google Sheet!</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                Google Drive Knowledge Base Setup:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Create a Google Drive folder and share it{' '}
                  <strong>directly</strong> with{' '}
                  <strong>nisa-drive@nisa.coach</strong> with{' '}
                  <strong>Editor</strong> permissions (not &ldquo;anyone with
                  the link&rdquo;)
                </li>
                <li>
                  <strong>Important:</strong> Create an empty text file named
                  &ldquo;nisa_notes.txt&rdquo; in your folder
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
                  directly with <strong>nisa-drive@nisa.coach</strong>.
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
