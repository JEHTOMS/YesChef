// Server-side request policy shared by recipe generation and cooking chat.
// Resolve at request time so dotenv-loaded deployment settings are respected.
export function chatOptions(maxTokens = 2000, temperature = 0) {
  return {
    model: process.env.OPENAI_MODEL || 'gpt-6-luna',
    reasoning_effort: 'none',
    temperature,
    max_completion_tokens: maxTokens,
  };
}

export const OPENAI_CLIENT_OPTIONS = { maxRetries: 0, timeout: 30000 };

export function isQuotaError(error) {
  const codes = [error?.code, error?.type, error?.error?.code, error?.error?.type];
  return codes.some(code => ['insufficient_quota', 'credit_balance_exhausted', 'billing_hard_limit_reached', 'billing_not_active', 'usage_limit_reached'].includes(code))
    || /exceeded your current quota|insufficient.quota|credit balance|billing.*limit/i.test(error?.message || '');
}

export function publicAIError(error) {
  if (isQuotaError(error)) return {
    statusCode: 503, code: 'ai_quota_exceeded',
    error: 'Recipe AI is unavailable because its usage allowance has been reached. Please contact support.',
  };
  if (error?.status === 429) return {
    statusCode: 429, code: 'ai_rate_limited',
    error: 'Too many requests at the moment. Please try again later.',
  };
  if ([401, 403, 404].includes(error?.status)) return {
    statusCode: 503, code: 'ai_configuration_error',
    error: 'The AI service is unavailable. Please contact support.',
  };
  if (error?.name === 'APIConnectionTimeoutError') return {
    statusCode: 504, code: 'ai_timeout', error: 'The AI service took too long to respond. Please try again.',
  };
  if (error?.status >= 500 || error?.name === 'APIConnectionError') return {
    statusCode: 503, code: 'ai_unavailable', error: 'The AI service is temporarily unavailable. Please try again later.',
  };
  return null;
}

// Only one retry, and never retry exhausted credits or invalid credentials.
// SDK retries are disabled above to prevent multiplicative retry bursts.
export async function callOpenAIWithRetry(call, {
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  random = Math.random,
} = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return await call(); }
    catch (error) {
      const retryable = error?.status === 429 || error?.status >= 500;
      if (attempt === 1 || isQuotaError(error) || !retryable) throw error;
      const raw = error.headers?.get?.('retry-after') ?? error.headers?.['retry-after'];
      const seconds = raw == null ? NaN : Number(raw);
      const delay = Number.isFinite(seconds) ? Math.max(0, seconds * 1000)
        : raw && Number.isFinite(Date.parse(raw)) ? Math.max(0, Date.parse(raw) - Date.now())
        : 1000 + Math.floor(random() * 500);
      // Do not retry earlier than requested, or hold a request open indefinitely.
      if (delay > 30000) throw error;
      await sleep(delay);
    }
  }
}
