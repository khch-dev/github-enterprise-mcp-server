/**
 * Response size limit and truncation for MCP tool responses.
 */

const DEFAULT_MAX_MB = 10;
const ENV_KEY = "MAX_RESPONSE_SIZE_MB";

function getMaxBytes(): number {
  const env = process.env[ENV_KEY];
  if (env != null) {
    const n = parseFloat(env);
    if (Number.isFinite(n) && n > 0) return Math.floor(n * 1024 * 1024);
  }
  return DEFAULT_MAX_MB * 1024 * 1024;
}

const TRUNCATE_MESSAGE = "\n\n[Response truncated. Original size: XMB. Use pagination or filters to reduce result set.]";

export function truncateIfNeeded(text: string): string {
  const max = getMaxBytes();
  const buf = Buffer.from(text, "utf-8");
  if (buf.length <= max) return text;
  const keepBytes = Math.floor(max * 0.95);
  const kept = buf.subarray(0, keepBytes).toString("utf-8");
  const originalMB = (buf.length / (1024 * 1024)).toFixed(2);
  return kept + TRUNCATE_MESSAGE.replace("XMB", originalMB);
}
