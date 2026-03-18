import { z } from "zod";

export const createCheckinSchema = z.object({
  energy: z.number().int().min(1).max(5),
  focus: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
  note: z.string().max(1000).optional(),
});

export type CreateCheckinInput = z.infer<typeof createCheckinSchema>;
