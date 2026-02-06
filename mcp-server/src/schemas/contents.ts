import { z } from "zod";

export const contentsGetInput = z.object({
  owner: z.string(),
  repo: z.string(),
  path: z.string(),
  ref: z.string().optional(),
});

export const contentsCreateOrUpdateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  path: z.string(),
  message: z.string(),
  content: z.string(),
  sha: z.string().optional(),
  branch: z.string().optional(),
});

export const contentsDeleteInput = z.object({
  owner: z.string(),
  repo: z.string(),
  path: z.string(),
  message: z.string(),
  sha: z.string(),
  branch: z.string().optional(),
});
