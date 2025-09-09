import { generateDummyPassword } from './db/utils';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

// Mini NISA embed configuration
export const MINI_NISA_ENABLED =
  (process.env.MINI_NISA_ENABLED ?? 'true').toLowerCase() === 'true';

const defaultAllowedOrigins = [
  'https://nisa.coach',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
];

export const MINI_NISA_ALLOWED_ORIGINS = (
  process.env.MINI_NISA_ALLOWED_ORIGINS ?? defaultAllowedOrigins.join(',')
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const MINI_NISA_MAX_TOKENS_GENERAL = Number(
  process.env.MINI_NISA_MAX_TOKENS_GENERAL ?? '100000',
);

export const MINI_NISA_MAX_TOKENS_CSV = Number(
  process.env.MINI_NISA_MAX_TOKENS_CSV ?? '100000',
);

export const MINI_NISA_MAX_TOKENS_IMAGE = Number(
  process.env.MINI_NISA_MAX_TOKENS_IMAGE ?? '100000',
);

export const MINI_NISA_ASSET_CSV_PATH =
  process.env.MINI_NISA_ASSET_CSV_PATH ?? '/mini-nisa/sample.csv';

export const MINI_NISA_ASSET_IMAGE_PATH =
  process.env.MINI_NISA_ASSET_IMAGE_PATH ?? '/mini-nisa/observation-notes.png';
