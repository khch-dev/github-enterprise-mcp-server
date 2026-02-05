import type { Octokit } from "octokit";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as branchesSchema from "../schemas/branches.js";
import { validateRepoInput, validateBranchName } from "../utils/validators.js";
import { withRetry } from "../utils/retry.js";
import { withTimeout } from "../utils/timeout.js";
import { formatForMcp } from "../utils/error-handler.js";
import { truncateIfNeeded } from "../utils/response-handler.js";

function jsonContent(data: unknown): { content: [{ type: "text"; text: string }]; structuredContent?: unknown } {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text: truncateIfNeeded(text) }], structuredContent: data };
}

export function registerBranchTools(server: McpServer, octokit: Octokit): void {
  server.registerTool("github-branch-list", { title: "List Branches", description: "List branches for a repository", inputSchema: branchesSchema.branchListInput },
    async (args) => {
      const params = branchesSchema.branchListInput.parse(args);
      validateRepoInput(params.owner, params.repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.repos.listBranches({ owner: params.owner, repo: params.repo, per_page: params.per_page, page: params.page })));
        return jsonContent({ branches: res.data });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-branch-get", { title: "Get Branch", description: "Get a branch by name", inputSchema: branchesSchema.branchGetInput },
    async (args) => {
      const { owner, repo, branch } = branchesSchema.branchGetInput.parse(args);
      validateRepoInput(owner, repo);
      validateBranchName(branch);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.repos.getBranch({ owner, repo, branch })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-branch-create", { title: "Create Branch", description: "Create a branch (reference)", inputSchema: branchesSchema.branchCreateInput },
    async (args) => {
      const { owner, repo, ref, sha } = branchesSchema.branchCreateInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() => withTimeout(octokit.rest.git.createRef({ owner, repo, ref: ref.startsWith("refs/") ? ref : `refs/heads/${ref}`, sha })));
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
  server.registerTool("github-branch-delete", { title: "Delete Branch", description: "Delete a branch reference", inputSchema: branchesSchema.branchDeleteInput },
    async (args) => {
      const { owner, repo, ref } = branchesSchema.branchDeleteInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const refFull = ref.startsWith("refs/") ? ref : `refs/heads/${ref}`;
        await withRetry(() => withTimeout(octokit.rest.git.deleteRef({ owner, repo, ref: refFull })));
        return jsonContent({ deleted: true, owner, repo, ref: refFull });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    });
}
