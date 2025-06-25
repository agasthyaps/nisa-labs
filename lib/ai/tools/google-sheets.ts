import { tool } from 'ai';
import { z } from 'zod';
import { google } from 'googleapis';
import { getUserSettings } from '@/lib/db/queries';
import type { Session } from 'next-auth';

// Helper function to extract spreadsheet ID from URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Helper function to get Google Sheets client
async function getSheetsClient() {
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
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth.getClient();
}

interface GoogleSheetsToolProps {
  session: Session;
}

const sheets = google.sheets('v4');

export const readGoogleSheet = ({ session }: GoogleSheetsToolProps) =>
  tool({
    description:
      'Read data from a Google Sheet. Specify the range in A1 notation (e.g., "Sheet1!A1:D10")',
    parameters: z.object({
      range: z
        .string()
        .describe('The range to read in A1 notation (e.g., "Sheet1!A1:D10")'),
    }),
    execute: async ({ range }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const userSettings = await getUserSettings({ userId: session.user.id });

        if (!userSettings?.googleSheetsUrl) {
          return {
            error:
              'No Google Sheets URL configured. Please set up your Google Sheets URL in settings.',
          };
        }

        const spreadsheetId = extractSpreadsheetId(
          userSettings.googleSheetsUrl,
        );
        if (!spreadsheetId) {
          return { error: 'Invalid Google Sheets URL format' };
        }

        const authClient = await getSheetsClient();

        const response = await sheets.spreadsheets.values.get({
          auth: authClient as any, // Cast to any to avoid complex type issues
          spreadsheetId,
          range,
        });

        const values = response.data.values;

        if (!values || values.length === 0) {
          return { message: 'No data found in the specified range', data: [] };
        }

        return {
          message: `Successfully read ${values.length} rows from ${range}`,
          data: values,
          headers: values[0],
          rows: values.slice(1),
        };
      } catch (error: any) {
        console.error('Error reading Google Sheet:', error);
        return {
          error:
            error.message ||
            'Failed to read from Google Sheet. Please check your credentials and permissions.',
        };
      }
    },
  });

export const writeGoogleSheet = ({ session }: GoogleSheetsToolProps) =>
  tool({
    description:
      'Write data to a Google Sheet. Specify the range in A1 notation and provide the data as an array, assume vertical column based data.',
    parameters: z.object({
      range: z
        .string()
        .describe(
          'The range to write to in A1 notation. assume vertical column based data, left to right (eg A1:A10 then B1:B10 then C1:C10).',
        ),
      values: z
        .array(z.array(z.string()))
        .describe('1D array of values to write'),
    }),
    execute: async ({ range, values }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const userSettings = await getUserSettings({ userId: session.user.id });

        if (!userSettings?.googleSheetsUrl) {
          return {
            error:
              'No Google Sheets URL configured. Please set up your Google Sheets URL in settings.',
          };
        }

        const spreadsheetId = extractSpreadsheetId(
          userSettings.googleSheetsUrl,
        );
        if (!spreadsheetId) {
          return { error: 'Invalid Google Sheets URL format' };
        }

        const authClient = await getSheetsClient();

        const response = await sheets.spreadsheets.values.update({
          auth: authClient as any,
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: { values },
        });

        return {
          message: `Successfully wrote ${values.length} rows to ${range}`,
          updatedRange: response.data.updatedRange,
          updatedRows: response.data.updatedRows,
          updatedColumns: response.data.updatedColumns,
          updatedCells: response.data.updatedCells,
        };
      } catch (error: any) {
        console.error('Error writing to Google Sheet:', error);
        return {
          error:
            error.message ||
            'Failed to write to Google Sheet. Please check your credentials and permissions.',
        };
      }
    },
  });

// export const appendGoogleSheet = ({ session }: GoogleSheetsToolProps) =>
//   tool({
//     description:
//       'Append data to a Google Sheet. Data will be added to the next available row',
//     parameters: z.object({
//       range: z.string().describe('The range to append to (e.g., "Sheet1!A:D")'),
//       values: z
//         .array(z.array(z.string()))
//         .describe('2D array of values to append'),
//     }),
//     execute: async ({ range, values }) => {
//       try {
//         if (!session?.user?.id) {
//           return { error: 'User not authenticated' };
//         }

//         const userSettings = await getUserSettings({ userId: session.user.id });

