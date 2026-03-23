import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  timezone: z.string().min(1).max(100),
  goals: z
    .array(z.string().min(1).max(200))
    .min(1, "At least one goal is required")
    .max(3),
  work_description: z.string().max(300).optional(),
  default_day_type: z
    .enum(["build", "finish", "ship", "recover", "stabilize"])
    .optional(),
  first_watch_time: z
    .string()
    .regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Invalid time format")
    .transform((v) => v.slice(0, 5).padStart(5, "0"))
    .optional()
    .default("07:00"),
  night_watch_time: z
    .string()
    .regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Invalid time format")
    .transform((v) => v.slice(0, 5).padStart(5, "0"))
    .optional()
    .default("21:00"),
  movement_preference: z.string().max(300).optional(),
  notify_enabled: z.boolean().optional().default(false),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
