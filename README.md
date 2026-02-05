# GitHub Enterprise MCP Server

An **MCP (Model Context Protocol) server** for the GitHub Enterprise API. Use it with Claude Desktop, Cursor, or any MCP client to view and manage repositories, issues, PRs, branches, and commits.

## Features

- **GitHub Enterprise only** – Supports self-hosted GitHub Enterprise API
- **MCP standard** – [Model Context Protocol](https://modelcontextprotocol.io/) based tools
- **HTTPS and token validation** – Endpoint and token format checks, plus startup auth validation
- **No credentials in package** – No authentication info shipped (suitable for local/internal use)

## Project structure

```
.
├── README.md           # This file (repository overview)
├── .gitignore
├── docs/               # Project documentation
│   └── tools-and-api.md   # MCP tool list and GitHub API mapping
└── mcp-server/         # MCP server package
    ├── README.md       # Installation, configuration, tools, publishing
    ├── package.json
    └── src/
```

For **installation, MCP setup (Claude Desktop / Cursor), available tools, security, and npm publishing**, see **[mcp-server/README.md](./mcp-server/README.md)**.

## Quick start

### Requirements

- Node.js 18+
- GitHub Enterprise **endpoint (HTTPS)** and **Personal Access Token**

### Install and run

```bash
cd mcp-server
npm install
npm run build
```

Run (environment variables recommended):

```bash
export GITHUB_ENTERPRISE_ENDPOINT="https://your-ghe.example.com/api/v3"
export GITHUB_ENTERPRISE_TOKEN="ghp_YOUR_TOKEN"
node dist/index.js
```

Or run without installing (npx):

```bash
npx -y github-enterprise-mcp-server --endpoint https://your-ghe.example.com/api/v3 --token ghp_YOUR_TOKEN
```

The **tool list** and **GitHub API** mapping are documented in [docs/tools-and-api.md](./docs/tools-and-api.md). For setup and usage, see [mcp-server/README.md](./mcp-server/README.md).

## Security

- **HTTPS only** – Only HTTPS endpoints are accepted.
- **Token format** – Tokens must match GitHub format (`ghp_`, `ghs_`, etc.).
- **No data sent elsewhere** – The server sends data **only** to the GitHub endpoint you configure. It does not transmit any data to other servers or third parties.
- Prefer **environment variables** for the token; avoid putting it in config files.
- If a token is compromised, revoke it in GitHub Enterprise immediately and create a new one.

## npm package name (publishing to the public registry)

The name **`github-enterprise-mcp-server`** is already registered on the [public npm registry (npmjs.com)](https://www.npmjs.com/). To **publish this repository to npmjs.com under a different listing**, you must use a **different package name**.

- **Recommended:** Use a scoped package — change `name` in `package.json` to e.g. `@<org-or-username>/github-enterprise-mcp-server`, then run `npm publish --access public`.
- Or use another globally unique name (e.g. `github-enterprise-mcp-server-ghe`, `your-org-mcp-github`).

Publishing with the same name will result in an npm "package name already exists" error.

## Development

All development for this project was done **100%** using:

- **[BMAD Method](https://docs.bmad-method.org/)** – Breakthrough Method of Agile AI Driven Development; AI-driven framework with guided workflows and agents
- **[Cursor](https://cursor.com)** – AI-first code editor

## License

MIT