//         if (!userSettings?.googleSheetsUrl) {
//           return {
//             error:
//               'No Google Sheets URL configured. Please set up your Google Sheets URL in settings.',
//           };
//         }

//         const spreadsheetId = extractSpreadsheetId(
//           userSettings.googleSheetsUrl,
//         );
//         if (!spreadsheetId) {
//           return { error: 'Invalid Google Sheets URL format' };
//         }

//         const authClient = await getSheetsClient();

//         const response = await sheets.spreadsheets.values.append({
//           auth: authClient as any,
//           spreadsheetId,
//           range,
//           valueInputOption: 'RAW',
//           requestBody: { values },
//         });

//         return {
//           message: `Successfully appended ${values.length} rows to ${range}`,
//           updatedRange: response.data.updates?.updatedRange,
//           updatedRows: response.data.updates?.updatedRows,
//           updatedColumns: response.data.updates?.updatedColumns,
//           updatedCells: response.data.updates?.updatedCells,
//         };
//       } catch (error: any) {
//         console.error('Error appending to Google Sheet:', error);
//         return {
//           error:
//             error.message ||
//             'Failed to append to Google Sheet. Please check your credentials and permissions.',
//         };
//       }
//     },
//   });

// Helper function to validate date format MM-DD-YY
function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Additional validation to ensure it's a valid date
  const [month, day, year] = dateString.split('-');
  const fullYear =
    Number.parseInt(year, 10) < 50
      ? 2000 + Number.parseInt(year, 10)
      : 1900 + Number.parseInt(year, 10);
  const date = new Date(
    fullYear,
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
  );

  return (
    date.getFullYear() === fullYear &&
    date.getMonth() === Number.parseInt(month, 10) - 1 &&
    date.getDate() === Number.parseInt(day, 10)
  );
}

// Helper function to parse A1 notation and extract column and row info
function parseA1Notation(
  range: string,
): { column: string; startRow: number; endRow: number } | null {
  console.log(`Parsing range: "${range}"`);

  // Handle ranges with or without sheet names
  // Examples: "A1:A10", "Sheet1!A1:A10", "Coaching Action Plan!A1:A10"

  // First, try to match with sheet name
  let match = range.match(/^[^!]+!([A-Z]+)(\d+):([A-Z]+)(\d+)$/);

  // If no match, try without sheet name
  if (!match) {
    match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  }

  if (!match) {
    console.log(`Failed to parse range: "${range}"`);
    return null;
  }

  const [, startCol, startRow, endCol, endRow] = match;

  // Check if it's a vertical range (same column)
  if (startCol !== endCol) {
    console.log(`Range is not vertical: ${startCol} != ${endCol}`);
    return null;
  }

  const result = {
    column: startCol,
    startRow: Number.parseInt(startRow, 10),
    endRow: Number.parseInt(endRow, 10),
  };

  console.log(`Successfully parsed range:`, result);
  return result;
}

// Helper function to get next available column
function getNextColumn(column: string): string {
  let result = '';
  let carry = 1;

  for (let i = column.length - 1; i >= 0; i--) {
    const charCode = column.charCodeAt(i) - 64; // A=1, B=2, etc.
    const newCharCode = charCode + carry;

    if (newCharCode > 26) {
      carry = 1;
      result = `${String.fromCharCode(64 + (newCharCode - 26))}${result}`;
    } else {
      carry = 0;
      result = `${String.fromCharCode(64 + newCharCode)}${result}`;
    }
  }

  if (carry > 0) {
    result = `A${result}`;
  }

  return result;
}

// Helper function to find next available column
async function findNextAvailableColumn(
  authClient: any,
  spreadsheetId: string,
  sheetName: string,
  startRow: number,
  endRow: number,
): Promise<string> {
  // Make a single API call to read a large range (B1:Z26) to find available columns
  // Decision logs start from column B, so we check B-Z
  const range = `${sheetName}!B${startRow}:Z${endRow}`;

  try {
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    console.log(`Checking range ${range}, found ${values.length} rows`);

    // Check each column from B to Z to find the first empty one
    for (let colIndex = 0; colIndex < 25; colIndex++) {
      // B-Z = 25 columns
      let isColumnOccupied = false;

      // Check if any cell in this column has data
      for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
        const row = values[rowIndex];
        if (
          row &&
          row[colIndex] !== null &&
          row[colIndex] !== undefined &&
          row[colIndex] !== ''
        ) {
          isColumnOccupied = true;
          break;
        }
      }

      if (!isColumnOccupied) {
        // Convert column index to column letter (0 = B, 1 = C, etc.)
        const columnLetter = String.fromCharCode(66 + colIndex); // 66 is ASCII for 'B'
        console.log(`Found available column: ${columnLetter}`);
        return columnLetter;
      }
    }

    // If all columns B-Z are occupied, start from AA
    console.log('All columns B-Z occupied, using AA');
    return 'AA';
  } catch (error) {
    console.error('Error finding next available column:', error);
    return 'B'; // Default to B on error
  }
}

