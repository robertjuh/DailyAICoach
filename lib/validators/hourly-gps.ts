import { z } from "zod";

export const createHourlyCheckinSchema = z.object({
  working_on: z.string().min(1).max(500),
  drift_note: z.string().max(500).optional(),
  win: z.string().max(500).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  next_plan: z.string().max(500).optional(),
  dim_capture: z.string().max(500).optional(),
});

export type CreateHourlyCheckinInput = z.infer<typeof createHourlyCheckinSchema>;

export const updateGpsSettingsSchema = z.object({
  hourly_gps_enabled: z.boolean().optional(),
  hourly_gps_interval: z.number().int().min(15).max(240).optional(),
  hourly_gps_start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Must be HH:MM format")
    .optional(),
  hourly_gps_end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Must be HH:MM format")
    .optional(),
});

export type UpdateGpsSettingsInput = z.infer<typeof updateGpsSettingsSchema>;
