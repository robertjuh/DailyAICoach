import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  goals: z
    .array(z.string().min(1).max(200))
    .min(1, "At least one goal is required")
    .max(3),
  routine_items: z
    .array(
      z.object({
        name: z.string().min(1, "Item name is required").max(100),
        duration_minutes: z
          .number()
          .int()
          .min(1, "Duration must be at least 1 minute")
          .max(180),
      })
    )
    .min(1, "At least one routine item is required")
    .max(10),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
