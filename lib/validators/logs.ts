import { z } from "zod";

export const createLogSchema = z.object({
  routine_item_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
});

export const batchLogSchema = z.object({
  items: z
    .array(
      z.object({
        routine_item_id: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
      })
    )
    .min(1)
    .max(50),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type BatchLogInput = z.infer<typeof batchLogSchema>;
