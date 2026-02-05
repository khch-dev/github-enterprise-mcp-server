import type { Octokit } from "octokit";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as issuesSchema from "../schemas/issues.js";
import { validateRepoInput } from "../utils/validators.js";
import { withRetry } from "../utils/retry.js";
import { withTimeout } from "../utils/timeout.js";
import { formatForMcp } from "../utils/error-handler.js";
import { truncateIfNeeded } from "../utils/response-handler.js";

function jsonContent(data: unknown): { content: [{ type: "text"; text: string }]; structuredContent?: unknown } {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text: truncateIfNeeded(text) }], structuredContent: data };
}

export function registerIssueTools(server: McpServer, octokit: Octokit): void {
  server.registerTool("github-issue-get", { title: "Get Issue", description: "Get an issue by number", inputSchema: issuesSchema.issueGetInput },
    async (args) => {
      const { owner, repo, issue_number } = issuesSchema.issueGetInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.issues.get({ owner, repo, issue_number })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-issue-list", { title: "List Issues", description: "List issues for a repository", inputSchema: issuesSchema.issueListInput },
    async (args) => {
      const params = issuesSchema.issueListInput.parse(args);
      validateRepoInput(params.owner, params.repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.issues.listForRepo({ owner: params.owner, repo: params.repo, state: params.state, sort: params.sort, direction: params.direction, per_page: params.per_page, page: params.page })));
        return jsonContent({ issues: res.data });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-issue-create", { title: "Create Issue", description: "Create a new issue", inputSchema: issuesSchema.issueCreateInput },
    async (args) => {
      const body = issuesSchema.issueCreateInput.parse(args);
      validateRepoInput(body.owner, body.repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.issues.create({ owner: body.owner, repo: body.repo, title: body.title, body: body.body, assignees: body.assignees, labels: body.labels, milestone: body.milestone })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-issue-update", { title: "Update Issue", description: "Update an issue", inputSchema: issuesSchema.issueUpdateInput },
    async (args) => {
      const { owner, repo, issue_number, ...rest } = issuesSchema.issueUpdateInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.issues.update({ owner, repo, issue_number, ...rest })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-issue-close", { title: "Close Issue", description: "Close an issue", inputSchema: issuesSchema.issueUpdateInput },
    async (args) => {
      const { owner, repo, issue_number } = issuesSchema.issueUpdateInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.issues.update({ owner, repo, issue_number, state: "closed" })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-issue-comment", { title: "Comment on Issue", description: "Add a comment to an issue", inputSchema: issuesSchema.issueCommentInput },
    async (args) => {
      const { owner, repo, issue_number, body } = issuesSchema.issueCommentInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.issues.createComment({ owner, repo, issue_number, body })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
}