export const addNewDecisionLog = ({ session }: GoogleSheetsToolProps) =>
  tool({
    description:
      'Add a new decision log entry to a Google Sheet. The tool will automatically find the next available column and validate the date format, which is always in MM-DD-YY format.',
    parameters: z.object({
      range: z
        .string()
        .describe(
          'The range in A1 notation for a vertical column (e.g., "A1:A10" or "Sheet1!A1:A10"). Must be a single column range. First value must be date in MM-DD-YY format. Sheet name is optional since the tool uses the first sheet.',
        ),
      values: z
        .array(z.string())
        .describe(
          'Array of values to write. First value must be a date in MM-DD-YY format.',
        ),
    }),
    execute: async ({ range, values }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const userSettings = await getUserSettings({ userId: session.user.id });

        if (!userSettings?.googleSheetsUrl) {
          return {
            error:
              'No Google Sheets URL configured. Please set up your Google Sheets URL in settings.',
          };
        }

        const spreadsheetId = extractSpreadsheetId(
          userSettings.googleSheetsUrl,
        );
        if (!spreadsheetId) {
          return { error: 'Invalid Google Sheets URL format' };
        }

        // Validate that range is a 1D vertical array
        const parsedRange = parseA1Notation(range);
        if (!parsedRange) {
          return {
            error:
              'Invalid range format. Must be a single column range in A1 notation (e.g., "Sheet1!A1:A10")',
          };
        }

        // Validate that first value is a date in MM-DD-YY format
        if (values.length === 0) {
          return { error: 'Values array cannot be empty' };
        }

        if (!isValidDateFormat(values[0])) {
          return {
            error:
              'First value must be a valid date in MM-DD-YY format (e.g., "12-25-23")',
          };
        }

        const authClient = await getSheetsClient();

        // Get the first sheet name or default to "Coaching Action Plan"
        const sheetName = await getFirstSheetName(authClient, spreadsheetId);
        console.log(`Using sheet name: ${sheetName}`);

        // Find next available column
        const availableColumn = await findNextAvailableColumn(
          authClient,
          spreadsheetId,
          sheetName,
          22, // Always start at row 22
          26, // Always end at row 26
        );
        console.log(`Selected column: ${availableColumn}`);

        // Create the new range with the available column (always rows 22-26)
        const newRange = `${sheetName}!${availableColumn}22:${availableColumn}26`;
        console.log(`Writing to range: ${newRange}`);
        console.log(`Values to write:`, values);

        // Convert 1D array to 2D array for Google Sheets API
        const values2D = values.map((value) => [value]);
        console.log(`2D values:`, values2D);

        const response = await sheets.spreadsheets.values.update({
          auth: authClient as any,
          spreadsheetId,
          range: newRange,
          valueInputOption: 'RAW',
          requestBody: { values: values2D },
        });
        console.log(`API response:`, response.data);

        return {
          message: `Successfully added decision log with ${values.length} entries to ${newRange}`,
          originalRange: range,
          actualRange: newRange,
          column: availableColumn,
          updatedRange: response.data.updatedRange,
          updatedRows: response.data.updatedRows,
          updatedColumns: response.data.updatedColumns,
          updatedCells: response.data.updatedCells,
        };
      } catch (error: any) {
        console.error('Error adding decision log:', error);
        return {
          error:
            error.message ||
            'Failed to add decision log. Please check your credentials and permissions.',
        };
      }
    },
  });

// Helper function to validate column name format (A-Z, AA-ZZ, etc.)
function isValidColumnName(column: string): boolean {
  return /^[A-Z]{1,2}$/.test(column) && column <= 'ZZ';
}

