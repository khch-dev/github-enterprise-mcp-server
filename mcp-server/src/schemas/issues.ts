import { z } from "zod";

export const issueGetInput = z.object({ owner: z.string(), repo: z.string(), issue_number: z.number() });
export const issueListInput = z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(["open", "closed", "all"]).optional().default("open"),
  sort: z.enum(["created", "updated", "comments"]).optional().default("created"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  per_page: z.number().min(1).max(100).optional().default(30),
  page: z.number().min(1).optional().default(1),
});
export const issueCreateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  body: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
  milestone: z.number().optional(),
});
export const issueUpdateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  issue_number: z.number(),
  title: z.string().optional(),
  body: z.string().optional().nullable(),
  state: z.enum(["open", "closed"]).optional(),
  assignees: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
  milestone: z.number().optional().nullable(),
});
export const issueCommentInput = z.object({
  owner: z.string(),
  repo: z.string(),
  issue_number: z.number(),
  body: z.string(),
});
