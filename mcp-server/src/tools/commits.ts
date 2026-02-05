import type { Octokit } from "octokit";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as commitsSchema from "../schemas/commits.js";
import { validateRepoInput } from "../utils/validators.js";
import { withRetry } from "../utils/retry.js";
import { withTimeout } from "../utils/timeout.js";
import { formatForMcp } from "../utils/error-handler.js";
import { truncateIfNeeded } from "../utils/response-handler.js";

function jsonContent(data: unknown): { content: [{ type: "text"; text: string }]; structuredContent?: unknown } {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text: truncateIfNeeded(text) }], structuredContent: data };
}

export function registerCommitTools(server: McpServer, octokit: Octokit): void {
  server.registerTool("github-commit-get", { title: "Get Commit", description: "Get a commit by SHA or ref", inputSchema: commitsSchema.commitGetInput },
    async (args) => {
      const { owner, repo, ref } = commitsSchema.commitGetInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.repos.getCommit({ owner, repo, ref })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-commit-list", { title: "List Commits", description: "List commits for a repository", inputSchema: commitsSchema.commitListInput },
    async (args) => {
      const params = commitsSchema.commitListInput.parse(args);
      validateRepoInput(params.owner, params.repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.repos.listCommits({ owner: params.owner, repo: params.repo, sha: params.sha, path: params.path, per_page: params.per_page, page: params.page })));
        return jsonContent({ commits: res.data });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-commit-compare", { title: "Compare Commits", description: "Compare two commits", inputSchema: commitsSchema.commitCompareInput },
    async (args) => {
      const { owner, repo, base, head } = commitsSchema.commitCompareInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.repos.compareCommits({ owner, repo, base, head })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
}
