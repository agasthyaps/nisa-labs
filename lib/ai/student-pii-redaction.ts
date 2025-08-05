import type { StudentPIIResult } from './student-pii-detection';

// Student data redaction mapping
const studentDataReplacements: Record<string, string> = {
  student_name: '[STUDENT_NAME]',
  student_id: '[STUDENT_ID]',
  parent_name: '[PARENT_NAME]',
  parent_email: '[PARENT_EMAIL]',
  parent_phone: '[PARENT_PHONE]',
  home_address: '[HOME_ADDRESS]',
  birth_date: '[BIRTH_DATE]',
  medical_info: '[MEDICAL_INFO]',
  iep_info: '[IEP_INFO]',
  ssn: '[SSN]',
  other: '[REDACTED]',
};

/**
 * Redacts student PII from text content using simple string replacement
 * @param originalContent - The original file content as string
 * @param piiData - Array of PII instances to redact
 * @returns Redacted content with PII replaced by placeholder tokens
 */
export function redactStudentPII(
  originalContent: string,
  piiData: StudentPIIResult['data'],
): string {
  if (!piiData || piiData.length === 0) {
    return originalContent;
  }

  let redactedContent = originalContent;

  // Sort by text length (longest first) to avoid partial replacements
  const sortedPiiData = [...piiData].sort(
    (a, b) => b.text.length - a.text.length,
  );

  for (const { pii_type, text } of sortedPiiData) {
    const replacement = studentDataReplacements[pii_type] || '[REDACTED]';

    // Use global case-insensitive replacement
    const regex = new RegExp(escapeRegExp(text), 'gi');
    redactedContent = redactedContent.replace(regex, replacement);
  }
  console.log(redactedContent);
  const preamble = `
  The following content has been redacted to protect student privacy.
  `;

  return preamble + redactedContent;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Gets a human-readable summary of what was redacted
 * @param piiData - Array of PII instances that were redacted
 * @returns Summary string for UI display
 */
export function getRedactionSummary(piiData: StudentPIIResult['data']): string {
  if (!piiData || piiData.length === 0) {
    return 'No specific student information detected';
  }

  const typeCounts: Record<string, number> = {};

  for (const { pii_type } of piiData) {
    typeCounts[pii_type] = (typeCounts[pii_type] || 0) + 1;
  }

  const summaryParts: string[] = [];

  if (typeCounts.student_name) {
    summaryParts.push(`${typeCounts.student_name} student name(s)`);
  }
  if (typeCounts.parent_name) {
    summaryParts.push(`${typeCounts.parent_name} parent name(s)`);
  }
  if (typeCounts.student_id) {
    summaryParts.push(`${typeCounts.student_id} student ID(s)`);
  }
  if (typeCounts.parent_email || typeCounts.parent_phone) {
    const contactCount =
      (typeCounts.parent_email || 0) + (typeCounts.parent_phone || 0);
    summaryParts.push(`${contactCount} parent contact(s)`);
  }
  if (typeCounts.home_address) {
    summaryParts.push(`${typeCounts.home_address} address(es)`);
  }
  if (typeCounts.medical_info || typeCounts.iep_info) {
    const medicalCount =
      (typeCounts.medical_info || 0) + (typeCounts.iep_info || 0);
    summaryParts.push(`${medicalCount} medical/IEP detail(s)`);
  }
  if (typeCounts.other) {
    summaryParts.push(`${typeCounts.other} other identifier(s)`);
  }

  if (summaryParts.length === 0) {
    return `${piiData.length} identifier(s) redacted`;
  }

  return `Redacted: ${summaryParts.join(', ')}`;
}
