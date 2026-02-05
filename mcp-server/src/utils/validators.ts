/**
 * GitHub-specific input validation (after Zod, before API call).
 */

const REPO_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;
const REPO_NAME_MAX_LEN = 100;
const INVALID_BRANCH_CHARS = /[\s.~^:?*\[\]\\]|\x00-\x1f/;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateRepoName(name: string): void {
  if (typeof name !== "string" || name.length === 0) throw new ValidationError("Repository name is required");
  if (name.length > REPO_NAME_MAX_LEN) throw new ValidationError(`Repository name must be at most ${REPO_NAME_MAX_LEN} characters`);
  if (name.startsWith(".") || name.endsWith(".")) throw new ValidationError("Repository name cannot start or end with a period");
  if (!REPO_NAME_REGEX.test(name)) throw new ValidationError("Repository name can only contain letters, numbers, and ._-");
}

export function validateOwner(owner: string): void {
  if (typeof owner !== "string" || owner.length === 0) throw new ValidationError("Owner is required");
  if (owner.length > 100) throw new ValidationError("Owner must be at most 100 characters");
}

export function validateBranchName(name: string): void {
  if (typeof name !== "string" || name.length === 0) throw new ValidationError("Branch name is required");
  if (name.includes("..")) throw new ValidationError("Branch name cannot contain '..'");
  if (INVALID_BRANCH_CHARS.test(name)) throw new ValidationError("Branch name contains invalid characters (no spaces, ~^:?*[]\\ or control chars)");
}

export function validateTagName(name: string): void {
  if (typeof name !== "string" || name.length === 0) throw new ValidationError("Tag name is required");
  if (INVALID_BRANCH_CHARS.test(name)) throw new ValidationError("Tag name contains invalid characters");
}

export function validateRepoInput(owner: string, repo: string): void {
  validateOwner(owner);
  validateRepoName(repo);
}
