import type { Octokit } from "octokit";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerRepoTools } from "./tools/repos.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerPullTools } from "./tools/pulls.js";
import { registerBranchTools } from "./tools/branches.js";
import { registerCommitTools } from "./tools/commits.js";
import { registerContentsTools } from "./tools/contents.js";
import { registerGitTools } from "./tools/git.js";

const SERVER_INSTRUCTIONS = `This MCP server provides access to GitHub Enterprise API.

Available capabilities:
- Repository management (create, read, update, delete repositories)
- Issue tracking (create, update, comment on issues)
- Pull request workflows (create, review, merge PRs)
- Branch and commit operations
- Repository contents (get, create/update, delete files)
- Git low-level (create commit with multiple files, update ref, list/create tags)
- GitHub Actions management

Authentication: Requires GitHub Enterprise endpoint URL and Personal Access Token.
Rate limits apply based on your GitHub Enterprise configuration.`;

const SHUTDOWN_TIMEOUT_MS = 10000;

function isDebug(): boolean {
  const v = process.env.GITHUB_ENTERPRISE_DEBUG ?? process.env.DEBUG;
  return v === "1" || v === "true";
}

export async function runServer(octokit: Octokit): Promise<void> {
  const server = new McpServer(
    {
      name: "github-enterprise-mcp-server",
      version: "1.0.5",
    },
    { instructions: SERVER_INSTRUCTIONS }
  );

  registerRepoTools(server, octokit);
  registerIssueTools(server, octokit);
  registerPullTools(server, octokit);
  registerBranchTools(server, octokit);
  registerCommitTools(server, octokit);
  registerContentsTools(server, octokit);
  registerGitTools(server, octokit);
  const toolCount = 5 + 6 + 5 + 4 + 3 + 3 + 4; // repos, issues, pulls, branches, commits, contents(3), git(4)
  if (isDebug()) process.stderr.write(`Registered ${toolCount} tools.\n`);

  let shutdownTimeout: ReturnType<typeof setTimeout> | undefined;
  const shutdown = (): void => {
    if (isDebug()) process.stderr.write("Shutting down gracefully...\n");
    clearTimeout(shutdownTimeout);
    server.close().then(
      () => process.exit(0),
      () => process.exit(1)
    );
    // If close() doesn't finish in time, force exit (e.g. Cursor disconnected)
    shutdownTimeout = setTimeout(() => {
      if (isDebug()) process.stderr.write("Shutdown timeout exceeded, exiting.\n");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    if (isDebug()) process.stderr.write("GitHub Enterprise MCP Server running on stdio.\n");
  } catch (err) {
    process.stderr.write(String(err) + "\n");
    process.exit(1);
  }
}
