import type { Octokit } from "octokit";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as contentsSchema from "../schemas/contents.js";
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

function toBase64(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

export function registerContentsTools(server: McpServer, octokit: Octokit): void {
  server.registerTool(
    "github-contents-get",
    {
      title: "Get file or directory contents",
      description: "Get the contents of a file or directory in a repository",
      inputSchema: contentsSchema.contentsGetInput,
    },
    async (args) => {
      const { owner, repo, path, ref } = contentsSchema.contentsGetInput.parse(args);
      validateRepoInput(owner, repo);
      try {
        const res = await withRetry(() =>
          withTimeout(
            octokit.rest.repos.getContent({
              owner,
              repo,
              path,
              ...(ref != null && ref !== "" ? { ref } : {}),
            })
          )
        );
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    }
  );

  server.registerTool(
    "github-contents-create-or-update",
    {
      title: "Create or update a file",
      description: "Create or update a single file in a repository (commits the change)",
      inputSchema: contentsSchema.contentsCreateOrUpdateInput,
    },
    async (args) => {
      const body = contentsSchema.contentsCreateOrUpdateInput.parse(args);
      validateRepoInput(body.owner, body.repo);
      try {
        const res = await withRetry(() =>
          withTimeout(
            octokit.rest.repos.createOrUpdateFileContents({
              owner: body.owner,
              repo: body.repo,
              path: body.path,
              message: body.message,
              content: toBase64(body.content),
              ...(body.sha != null && body.sha !== "" ? { sha: body.sha } : {}),
              ...(body.branch != null && body.branch !== "" ? { branch: body.branch } : {}),
            })
          )
        );
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    }
  );

  server.registerTool(
    "github-contents-delete",
    {
      title: "Delete a file",
      description: "Delete a file from a repository (commits the change)",
      inputSchema: contentsSchema.contentsDeleteInput,
    },
    async (args) => {
      const body = contentsSchema.contentsDeleteInput.parse(args);
      validateRepoInput(body.owner, body.repo);
      try {
        const res = await withRetry(() =>
          withTimeout(
            octokit.rest.repos.deleteFile({
              owner: body.owner,
              repo: body.repo,
              path: body.path,
              message: body.message,
              sha: body.sha,
              ...(body.branch != null && body.branch !== "" ? { branch: body.branch } : {}),
            })
          )
        );
        return jsonContent(res.data);
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    }
  );
}
