import { z } from "zod";

export const commitCreateFileEntry = z.object({
  path: z.string(),
  content: z.string(),
  mode: z.enum(["100644", "100755", "040000"]).optional().default("100644"),
});

export const commitCreateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  message: z.string(),
  branch: z.string(),
  files: z.array(commitCreateFileEntry).min(1),
});

export const refUpdateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  ref: z.string(),
  sha: z.string(),
  force: z.boolean().optional().default(false),
});

export const tagListInput = z.object({
  owner: z.string(),
  repo: z.string(),
  per_page: z.number().min(1).max(100).optional().default(30),
  page: z.number().min(1).optional().default(1),
});

export const tagCreateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  tag: z.string(),
  message: z.string(),
  object: z.string(),
  type: z.enum(["commit", "tree", "blob"]).optional().default("commit"),
});