export const readDecisionLog = ({ session }: GoogleSheetsToolProps) =>
  tool({
    description:
      'Read decision log data from a Google Sheet. Reads from B21 to the furthest right filled column at row 26, or to a specified column.',
    parameters: z.object({
      extend: z
        .string()
        .optional()
        .describe(
          'Optional column name to extend the range to (e.g., "AB" for B21:AB26). Must be A-Z or AA-ZZ.',
        ),
    }),
    execute: async ({ extend }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const userSettings = await getUserSettings({ userId: session.user.id });

        if (!userSettings?.googleSheetsUrl) {
          return {
            error:
              'No Google Sheets URL configured. Please set up your Google Sheets URL in settings.',
          };
        }

        const spreadsheetId = extractSpreadsheetId(
          userSettings.googleSheetsUrl,
        );
        if (!spreadsheetId) {
          return { error: 'Invalid Google Sheets URL format' };
        }

        const authClient = await getSheetsClient();

        // Get the first sheet name or default to "Coaching Action Plan"
        const sheetName = await getFirstSheetName(authClient, spreadsheetId);

        let endColumn: string;
        let values: any[][] = [];

        if (extend) {
          // Validate the extend parameter
          if (!isValidColumnName(extend)) {
            return {
              error:
                'Invalid extend parameter. Must be a valid column name (A-Z or AA-ZZ) and not exceed ZZ.',
            };
          }

          // Ensure the extend column is not before B
          if (extend < 'B') {
            return {
              error:
                'Extend column must be B or later (decision logs start at column B).',
            };
          }

          endColumn = extend;

          // Read the specified range
          const range = `${sheetName}!B21:${endColumn}26`;
          const response = await sheets.spreadsheets.values.get({
            auth: authClient as any,
            spreadsheetId,
            range,
          });
          values = response.data.values || [];
        } else {
          // Read the full range B21:Z26 and determine the furthest right column
          const range = `${sheetName}!B21:Z26`;
          const response = await sheets.spreadsheets.values.get({
            auth: authClient as any,
            spreadsheetId,
            range,
          });

          values = response.data.values || [];

          if (values.length === 0) {
            endColumn = 'B';
          } else {
            // Find the furthest right column that has data
            let lastFilledColumnIndex = 0;

            for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
              const row = values[rowIndex];
              if (row) {
                for (let colIndex = row.length - 1; colIndex >= 0; colIndex--) {
                  const cell = row[colIndex];
                  if (cell !== null && cell !== undefined && cell !== '') {
                    lastFilledColumnIndex = Math.max(
                      lastFilledColumnIndex,
                      colIndex,
                    );
                    break; // Found data in this row, move to next row
                  }
                }
              }
            }

            // Convert column index to column letter (0 = B, 1 = C, etc.)
            endColumn = String.fromCharCode(66 + lastFilledColumnIndex); // 66 is ASCII for 'B'

            // Trim the values to only include data up to the furthest right column
            if (lastFilledColumnIndex < values[0].length - 1) {
              values = values.map((row) =>
                row.slice(0, lastFilledColumnIndex + 1),
              );
            }
          }
        }

        const range = `${sheetName}!B21:${endColumn}26`;

        if (values.length === 0) {
          return {
            message: 'No decision log data found in the specified range',
            data: [],
            range: range,
            endColumn: endColumn,
          };
        }

        return {
          message: `Successfully read decision log data from ${range}`,
          data: values,
          range: range,
          endColumn: endColumn,
          rowCount: values.length,
          columnCount: values[0]?.length || 0,
        };
      } catch (error: any) {
        console.error('Error reading decision log:', error);
        return {
          error:
            error.message ||
            'Failed to read decision log. Please check your credentials and permissions.',
        };
      }
    },
  });

// Helper function to get the first sheet name or default to "Coaching Action Plan"
async function getFirstSheetName(
  authClient: any,
  spreadsheetId: string,
): Promise<string> {
  try {
    const response = await sheets.spreadsheets.get({
      auth: authClient,
      spreadsheetId,
    });

    const sheetList = response.data.sheets;
    console.log(`Found ${sheetList?.length || 0} sheets in spreadsheet`);

    if (sheetList && sheetList.length > 0) {
      const sheetName =
        sheetList[0].properties?.title || 'Coaching Action Plan';
      console.log(`First sheet name: ${sheetName}`);
      return sheetName;
    }

    console.log('No sheets found, using default: Coaching Action Plan');
    return 'Coaching Action Plan';
  } catch (error) {
    console.error('Error getting sheet name:', error);
    return 'Coaching Action Plan';
  }
}
