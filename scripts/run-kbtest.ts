#!/usr/bin/env tsx

/**
 * Simple runner for KB Test evaluation
 * Usage: npm run eval:kbtest
 */

import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Check required environment variables
const requiredEnvVars = ['LANGFUSE_SECRET_KEY', 'LANGFUSE_PUBLIC_KEY'];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease add them to your .env.local file');
  process.exit(1);
}

console.log('🔑 Environment variables loaded');
console.log(
  `📡 Langfuse Host: ${process.env.LANGFUSE_HOST || 'https://us.cloud.langfuse.com'}`,
);

// Run the evaluation
try {
  console.log('🚀 Starting KB Test Evaluation...\n');
  execSync('npx tsx scripts/evaluate-kbtest.ts', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      // Ensure environment variables are passed through
      LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
      LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
      LANGFUSE_HOST: process.env.LANGFUSE_HOST,
    },
  });
} catch (error) {
  console.error('💥 Evaluation failed:', error);
  process.exit(1);
}
