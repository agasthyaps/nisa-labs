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
    // Decision log specific fields
    originalRange?: string;
    actualRange?: string;
    column?: string;
    endColumn?: string;
    rowCount?: number;
    columnCount?: number;
    updatedRange?: string;
    updatedRows?: number;
    updatedColumns?: number;
    updatedCells?: number;
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

        {result.originalRange && (
          <div className="text-sm">
            <strong>Original Range:</strong> {result.originalRange}
          </div>
        )}

        {result.actualRange && (
          <div className="text-sm">
            <strong>Actual Range:</strong> {result.actualRange}
          </div>
        )}

        {result.column && (
          <div className="text-sm">
            <strong>Column:</strong> {result.column}
          </div>
        )}

        {result.endColumn && (
          <div className="text-sm">
            <strong>End Column:</strong> {result.endColumn}
          </div>
        )}

        {result.rowCount && (
          <div className="text-sm">
            <strong>Rows:</strong> {result.rowCount}
          </div>
        )}

        {result.columnCount && (
          <div className="text-sm">
            <strong>Columns:</strong> {result.columnCount}
          </div>
        )}

        {result.updatedRange && (
          <div className="text-sm">
            <strong>Updated Range:</strong> {result.updatedRange}
          </div>
        )}

        {result.updatedRows && (
          <div className="text-sm">
            <strong>Updated Rows:</strong> {result.updatedRows}
          </div>
        )}

        {result.updatedColumns && (
          <div className="text-sm">
            <strong>Updated Columns:</strong> {result.updatedColumns}
          </div>
        )}

        {result.updatedCells && (
          <div className="text-sm">
            <strong>Updated Cells:</strong> {result.updatedCells}
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
