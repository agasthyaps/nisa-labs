'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GoogleSheetsResultProps {
  result: {
    message?: string;
    error?: string;
    spreadsheetId?: string;
    range?: string;
    data?: string[][];
    headers?: string[];
    rows?: string[][];
    values?: string[][];
    note?: string;
  };
}

export function GoogleSheetsResult({ result }: GoogleSheetsResultProps) {
  if (result.error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">
            Google Sheets Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Sheets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.message && (
          <p className="text-sm text-muted-foreground">{result.message}</p>
        )}

        {result.spreadsheetId && (
          <div className="text-sm">
            <strong>Spreadsheet ID:</strong> {result.spreadsheetId}
          </div>
        )}

        {result.range && (
          <div className="text-sm">
            <strong>Range:</strong> {result.range}
          </div>
        )}

        {result.data && result.data.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Data:</h4>
            <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}

        {result.headers && result.rows && (
          <div>
            <h4 className="font-semibold mb-2">Data:</h4>
            <div className="text-sm">
              <div>
                <strong>Headers:</strong> {result.headers.join(', ')}
              </div>
              <div>
                <strong>Rows:</strong> {result.rows.length} rows
              </div>
            </div>
          </div>
        )}

        {result.values && result.values.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Values to Write:</h4>
            <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(result.values, null, 2)}
            </pre>
          </div>
        )}

        {result.note && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <strong>Note:</strong> {result.note}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
