# MCP Server tool list and GitHub API mapping

This document lists the **tools** provided by the GitHub Enterprise MCP Server and the **GitHub REST API** each tool calls.

---

## 1. Repositories

| MCP tool | Description | GitHub API (Octokit) | HTTP |
|----------|-------------|----------------------|------|
| `github-repo-get` | Get a repository by owner/name | `repos.get({ owner, repo })` | `GET /repos/{owner}/{repo}` |
| `github-repo-list` | List repositories for the authenticated user | `repos.listForAuthenticatedUser({ type, sort, direction, per_page, page })` | `GET /user/repos` |
| `github-repo-create` | Create a new repository | `repos.createForAuthenticatedUser({ name, description, private, auto_init })` | `POST /user/repos` |
| `github-repo-update` | Update repository settings | `repos.update({ owner, repo, name?, description?, private? })` | `PATCH /repos/{owner}/{repo}` |
| `github-repo-delete` | Delete a repository | `repos.delete({ owner, repo })` | `DELETE /repos/{owner}/{repo}` |

### Repo parameters summary

- **github-repo-get / update / delete:** `owner`, `repo` (required)
- **github-repo-list:** `type` (all|owner|public|private|member), `sort` (created|updated|pushed|full_name), `direction` (asc|desc), `per_page`, `page`
- **github-repo-create:** `name` (required), `description`, `private`, `auto_init`

---

## 2. Issues

| MCP tool | Description | GitHub API (Octokit) | HTTP |
|----------|-------------|----------------------|------|
| `github-issue-get` | Get an issue by number | `issues.get({ owner, repo, issue_number })` | `GET /repos/{owner}/{repo}/issues/{issue_number}` |
| `github-issue-list` | List issues for a repository | `issues.listForRepo({ owner, repo, state, sort, direction, per_page, page })` | `GET /repos/{owner}/{repo}/issues` |
| `github-issue-create` | Create a new issue | `issues.create({ owner, repo, title, body?, assignees?, labels?, milestone? })` | `POST /repos/{owner}/{repo}/issues` |
| `github-issue-update` | Update an issue | `issues.update({ owner, repo, issue_number, title?, body?, state?, assignees?, labels?, milestone? })` | `PATCH /repos/{owner}/{repo}/issues/{issue_number}` |
| `github-issue-close` | Close an issue | `issues.update({ owner, repo, issue_number, state: "closed" })` | `PATCH /repos/{owner}/{repo}/issues/{issue_number}` |
| `github-issue-comment` | Add a comment to an issue | `issues.createComment({ owner, repo, issue_number, body })` | `POST /repos/{owner}/{repo}/issues/{issue_number}/comments` |

### Issue parameters summary

- **Common:** `owner`, `repo` (required)
- **get/update/close/comment:** `issue_number` (required)
- **list:** `state` (open|closed|all), `sort` (created|updated|comments), `direction`, `per_page`, `page`
- **create:** `title` (required), `body`, `assignees[]`, `labels[]`, `milestone`
- **comment:** `body` (required)

---

## 3. Pull Requests

| MCP tool | Description | GitHub API (Octokit) | HTTP |
|----------|-------------|----------------------|------|
| `github-pr-get` | Get a PR by number | `pulls.get({ owner, repo, pull_number })` | `GET /repos/{owner}/{repo}/pulls/{pull_number}` |
| `github-pr-list` | List pull requests for a repository | `pulls.list({ owner, repo, state, sort, direction, per_page, page })` | `GET /repos/{owner}/{repo}/pulls` |
| `github-pr-create` | Create a new pull request | `pulls.create({ owner, repo, title, head, base, body?, draft? })` | `POST /repos/{owner}/{repo}/pulls` |
| `github-pr-merge` | Merge a pull request | `pulls.merge({ owner, repo, pull_number, commit_title?, commit_message?, merge_method? })` | `PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge` |
| `github-pr-review` | Submit a PR review | `pulls.createReview({ owner, repo, pull_number, event, body? })` | `POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews` |

### PR parameters summary

- **Common:** `owner`, `repo` (required)
- **get/list/merge/review:** `pull_number` (required)
- **list:** `state` (open|closed|all), `sort` (created|updated|popularity|long-running), `direction`, `per_page`, `page`
- **create:** `title`, `head`, `base` (required), `body`, `draft`
- **merge:** `merge_method` (merge|squash|rebase), `commit_title`, `commit_message`
- **review:** `event` (APPROVE|REQUEST_CHANGES|COMMENT) (required), `body`

---

## 4. Branches

