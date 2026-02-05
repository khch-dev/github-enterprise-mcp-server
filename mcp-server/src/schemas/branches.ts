import { z } from "zod";

export const branchListInput = z.object({
  owner: z.string(),
  repo: z.string(),
  per_page: z.number().min(1).max(100).optional().default(30),
  page: z.number().min(1).optional().default(1),
});
export const branchGetInput = z.object({ owner: z.string(), repo: z.string(), branch: z.string() });
export const branchCreateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  ref: z.string(),
  sha: z.string(),
});
export const branchDeleteInput = z.object({
  owner: z.string(),
  repo: z.string(),
  ref: z.string(),
});
