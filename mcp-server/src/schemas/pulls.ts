import { z } from "zod";

export const prGetInput = z.object({ owner: z.string(), repo: z.string(), pull_number: z.number() });
export const prListInput = z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(["open", "closed", "all"]).optional().default("open"),
  sort: z.enum(["created", "updated", "popularity", "long-running"]).optional().default("created"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  per_page: z.number().min(1).max(100).optional().default(30),
  page: z.number().min(1).optional().default(1),
});
export const prCreateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  head: z.string(),
  base: z.string(),
  body: z.string().optional(),
  draft: z.boolean().optional().default(false),
});
export const prUpdateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  pull_number: z.number(),
  title: z.string().optional(),
  body: z.string().optional().nullable(),
  state: z.enum(["open", "closed"]).optional(),
});
export const prMergeInput = z.object({
  owner: z.string(),
  repo: z.string(),
  pull_number: z.number(),
  commit_title: z.string().optional(),
  commit_message: z.string().optional(),
  merge_method: z.enum(["merge", "squash", "rebase"]).optional().default("merge"),
});
export const prReviewInput = z.object({
  owner: z.string(),
  repo: z.string(),
  pull_number: z.number(),
  event: z.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"]),
  body: z.string().optional(),
});
