import type { Octokit } from "octokit";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as pullsSchema from "../schemas/pulls.js";
import { validateRepoInput } from "../utils/validators.js";
import { withRetry } from "../utils/retry.js";
import { withTimeout } from "../utils/timeout.js";
import { formatForMcp } from "../utils/error-handler.js";
import { truncateIfNeeded } from "../utils/response-handler.js";

function jsonContent(data: unknown): { content: [{ type: "text"; text: string }]; structuredContent?: unknown } {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text: truncateIfNeeded(text) }], structuredContent: data };
}

export function registerPullTools(server: McpServer, octokit: Octokit): void {
  server.registerTool("github-pr-get", { title: "Get Pull Request", description: "Get a pull request by number", inputSchema: pullsSchema.prGetInput },
    async (args) => {
      const { owner, repo, pull_number } = pullsSchema.prGetInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.pulls.get({ owner, repo, pull_number })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-pr-list", { title: "List Pull Requests", description: "List pull requests for a repository", inputSchema: pullsSchema.prListInput },
    async (args) => {
      const params = pullsSchema.prListInput.parse(args);
      validateRepoInput(params.owner, params.repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.pulls.list({ owner: params.owner, repo: params.repo, state: params.state, sort: params.sort, direction: params.direction, per_page: params.per_page, page: params.page })));
        return jsonContent({ pull_requests: res.data });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-pr-create", { title: "Create Pull Request", description: "Create a new pull request", inputSchema: pullsSchema.prCreateInput },
    async (args) => {
      const body = pullsSchema.prCreateInput.parse(args);
      validateRepoInput(body.owner, body.repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.pulls.create({ owner: body.owner, repo: body.repo, title: body.title, head: body.head, base: body.base, body: body.body, draft: body.draft })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-pr-merge", { title: "Merge Pull Request", description: "Merge a pull request", inputSchema: pullsSchema.prMergeInput },
    async (args) => {
      const { owner, repo, pull_number, ...rest } = pullsSchema.prMergeInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.pulls.merge({ owner, repo, pull_number, ...rest })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-pr-review", { title: "Create PR Review", description: "Submit a pull request review", inputSchema: pullsSchema.prReviewInput },
    async (args) => {
      const { owner, repo, pull_number, event, body } = pullsSchema.prReviewInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.pulls.createReview({ owner, repo, pull_number, event, body })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
}
