import { z } from "zod";

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().positive().max(100).optional(),
});

export const createCommentarySchema = z.object({
  minute: z.number().int().min(0),
  sequence: z.number().int(),
  period: z.string(),
  eventType: z.string(),
  actor: z.string(),
  team: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()),
});
