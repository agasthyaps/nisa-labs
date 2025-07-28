import { registerOTel } from '@vercel/otel';
import { LangfuseExporter } from 'langfuse-vercel';

export function register() {
  // Only enable Langfuse tracing if credentials are available
  const hasLangfuseCredentials =
    process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY;

  registerOTel({
    serviceName: 'ai-chatbot',
    ...(hasLangfuseCredentials && {
      traceExporter: new LangfuseExporter({
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        baseUrl: process.env.LANGFUSE_HOST || 'https://us.cloud.langfuse.com',
      }),
    }),
  });
}
