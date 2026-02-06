import type { Octokit } from "octokit";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as gitSchema from "../schemas/git.js";
import { validateRepoInput, validateBranchName, validateTagName } from "../utils/validators.js";
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

/** For getRef: full ref name (e.g. refs/heads/main) */
function normalizeRef(ref: string): string {
  const r = ref.trim();
  if (r.startsWith("refs/")) return r;
  if (r.includes("/")) return `refs/${r}`;
  return `refs/heads/${r}`;
}

/** For updateRef: ref path without "refs/" prefix (e.g. heads/main) */
function refPathForUpdate(ref: string): string {
  const r = ref.trim();
  if (r.startsWith("refs/")) return r.slice(5);
  if (r.includes("/")) return r;
  return `heads/${r}`;
}

function refToPath(ref: string): string {
  const r = ref.trim();
  if (r.startsWith("refs/")) return r;
  if (r.includes("/")) return `refs/heads/${r}`;
  return `refs/heads/${r}`;
}

/** Call getRef; on 404 try short ref (heads/main) for GHE compatibility */
async function getRefForBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<{ sha: string }> {
  const refPath = refToPath(branch);
  try {
    const { data } = await withRetry(() =>
      withTimeout(octokit.rest.git.getRef({ owner, repo, ref: refPath }))
    );
    return { sha: (data.object as { sha: string }).sha };
  } catch (err: unknown) {
    const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : 0;
    if (status === 404) {
      const shortRef = refPath.startsWith("refs/") ? refPath.slice(5) : refPath;
      const { data } = await withRetry(() =>
        withTimeout(octokit.rest.git.getRef({ owner, repo, ref: shortRef }))
      );
      return { sha: (data.object as { sha: string }).sha };
    }
    throw err;
  }
}

export function registerGitTools(server: McpServer, octokit: Octokit): void {
  server.registerTool(
    "github-commit-create",
    {
      title: "Create a commit with file changes",
      description: "Create a new commit with one or more file changes and update the branch (like commit + push)",
      inputSchema: gitSchema.commitCreateInput,
    },
    async (args) => {
      const { owner, repo, message, branch, files } = gitSchema.commitCreateInput.parse(args);
      validateRepoInput(owner, repo);
      validateBranchName(branch);
      try {
        const { sha: parentSha } = await getRefForBranch(octokit, owner, repo, branch);

        const { data: parentCommit } = await withRetry(() =>
          withTimeout(octokit.rest.git.getCommit({ owner, repo, commit_sha: parentSha }))
        );
        const baseTreeSha = parentCommit.tree.sha;

        const blobShas: { path: string; sha: string; mode: string }[] = [];
        for (const f of files) {
          const { data: blob } = await withRetry(() =>
            withTimeout(
              octokit.rest.git.createBlob({
                owner,
                repo,
                content: toBase64(f.content),
                encoding: "base64",
              })
            )
          );
          blobShas.push({ path: f.path, sha: blob.sha, mode: f.mode });
        }

        const tree = blobShas.map(({ path, sha, mode }) => ({ path, sha, mode: mode as "100644" | "100755" | "040000" }));
        const { data: treeData } = await withRetry(() =>
          withTimeout(
            octokit.rest.git.createTree({
              owner,
              repo,
              tree,
              base_tree: baseTreeSha,
            })
          )
        );

        const { data: commitData } = await withRetry(() =>
          withTimeout(
            octokit.rest.git.createCommit({
              owner,
              repo,
              message,
              tree: treeData.sha,
              parents: [parentSha],
            })
          )
        );

        const updateRefPath = refPathForUpdate(branch);
        await withRetry(() =>
          withTimeout(
            octokit.rest.git.updateRef({
              owner,
              repo,
              ref: updateRefPath,
              sha: commitData.sha,
            })
          )
        );

        return jsonContent({ commit: commitData, ref: refToPath(branch) });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    }
  );

  server.registerTool(
    "github-ref-update",
    {
      title: "Update a reference (push a commit to a branch)",
      description: "Update a branch or tag reference to point to a commit SHA",
      inputSchema: gitSchema.refUpdateInput,
    },
    async (args) => {
      const { owner, repo, ref, sha, force } = gitSchema.refUpdateInput.parse(args);
      validateRepoInput(owner, repo);
      const refPath = refPathForUpdate(ref);
      try {
        const res = await withRetry(() =>
          withTimeout(
            octokit.rest.git.updateRef({
              owner,
              repo,
              ref: refPath,
              sha,
              force,
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
    "github-tag-list",
    {
      title: "List tags",
      description: "List tags for a repository",
      inputSchema: gitSchema.tagListInput,
    },
    async (args) => {
      const params = gitSchema.tagListInput.parse(args);
      validateRepoInput(params.owner, params.repo);
      try {
        const res = await withRetry(() =>
          withTimeout(
            octokit.rest.repos.listTags({
              owner: params.owner,
              repo: params.repo,
              per_page: params.per_page,
              page: params.page,
            })
          )
        );
        return jsonContent({ tags: res.data });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    }
  );

  server.registerTool(
    "github-tag-create",
    {
      title: "Create a tag",
      description: "Create an annotated tag object and reference (e.g. v1.0.0)",
      inputSchema: gitSchema.tagCreateInput,
    },
    async (args) => {
      const { owner, repo, tag, message, object, type } = gitSchema.tagCreateInput.parse(args);
      validateRepoInput(owner, repo);
      validateTagName(tag);
      try {
        const { data: tagObj } = await withRetry(() =>
          withTimeout(
            octokit.rest.git.createTag({
              owner,
              repo,
              tag,
              message,
              object,
              type,
            })
          )
        );
        const refTag = tag.startsWith("refs/tags/") ? tag : `refs/tags/${tag}`;
        await withRetry(() =>
          withTimeout(
            octokit.rest.git.createRef({
              owner,
              repo,
              ref: refTag,
              sha: tagObj.sha,
            })
          )
        );
        return jsonContent({ tag: tagObj, ref: refTag });
      } catch (e) {
        return { content: [{ type: "text", text: formatForMcp(e) }], isError: true };
      }
    }
  );
}
