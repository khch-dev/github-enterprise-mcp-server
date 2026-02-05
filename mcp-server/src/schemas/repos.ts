import { z } from "zod";

export const repoGetInput = z.object({
  owner: z.string(),
  repo: z.string(),
});

export const repoListInput = z.object({
  type: z.enum(["all", "owner", "public", "private", "member"]).optional().default("all"),
  sort: z.enum(["created", "updated", "pushed", "full_name"]).optional().default("updated"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  per_page: z.number().min(1).max(100).optional().default(30),
  page: z.number().min(1).optional().default(1),
});

export const repoCreateInput = z.object({
  name: z.string(),
  description: z.string().optional(),
  private: z.boolean().optional().default(false),
  auto_init: z.boolean().optional().default(false),
});

export const repoUpdateInput = z.object({
  owner: z.string(),
  repo: z.string(),
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  private: z.boolean().optional(),
});

export const repoDeleteInput = z.object({
  owner: z.string(),
  repo: z.string(),
});
