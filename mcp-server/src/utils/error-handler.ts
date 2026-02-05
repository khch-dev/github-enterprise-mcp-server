/**
 * GitHub API error handling - defensive parsing, redact credentials, format for MCP clients.
 */

const MAX_STACK_LINES = 10;
const CREDENTIAL_PATTERNS = [
  /ghp_[A-Za-z0-9_]+/g,
  /ghs_[A-Za-z0-9_]+/g,
  /gho_[A-Za-z0-9_]+/g,
  /ghu_[A-Za-z0-9_]+/g,
  /ghr_[A-Za-z0-9_]+/g,
  /https?:\/\/[^\s'"]+/g,
];

function redact(str: string): string {
  let out = str;
  for (const re of CREDENTIAL_PATTERNS) {
    out = out.replace(re, "[REDACTED]");
  }
  return out;
}

function limitStack(stack: string | undefined): string {
  if (!stack) return "";
  const lines = stack.split("\n").slice(0, MAX_STACK_LINES);
  return lines.map((l) => redact(l)).join("\n");
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(
      obj,
      (_, v) => (v === undefined ? "[undefined]" : v),
      2
    );
  } catch {
    return String(obj);
  }
}

export interface GitHubErrorPayload {
  type: "github_error";
  status: number;
  message: string;
  documentation_url?: string;
}

export function formatGitHubError(error: unknown): GitHubErrorPayload {
  const fallback = { type: "github_error" as const, status: 500, message: "An unexpected error occurred" };
  if (error && typeof error === "object" && "status" in error) {
    const e = error as { status?: number; message?: string; documentation_url?: string; response?: { data?: unknown } };
    const status = typeof e.status === "number" ? e.status : fallback.status;
    let message = typeof e.message === "string" ? e.message : fallback.message;
    if (e.response && typeof e.response === "object" && e.response.data && typeof e.response.data === "object") {
      const data = e.response.data as { message?: string; errors?: unknown };
      if (typeof data.message === "string") message = data.message;
    }
    return { type: "github_error", status, message: redact(message), documentation_url: typeof e.documentation_url === "string" ? redact(e.documentation_url) : undefined };
  }
  if (error instanceof Error) {
    return { ...fallback, message: redact(error.message) };
  }
  return fallback;
}

export function formatForMcp(error: unknown): string {
  const gh = formatGitHubError(error);
  const stack = error instanceof Error ? limitStack(error.stack) : "";
  const extra = stack ? `\nStack (truncated):\n${stack}` : "";
  return safeStringify(gh) + extra;
}
