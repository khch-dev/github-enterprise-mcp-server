/**
 * GitHub Enterprise Octokit client - baseUrl normalization, auth, optional self-signed cert.
 */

import { Octokit } from "octokit";
import https from "node:https";

export function normalizeEndpoint(url: string): string {
  let u = url.trim();
  if (!u) return u;
  if (u.endsWith("/")) u = u.slice(0, -1);
  if (u.endsWith("/api/v3")) return u;
  return `${u}/api/v3`;
}

export interface CreateClientOptions {
  endpoint: string;
  token: string;
  allowSelfSigned?: boolean;
}

export function createGitHubClient(options: CreateClientOptions): Octokit {
  const { endpoint, token, allowSelfSigned = false } = options;
  const baseUrl = normalizeEndpoint(endpoint);
  const auth = token.trim();

  const requestDefaults: Record<string, unknown> = {};
  if (allowSelfSigned) {
    requestDefaults.agent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  return new Octokit({
    auth,
    baseUrl,
    request: requestDefaults,
  });
}
