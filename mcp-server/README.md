# GitHub Enterprise MCP Server

MCP server for the GitHub Enterprise API. Use with Claude Desktop or any MCP client. **Local/internal use only.** No authentication info is included in the package.

## Installation

```bash
npm install github-enterprise-mcp-server
```

Or run directly with npx (no install):

```bash
npx github-enterprise-mcp-server --endpoint https://your-ghe.example.com/api/v3 --token ghp_YOUR_TOKEN
```

## MCP server configuration

To use this server from an MCP client (Claude Desktop, Cursor, etc.), you need the **endpoint (HTTPS)** and a **Personal Access Token**.

---

### 1. Claude Desktop

Config file location (by OS):

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**Example 1 – npx with env vars (recommended; token not visible in process list):**

```json
{
  "mcpServers": {
    "github-enterprise": {
      "command": "npx",
      "args": ["-y", "github-enterprise-mcp-server"],
      "env": {
        "GITHUB_ENTERPRISE_ENDPOINT": "https://your-ghe.example.com/api/v3",
        "GITHUB_ENTERPRISE_TOKEN": "ghp_YOUR_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

> **Note:** Including `-y` in `args` makes npx run without prompting. **Always use `-y`** so Cursor does not time out waiting for the MCP server.

**Example 2 – local build with args:**

```json
{
  "mcpServers": {
    "github-enterprise": {
      "command": "node",
      "args": [
        "/absolute/path/to/github-enterprise-mcp-server/dist/index.js",
        "--endpoint", "https://your-ghe.example.com/api/v3",
        "--token", "ghp_YOUR_TOKEN"
      ]
    }
  }
}
```

---

### 2. Cursor

Config file location:

- **User global:** `~/.cursor/mcp.json` (macOS/Linux) or `%USERPROFILE%\.cursor\mcp.json` (Windows)
- **Per project:** `.cursor/mcp.json` in the project root

**Example – npx with env vars (recommended):**

```json
{
  "mcpServers": {
    "github-enterprise": {
      "command": "npx",
      "args": ["-y", "github-enterprise-mcp-server"],
      "env": {
        "GITHUB_ENTERPRISE_ENDPOINT": "https://your-ghe.example.com/api/v3",
        "GITHUB_ENTERPRISE_TOKEN": "ghp_YOUR_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

> **Important:** Without `-y`, npx may prompt for install confirmation and Cursor may fail to start the MCP server in time.

**Example – run from a local clone of this repo:**

```json
{
  "mcpServers": {
    "github-enterprise": {
      "command": "node",
      "args": [
        "/path/to/github_ent_mcp_server/mcp-server/dist/index.js",
        "--endpoint", "https://your-ghe.example.com/api/v3",
        "--token", "ghp_YOUR_TOKEN"
      ]
    }
  }
}
```

After restarting Cursor, the MCP server list should show `github-enterprise` if configured correctly.

#### Troubleshooting: MCP not working in Cursor after npm install

- **1) Use `-y` with npx**  
  Set `args` to `["-y", "github-enterprise-mcp-server"]`. Without `-y`, npx may prompt and the MCP connection can time out.

- **2) Env vars not passed**  
  Some clients may not pass `env` to the child process. In that case pass options **on the command line** (token will be visible in config and process list; use with care):
  ```json
  "command": "npx",
  "args": [
    "-y", "github-enterprise-mcp-server",
    "--endpoint", "https://your-ghe.example.com/api/v3",
    "--token", "ghp_YOUR_TOKEN"
  ]
  ```

- **3) Test in terminal**  
  Run with the same config in a terminal to see errors (endpoint format, token format, HTTPS, etc.):
  ```bash
  GITHUB_ENTERPRISE_ENDPOINT="https://your-ghe.example.com/api/v3" GITHUB_ENTERPRISE_TOKEN="ghp_..." npx -y github-enterprise-mcp-server
  ```

- **4) Config file location**  
  Cursor reads only the **user global** `~/.cursor/mcp.json` or the **project root** `.cursor/mcp.json`. Check path and JSON syntax (commas, quotes).

- **5) Timeout exceeded / connection cancelled**  
  Cursor kills the MCP process if it does not start in time. Startup validation (GitHub API `/user`) has a **default 60s** timeout. To increase it, set e.g. `GITHUB_ENTERPRISE_STARTUP_VALIDATION_TIMEOUT_MS=90000` (milliseconds) in `env`. If Cursor still times out, run the server via **local install**: `npm install -g github-enterprise-mcp-server`, then use `command`: `"node"`, `args`: `["$(npm root -g)/github-enterprise-mcp-server/dist/index.js", ...]`.

---

### 3. Other MCP clients

Add an entry under `mcpServers` in the same shape:

- **command:** `node` or `npx`
- **args:** `["path-or-package-name", "--endpoint", "https://...", "--token", "ghp_..."]`  
  Or just the package name: `["github-enterprise-mcp-server"]`
- **env (recommended):** Pass `GITHUB_ENTERPRISE_ENDPOINT` and `GITHUB_ENTERPRISE_TOKEN` so the token is not on the command line.

**Security:** If the token is stored in a config file, add that file to `.gitignore` and do not commit it.

## Security

