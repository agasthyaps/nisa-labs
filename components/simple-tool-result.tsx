'use client';

import { useState } from 'react';
import { ChevronDownIcon, CheckCircleFillIcon, WarningIcon } from './icons';
import { GoogleSheetsResult } from './google-sheets-result';

interface SimpleToolResultProps {
  toolName: string;
  result: any;
}

const getSimpleDescription = (
  toolName: string,
  result: any,
): { title: string; summary: string; hasError: boolean } => {
  const hasError = result?.error;

  if (hasError) {
    return {
      title: `${toolName} failed`,
      summary: result.error,
      hasError: true,
    };
  }

  switch (toolName) {
    case 'readGoogleSheet':
    case 'readDecisionLog':
      return {
        title: 'Data retrieved from Google Sheets',
        summary: result.data?.length
          ? `Found ${result.data.length} rows of data`
          : 'Data retrieved',
        hasError: false,
      };

    case 'writeGoogleSheet':
    case 'addNewDecisionLog':
      return {
        title: 'Data written to Google Sheets',
        summary: result.updatedCells
          ? `Updated ${result.updatedCells} cells`
          : 'Data saved successfully',
        hasError: false,
      };

    case 'listKnowledgeBaseFiles':
      return {
        title: 'Knowledge base files retrieved',
        summary: result.files?.length
          ? `Found ${result.files.length} files`
          : 'Files listed',
        hasError: false,
      };

    case 'readKnowledgeBaseFile':
      return {
        title: 'Knowledge base file retrieved',
        summary: result.content
          ? `File loaded (${result.content.length} characters)`
          : 'File retrieved',
        hasError: false,
      };

    case 'reviewNotes':
      return {
        title: 'Notes reviewed',
        summary: result.notes
          ? 'Notes retrieved successfully'
          : 'Notes operation completed',
        hasError: false,
      };

    case 'updateNotes':
      return {
        title: 'Notes updated',
        summary: 'Notes saved successfully',
        hasError: false,
      };

    case 'transcribeImage':
      return {
        title: 'Image transcribed',
        summary: result.content
          ? `Transcribed ${result.content.length} characters`
          : 'Image processed',
        hasError: false,
      };

    case 'getExpertiseTree':
      return {
        title: 'Repository structure retrieved',
        summary: result.stats
          ? `Found ${result.stats.totalFiles} files and ${result.stats.totalDirectories} directories`
          : 'Tree structure retrieved',
        hasError: false,
      };

    case 'listExpertiseFiles':
      return {
        title: 'Expertise files retrieved',
        summary: result.files?.length
          ? `Found ${result.files.length} expertise files`
          : 'Files listed',
        hasError: false,
      };

    case 'readExpertiseFile':
      return {
        title: 'Expertise file retrieved',
        summary: result.content
          ? `File loaded (${result.content.length} characters)`
          : 'File retrieved',
        hasError: false,
      };

    case 'searchExpertiseContent':
      return {
        title: 'Expertise content searched',
        summary: result.files?.length
          ? `Found ${result.files.length} matching files`
          : 'Search completed',
        hasError: false,
      };

    case 'getExpertiseOverview':
      return {
        title: 'Expertise overview retrieved',
        summary: result.overview
          ? `Overview loaded (${result.overview.length} characters)`
          : 'Overview retrieved',
        hasError: false,
      };

    default:
      return {
        title: `${toolName} completed`,
        summary: result.message || 'Operation completed successfully',
        hasError: false,
      };
  }
};

export function SimpleToolResult({ toolName, result }: SimpleToolResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { title, summary, hasError } = getSimpleDescription(toolName, result);

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={hasError ? 'text-destructive' : 'text-green-600'}>
            {hasError ? (
              <WarningIcon size={16} />
            ) : (
              <CheckCircleFillIcon size={16} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{title}</div>
            <div
              className={`text-xs ${hasError ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {summary}
            </div>
          </div>
        </div>
        <div
          className="text-muted-foreground transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDownIcon size={16} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t bg-muted/20">
          <div className="p-3">
            {toolName === 'readGoogleSheet' ||
            toolName === 'writeGoogleSheet' ||
            toolName === 'appendGoogleSheet' ||
            toolName === 'addNewDecisionLog' ||
            toolName === 'readDecisionLog' ? (
              <GoogleSheetsResult result={result} />
            ) : toolName === 'transcribeImage' ? (
              <div className="bg-background p-3 rounded border">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Transcribed Content:
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {result.content || result.error || 'No content available'}
                </div>
              </div>
            ) : toolName === 'readExpertiseFile' ? (
              <div className="bg-background p-3 rounded border">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  File Content:
                </div>
                <div className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {result.content || result.error || 'No content available'}
                </div>
              </div>
            ) : toolName === 'getExpertiseTree' ? (
              <div className="bg-background p-3 rounded border">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Repository Structure:
                </div>
                <div className="text-sm whitespace-pre font-mono max-h-96 overflow-y-auto">
                  {result.treeDisplay ||
                    result.error ||
                    'No structure available'}
                </div>
              </div>
            ) : toolName === 'getExpertiseOverview' ? (
              <div className="bg-background p-3 rounded border">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Repository Overview:
                </div>
                <div className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {result.overview || result.error || 'No overview available'}
                </div>
              </div>
            ) : (
              <pre className="text-xs bg-background p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
