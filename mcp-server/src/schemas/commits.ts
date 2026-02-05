import { z } from "zod";

export const commitGetInput = z.object({
  owner: z.string(),
  repo: z.string(),
  ref: z.string(),
});
export const commitListInput = z.object({
  owner: z.string(),
  repo: z.string(),
  sha: z.string().optional(),
  path: z.string().optional(),
  per_page: z.number().min(1).max(100).optional().default(30),
  page: z.number().min(1).optional().default(1),
});
export const commitCompareInput = z.object({
  owner: z.string(),
  repo: z.string(),
  base: z.string(),
  head: z.string(),
});
