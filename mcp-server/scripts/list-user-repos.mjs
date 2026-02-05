#!/usr/bin/env node
/**
 * One-off script: list repos for authenticated user (same as github-repo-list / GET /user/repos).
 * Requires: GITHUB_ENTERPRISE_ENDPOINT, GITHUB_ENTERPRISE_TOKEN
 */
import { Octokit } from "octokit";

const endpoint = process.env.GITHUB_ENTERPRISE_ENDPOINT;
const token = process.env.GITHUB_ENTERPRISE_TOKEN;
if (!endpoint || !token) {
  console.error("Set GITHUB_ENTERPRISE_ENDPOINT and GITHUB_ENTERPRISE_TOKEN");
  process.exit(1);
}
let baseUrl = endpoint.trim();
if (!baseUrl.endsWith("/api/v3")) baseUrl = baseUrl.replace(/\/?$/, "") + "/api/v3";

const octokit = new Octokit({ auth: token, baseUrl });
const per_page = Number(process.env.PER_PAGE) || 10;
const sort = process.env.SORT || "updated";

try {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    per_page,
    sort,
    direction: "desc",
  });
  console.log(JSON.stringify(data, null, 2));
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
