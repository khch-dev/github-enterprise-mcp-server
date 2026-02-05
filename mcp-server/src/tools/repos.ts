import type { Octokit } from "octokit";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as reposSchema from "../schemas/repos.js";
import { validateRepoInput } from "../utils/validators.js";
import { withRetry } from "../utils/retry.js";
import { withTimeout } from "../utils/timeout.js";
import { formatForMcp } from "../utils/error-handler.js";
import { truncateIfNeeded } from "../utils/response-handler.js";

function jsonContent(data: unknown): { content: [{ type: "text"; text: string }]; structuredContent?: unknown } {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const out: { content: [{ type: "text"; text: string }]; structuredContent?: unknown } = {
    content: [{ type: "text", text: truncateIfNeeded(text) }],
  };
  if (data != null && typeof data === "object" && !Array.isArray(data)) {
    out.structuredContent = data;
  }
  return out;
}

export function registerRepoTools(server: McpServer, octokit: Octokit): void {
  server.registerTool("github-repo-get", { title: "Get Repository", description: "Get a repository by owner and name", inputSchema: reposSchema.repoGetInput },
    async (args) => {
      const { owner, repo } = reposSchema.repoGetInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.repos.get({ owner, repo })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-repo-list", { title: "List Repositories", description: "List repositories for the authenticated user", inputSchema: reposSchema.repoListInput },
    async (args) => {
      const params = reposSchema.repoListInput.parse(args);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.repos.listForAuthenticatedUser({ type: params.type, sort: params.sort, direction: params.direction, per_page: params.per_page, page: params.page })));
        return jsonContent({ repositories: res.data });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-repo-create", { title: "Create Repository", description: "Create a new repository", inputSchema: reposSchema.repoCreateInput },
    async (args) => {
      const body = reposSchema.repoCreateInput.parse(args);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.repos.createForAuthenticatedUser({ name: body.name, description: body.description, private: body.private, auto_init: body.auto_init })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-repo-update", { title: "Update Repository", description: "Update a repository", inputSchema: reposSchema.repoUpdateInput },
    async (args) => {
      const { owner, repo, ...rest } = reposSchema.repoUpdateInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.repos.update({ owner, repo, ...rest })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-repo-delete", { title: "Delete Repository", description: "Delete a repository", inputSchema: reposSchema.repoDeleteInput },
    async (args) => {
      const { owner, repo } = reposSchema.repoDeleteInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        await withRetry(() => withTimeout(octokit.rest.repos.delete({ owner, repo })));
        return jsonContent({ deleted: true, owner, repo });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
}
