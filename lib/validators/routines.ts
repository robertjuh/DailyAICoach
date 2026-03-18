import { z } from "zod";

export const createRoutineSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["MORNING", "EVENING", "CUSTOM"]),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        duration_minutes: z.number().int().min(1).max(180),
        sort_order: z.number().int().min(0).default(0),
      })
    )
    .min(1)
    .max(20),
});

export const updateRoutineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        duration_minutes: z.number().int().min(1).max(180),
        sort_order: z.number().int().min(0).default(0),
      })
    )
    .min(1)
    .max(20)
    .optional(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
