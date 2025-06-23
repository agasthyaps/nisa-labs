# Google Sheets Integration Setup

This document explains how to set up and use the Google Sheets integration in the AI chatbot.

## Overview

The Google Sheets integration allows users to read from and write to Google Sheets directly through chat commands. Users can configure their Google Sheets URL in the settings page and then use natural language commands to interact with their spreadsheets.

## Features

- **Read Data**: Read data from specific ranges in Google Sheets
- **Write Data**: Write data to specific ranges in Google Sheets  
- **Append Data**: Append data to the next available row in Google Sheets
- **User Settings**: Configure Google Sheets URL per user
- **Error Handling**: Proper error messages for authentication and permission issues

## Setup Instructions

### 1. Google Service Account Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details
   - Click "Create and Continue"

5. Generate a JSON key:
   - Click on your service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose JSON format
   - Download the JSON file

### 2. Vercel Environment Variables

**Option A: Direct JSON (Recommended)**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`
   - **Value**: Copy and paste the **entire contents** of your JSON key file
   - **Environment**: Select all environments (Production, Preview, Development)

**Option B: Base64 Encoded**
1. Encode your JSON file: `base64 -i your-service-account-key.json`
2. Add as environment variable:
   - **Name**: `GOOGLE_SERVICE_ACCOUNT_KEY_FILE_BASE64`
   - **Value**: The base64 encoded string
   - **Environment**: Select all environments

### 3. Database Setup

The integration requires a new database table for user settings. Run the migration:

```bash
npm run db:migrate
```

### 4. Share Google Sheets

1. Create a Google Sheet
2. Click "Share" in the top right
3. Add your service account email (found in the JSON key file) with "Editor" permissions
4. Copy the Google Sheets URL

### 5. Configure User Settings

1. Log into the chatbot
2. Go to Settings (accessible from the user menu in the sidebar)
3. Paste your Google Sheets URL
4. Click "Save Settings"

## Usage

Once configured, users can use natural language commands in chat:

### Reading Data
- "Read data from Sheet1!A1:D10"
- "Show me the data in range B2:F15"
- "Get the first 5 rows from column A"

### Writing Data
- "Write this data to Sheet1!A1:D5: [['Name', 'Age'], ['John', '25'], ['Jane', '30']]"
- "Update the range A1:C3 with this information"

### Appending Data
- "Append this row to Sheet1!A:D: ['New Entry', 'Value1', 'Value2']"
- "Add this data to the next available row"

## Technical Implementation

### Database Schema

```sql
CREATE TABLE "UserSettings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "googleSheetsUrl" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
```

### API Endpoints

- `GET /api/settings` - Get user settings
- `POST /api/settings` - Save user settings

### Tools

The integration provides three AI tools:

1. **readGoogleSheet** - Read data from a specified range
2. **writeGoogleSheet** - Write data to a specified range
3. **appendGoogleSheet** - Append data to the next available row

### Components

- `GoogleSheetsResult` - Displays Google Sheets results in chat
- Settings page - User interface for configuring Google Sheets URL
- Database queries for user settings management

## Security Considerations

1. **Service Account Permissions**: The service account should have minimal required permissions
2. **User Authentication**: Only authenticated users can access settings and use Google Sheets tools
3. **URL Validation**: Google Sheets URLs are validated before saving
4. **Error Handling**: Sensitive information is not exposed in error messages
5. **Environment Variables**: Credentials are stored securely in Vercel environment variables

## Troubleshooting

### Common Issues

1. **"No Google Sheets URL configured"**
   - Solution: Configure your Google Sheets URL in Settings

2. **"Invalid Google Sheets URL format"**
   - Solution: Make sure you're using the full Google Sheets URL

3. **"Google Sheets API credentials not configured"**
   - Solution: Add your service account JSON to Vercel environment variables
   - Check that the environment variable name is correct
   - Verify the JSON content is complete and valid

4. **"Failed to read from Google Sheet"**
   - Solution: Check that the service account has access to the sheet
   - Verify the Google Sheets API is enabled
   - Check the service account key file path

5. **"User not authenticated"**
   - Solution: Make sure you're logged in to the chatbot

### Debugging

- Check the browser console for client-side errors
- Check the server logs for API errors
- Verify the Google Sheets API is working with a test request
- Check Vercel function logs for environment variable issues

## Vercel Deployment Notes

- Environment variables must be set for all environments (Production, Preview, Development)
- The JSON key file content should be pasted directly into the environment variable value
- Make sure to redeploy after adding environment variables
- Check Vercel function logs for any authentication errors

## Future Enhancements

- Support for multiple Google Sheets per user
- Real-time collaboration features
- Advanced formatting options
- Support for Google Docs and other Google Workspace apps
- OAuth2 authentication for better user experience 