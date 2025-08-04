import { streamText } from 'ai';
import { myProvider } from './providers';

export interface StudentPIIResult {
  pii: boolean;
  data: Array<{
    pii_type: string;
    text: string;
  }> | null;
  originalContent?: string; // Include original content to avoid double fetching
  canRedact?: boolean; // Whether this file type can be easily redacted
}

const STUDENT_PII_PROMPT = `
Analyze this file for student personally identifiable information (PII). 
Focus on educational contexts where instructional coaches work with student data.

Identify instances of:
- Student names (first, last, full names, nicknames)
- Student ID numbers or codes
- Parent/guardian names  
- Parent contact information (phone, email)
- Home addresses or specific location details
- Birth dates or ages that could identify students
- Medical or IEP information
- Social security numbers
- Any other information that could identify specific students or families

Return JSON format: {pii: boolean, data: [{pii_type: string, text: string}]}
If no PII found, return {pii: false, data: null}

Use these pii_type categories:
- "student_name" for student names
- "student_id" for student identification numbers
- "parent_name" for parent/guardian names
- "parent_email" for parent email addresses
- "parent_phone" for parent phone numbers
- "home_address" for home addresses
- "birth_date" for birth dates or ages
- "medical_info" for medical information
- "iep_info" for IEP/504 plan details
- "ssn" for social security numbers
- "other" for any other identifying information

Be thorough but only flag actual PII that could identify specific individuals.
`;

// Determine if a file can be easily redacted based on content type
function canRedactFileType(contentType: string): boolean {
  const redactableTypes = [
    'text/plain',
    'text/csv',
    'application/json',
    'text/markdown',
    'text/html',
    'application/xml',
    'text/javascript',
    'text/typescript',
    'text/css',
  ];
  return redactableTypes.includes(contentType);
}

export async function detectStudentPII(
  fileUrl: string,
  contentType?: string,
): Promise<StudentPIIResult> {
  try {
    console.log(
      '🔍 Starting student PII detection for:',
      `${fileUrl.substring(0, 100)}...`,
    );

    // Fetch the file content first
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
    }
    const fileContent = await fileResponse.text();

    const { fullStream } = streamText({
      model: myProvider.languageModel('chat-model'),
      messages: [
        {
          role: 'user',
          content: `${STUDENT_PII_PROMPT}

File Content:
${fileContent}`,
        },
      ],
      maxTokens: 1000,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'detect-student-pii',
        metadata: {
          file_url: fileUrl,
          content_length: fileContent.length,
        },
      },
    });

    let llmResponse = '';
    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        llmResponse += delta.textDelta;
      }
    }

    // Parse JSON response
    const cleanResponse = llmResponse.trim();
    let result: StudentPIIResult;

    try {
      result = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse PII detection response:', parseError);
      console.error('Raw response:', cleanResponse);
      // Fallback: assume PII detected for safety
      result = {
        pii: true,
        data: [
          {
            pii_type: 'other',
            text: 'Unable to parse - treating as potentially sensitive',
          },
        ],
      };
    }

    console.log('✅ Student PII detection completed:', {
      inputUrl: `${fileUrl.substring(0, 50)}...`,
      piiDetected: result.pii,
      instanceCount: result.data?.length || 0,
    });

    return {
      ...result,
      originalContent: fileContent,
      canRedact: contentType ? canRedactFileType(contentType) : true,
    };
  } catch (error) {
    console.error('❌ Failed to detect student PII:', error);
    // Fallback: assume PII detected for safety
    return {
      pii: true,
      data: [
        {
          pii_type: 'other',
          text: 'Detection failed - treating as potentially sensitive',
        },
      ],
      originalContent: undefined, // Don't include content if detection failed
      canRedact: false, // Assume can't redact if detection failed
    };
  }
}
