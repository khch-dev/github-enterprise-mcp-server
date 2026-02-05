#!/usr/bin/env node
/**
 * GitHub Enterprise MCP Server - entry point.
 * CLI args: --endpoint, --token; env: GITHUB_ENTERPRISE_ENDPOINT, GITHUB_ENTERPRISE_TOKEN.
 * Security: HTTPS only, token format validation, optional startup validation and self-signed cert.
 */

import { createGitHubClient, normalizeEndpoint } from "./github-client.js";
import { formatForMcp } from "./utils/error-handler.js";
import { withTimeout } from "./utils/timeout.js";
import { runServer } from "./server.js";

const STARTUP_VALIDATION_TIMEOUT_ENV = "GITHUB_ENTERPRISE_STARTUP_VALIDATION_TIMEOUT_MS";
const DEFAULT_STARTUP_VALIDATION_TIMEOUT_MS = 60_000;

const TOKEN_REGEX = /^(ghp|ghs|gho|ghu|ghr)_[A-Za-z0-9_]+$/;
const RECOMMENDED_SCOPES = ["repo", "read:org"];

function parseArgs(): {
  endpoint: string;
  token: string;
  allowSelfSigned: boolean;
} {
  const args = process.argv.slice(2);
  let endpoint = process.env.GITHUB_ENTERPRISE_ENDPOINT ?? "";
  let token = process.env.GITHUB_ENTERPRISE_TOKEN ?? "";
  let allowSelfSigned =
    process.env.ALLOW_SELF_SIGNED_CERT === "true" || process.env.ALLOW_SELF_SIGNED_CERT === "1";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--endpoint" && args[i + 1] != null) {
      endpoint = args[i + 1].trim();
      i++;
    } else if (args[i] === "--token" && args[i + 1] != null) {
      token = args[i + 1].trim();
      i++;
    } else if (args[i] === "--allow-self-signed-cert") {
      allowSelfSigned = true;
    }
  }

  return { endpoint, token, allowSelfSigned };
}

function validateEndpoint(url: string): void {
  if (!url.startsWith("https://")) {
    process.stderr.write(
      "Security error: Endpoint must use HTTPS. HTTP is not allowed.\n"
    );
    process.exit(1);
  }
}

function validateTokenFormat(token: string): void {
  if (!TOKEN_REGEX.test(token)) {
    process.stderr.write(
      "Invalid token format. Token must match GitHub pattern (ghp_..., ghs_..., etc.).\n"
    );
    process.exit(1);
  }
}

function getStartupValidationTimeoutMs(): number {
  const env = process.env[STARTUP_VALIDATION_TIMEOUT_ENV];
  if (env != null) {
    const n = parseInt(env, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_STARTUP_VALIDATION_TIMEOUT_MS;
}

async function validateStartup(
  endpoint: string,
  token: string,
  allowSelfSigned: boolean
): Promise<void> {
  const octokit = createGitHubClient({
    endpoint,
    token,
    allowSelfSigned,
  });

  const timeoutMs = getStartupValidationTimeoutMs();
  try {
    const { data, headers } = await withTimeout(
      octokit.rest.users.getAuthenticated(),
      timeoutMs
    );
    if (!data?.login) {
      process.stderr.write("Startup validation failed: No login in response.\n");
      process.exit(1);
    }
    const skipScopeWarning =
      process.env.GITHUB_ENTERPRISE_SKIP_SCOPE_WARNING === "true" ||
      process.env.GITHUB_ENTERPRISE_SKIP_SCOPE_WARNING === "1";
    const scopes = (headers["x-oauth-scopes"] as string)?.split(",").map((s) => s.trim()) ?? [];
    const missing = RECOMMENDED_SCOPES.filter((s) => !scopes.includes(s));
    if (!skipScopeWarning && missing.length > 0) {
      process.stderr.write(
        `Warning: Token may be missing recommended scopes: ${missing.join(", ")}. ` +
          `Recommended: repo, read:org. (read:org is only needed for org-related operations.) ` +
          `Server continues. Set GITHUB_ENTERPRISE_SKIP_SCOPE_WARNING=1 to hide this.\n`
      );
    }
  } catch (err) {
    process.stderr.write(
      `Startup validation failed: ${formatForMcp(err)}\n`
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const { endpoint, token, allowSelfSigned } = parseArgs();

  if (!endpoint) {
    process.stderr.write(
      "Error: Missing required parameter. Provide --endpoint or GITHUB_ENTERPRISE_ENDPOINT.\n"
    );
    process.exit(1);
  }
  if (!token) {
    process.stderr.write(
      "Error: Missing required parameter. Provide --token or GITHUB_ENTERPRISE_TOKEN.\n"
    );
    process.exit(1);
  }

  validateEndpoint(endpoint);
  validateTokenFormat(token);

  if (allowSelfSigned) {
    process.stderr.write(
      "Security warning: Self-signed certificates are allowed. Use only in controlled environments.\n"
    );
  }

  await validateStartup(endpoint, token, allowSelfSigned);

  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const octokit = createGitHubClient({
    endpoint: normalizedEndpoint,
    token,
    allowSelfSigned,
  });

  await runServer(octokit);
}

main().catch((err) => {
  process.stderr.write(formatForMcp(err) + "\n");
  process.exit(1);
});