| MCP tool | Description | GitHub API (Octokit) | HTTP |
|----------|-------------|----------------------|------|
| `github-branch-list` | List branches for a repository | `repos.listBranches({ owner, repo, per_page, page })` | `GET /repos/{owner}/{repo}/branches` |
| `github-branch-get` | Get a branch by name | `repos.getBranch({ owner, repo, branch })` | `GET /repos/{owner}/{repo}/branches/{branch}` |
| `github-branch-create` | Create a branch (reference) | `git.createRef({ owner, repo, ref: "refs/heads/...", sha })` | `POST /repos/{owner}/{repo}/git/refs` |
| `github-branch-delete` | Delete a branch (reference) | `git.deleteRef({ owner, repo, ref: "refs/heads/..." })` | `DELETE /repos/{owner}/{repo}/git/refs/heads/{ref}` |

### Branch parameters summary

- **Common:** `owner`, `repo` (required)
- **get:** `branch` (required)
- **list:** `per_page`, `page`
- **create:** `ref` (branch name or `refs/heads/<name>`), `sha` (required)
- **delete:** `ref` (branch name or `refs/heads/<name>`)

---

## 5. Commits

| MCP tool | Description | GitHub API (Octokit) | HTTP |
|----------|-------------|----------------------|------|
| `github-commit-get` | Get a commit by SHA or ref | `repos.getCommit({ owner, repo, ref })` | `GET /repos/{owner}/{repo}/commits/{ref}` |
| `github-commit-list` | List commits for a repository | `repos.listCommits({ owner, repo, sha?, path?, per_page, page })` | `GET /repos/{owner}/{repo}/commits` |
| `github-commit-compare` | Compare two commits | `repos.compareCommits({ owner, repo, base, head })` | `GET /repos/{owner}/{repo}/compare/{base}...{head}` |

### Commit parameters summary

- **Common:** `owner`, `repo` (required)
- **get:** `ref` (SHA or branch/tag etc.) (required)
- **list:** `sha` (branch/SHA), `path`, `per_page`, `page`
- **compare:** `base`, `head` (required)

---

## 6. Contents (repository files)

| MCP tool | Description | GitHub API (Octokit) | HTTP |
|----------|-------------|----------------------|------|
| `github-contents-get` | Get file or directory contents | `repos.getContent({ owner, repo, path, ref? })` | `GET /repos/{owner}/{repo}/contents/{path}` |
| `github-contents-create-or-update` | Create or update a single file (commit) | `repos.createOrUpdateFileContents({ owner, repo, path, message, content, sha?, branch? })` | `PUT /repos/{owner}/{repo}/contents/{path}` |
| `github-contents-delete` | Delete a file (commit) | `repos.deleteFile({ owner, repo, path, message, sha, branch? })` | `DELETE /repos/{owner}/{repo}/contents/{path}` |

### Contents parameters summary

- **Common:** `owner`, `repo` (required)
- **get:** `path` (required), `ref` (branch/tag/SHA, optional, default branch)
- **create-or-update:** `path`, `message`, `content` (required; UTF-8 text, sent as base64), `sha` (required when updating), `branch` (optional)
- **delete:** `path`, `message`, `sha` (required), `branch` (optional)

---

## 7. Git (low-level: commit, ref, tag)

| MCP tool | Description | GitHub API (Octokit) | HTTP |
|----------|-------------|----------------------|------|
| `github-commit-create` | Create a commit with multiple file changes and update branch | `git.getRef` → `git.getCommit` → `git.createBlob` (per file) → `git.createTree` → `git.createCommit` → `git.updateRef` | `POST /repos/.../git/...` (multiple) |
| `github-ref-update` | Update a ref (e.g. push branch to a commit SHA) | `git.updateRef({ ref: "heads/...", sha, force? })` | `PATCH /repos/{owner}/{repo}/git/refs/{ref}` |
| `github-tag-list` | List tags | `repos.listTags({ owner, repo, per_page, page })` | `GET /repos/{owner}/{repo}/tags` |
| `github-tag-create` | Create an annotated tag | `git.createTag` + `git.createRef("refs/tags/...")` | `POST /repos/.../git/tags`, `POST /repos/.../git/refs` |

### Git parameters summary

- **Common:** `owner`, `repo` (required)
- **commit-create:** `message`, `branch`, `files[]` (required; each: `path`, `content`, `mode?` 100644|100755|040000)
- **ref-update:** `ref` (e.g. `main`, `heads/main`, or `refs/heads/main`), `sha` (required), `force` (optional)
- **tag-list:** `per_page`, `page`
- **tag-create:** `tag`, `message`, `object` (commit SHA) (required), `type` (commit|tree|blob, optional)

---

## Reference

- GitHub REST API docs: [REST API - GitHub Docs](https://docs.github.com/en/rest)
- This server calls the above APIs using your **GitHub Enterprise** endpoint (`https://<your-ghe>/api/v3`) and **Personal Access Token**.