- **HTTPS only:** HTTP endpoints are rejected.
- **Token format:** Tokens must match GitHub token format (`ghp_`, `ghs_`, etc.).
- **Startup validation:** The server validates endpoint and token before starting (calls `/user`). Default timeout for this call is 60s; set `GITHUB_ENTERPRISE_STARTUP_VALIDATION_TIMEOUT_MS` (milliseconds) to increase it.
- **Recommended scopes:** `repo`, `read:org`. The server runs even without these; it only prints a warning if scopes are missing. `read:org` is only needed for org-related APIs; for repos/issues/PRs, `repo` is enough. Set `GITHUB_ENTERPRISE_SKIP_SCOPE_WARNING=1` or `true` to hide the warning.
- **Self-signed certificates:** Disabled by default. Enable with `--allow-self-signed-cert` or `ALLOW_SELF_SIGNED_CERT=true` (logs a security warning).
- **Debug logs:** Normal startup/shutdown messages are not written to stderr (so Cursor won't show them as `[error]`). Set `GITHUB_ENTERPRISE_DEBUG=1` or `DEBUG=1` to see e.g. "Registered N tools", "running on stdio".

## If your token is compromised

1. Revoke the token immediately in GitHub Enterprise (Settings → Developer settings → Personal access tokens).
2. Create a new token and update your config.
3. Check audit logs for unauthorized access.

## Available tools

- **Repositories:** `github-repo-get`, `github-repo-list`, `github-repo-create`, `github-repo-update`, `github-repo-delete`
- **Issues:** `github-issue-get`, `github-issue-list`, `github-issue-create`, `github-issue-update`, `github-issue-close`, `github-issue-comment`
- **Pull requests:** `github-pr-get`, `github-pr-list`, `github-pr-create`, `github-pr-merge`, `github-pr-review`
- **Branches:** `github-branch-list`, `github-branch-get`, `github-branch-create`, `github-branch-delete`
- **Commits:** `github-commit-get`, `github-commit-list`, `github-commit-compare`
- **Contents (repository files):** `github-contents-get`, `github-contents-create-or-update`, `github-contents-delete`
- **Git (low-level):** `github-commit-create`, `github-ref-update`, `github-tag-list`, `github-tag-create`

Full tool list and GitHub API mapping: [docs/tools-and-api.md](../docs/tools-and-api.md).

## Publishing to npm

How to publish the package to an npm registry.

### Versioning

npm uses **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH` (e.g. `1.0.0`).

| Type    | When to bump | Example        |
|---------|----------------|----------------|
| **MAJOR** | Breaking changes (API removal/behavior change) | `1.0.0` → `2.0.0` |
| **MINOR** | New backward-compatible features       | `1.0.0` → `1.1.0` |
| **PATCH** | Backward-compatible bug fixes          | `1.0.0` → `1.0.1` |

**Bumping version** (updates `version` in `package.json` and Git tag):

```bash
# Patch (1.0.0 → 1.0.1) – bug fixes
npm version patch

# Minor (1.0.0 → 1.1.0) – new features
npm version minor

# Major (1.0.0 → 2.0.0) – breaking changes
npm version major
```

- Use `-m "message"` with `npm version` to set the Git commit message, e.g. `npm version patch -m "Fix retry timeout"`.
- With a Git repo, `npm version patch` creates a commit and tag (e.g. `v1.0.1`). Use `--no-git-tag-version` to only update `package.json` without committing or tagging.

### 1. Pre-publish checklist

```bash
cd mcp-server
npm run build
npm run audit
```

- The `files` field in `package.json` includes only `dist` and `README.md`; source and tests are not published.
- On the public npm registry, the **package name must be globally unique**. If `github-enterprise-mcp-server` is already taken, use a scoped name like `@your-org/github-enterprise-mcp-server`.

### 2. Publish to the public npm (npmjs.com)

1. **npm account:** Sign up at [https://www.npmjs.com/signup](https://www.npmjs.com/signup).
2. **Log in** (once per machine):

   ```bash
   npm login
   ```
   Enter username, password, email, and OTP if enabled.

3. **Check name availability** (optional):

   ```bash
   npm search github-enterprise-mcp-server
   ```
   If the name exists, change `name` in `package.json` or publish as a scoped package.

4. **Publish:**

   ```bash
   npm publish
   ```

   - **Scoped packages** (e.g. for an org): set `"name": "@your-org/github-enterprise-mcp-server"`, then:
     - Private: `npm publish --access restricted`
     - Public: `npm publish --access public`

### 3. Private / internal registry

For an internal registry (e.g. Nexus, Verdaccio, GitHub Packages, Azure Artifacts):

1. **Set registry URL:**

   ```bash
   npm config set registry https://your-registry.company.com/npm/
   ```

   Or in `package.json` for this project only:

   ```json
   "publishConfig": {
     "registry": "https://your-registry.company.com/npm/"
   }
   ```

2. **Authentication** (depends on the registry):

   - Configure token or credentials in `.npmrc` (see registry docs).
   - Example: `//your-registry.company.com/npm/:_authToken=YOUR_TOKEN`

3. **Publish:**

   ```bash
   npm publish
   ```

After publishing:

- Public npm: `npm install github-enterprise-mcp-server` or `npx github-enterprise-mcp-server ...`
- Internal registry: set registry and auth, then use `npm install` / `npx` as usual.

## Build

```bash
npm run build
```

## Data and retention

This server does not store any persistent data. All requests go to the GitHub Enterprise API using the credentials you provide.
