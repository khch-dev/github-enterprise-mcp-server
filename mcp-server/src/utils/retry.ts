/**
 * Retry wrapper with exponential backoff for rate limit (429) and server errors.
 */

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60000;
const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function isRetryable(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    return RETRYABLE_STATUSES.has((error as { status: number }).status);
  }
  return false;
}

function getDelayMs(attempt: number): number {
  const jitter = Math.random() * 1000;
  const delay = BASE_DELAY_MS * Math.pow(2, attempt) + jitter;
  return Math.min(delay, MAX_DELAY_MS);
}

export async function withRetry<T>(fn: () => Promise<T>, options: { maxRetries?: number } = {}): Promise<T> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt === maxRetries || !isRetryable(e)) throw e;
      const delay = getDelayMs(attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
