import { z } from "zod";
import { stationConfigSchema } from "./station.schema.js";
import { weeklyScheduleSchema } from "./schedule.schema.js";

export const appConfigMetaSchema = z.object({
  version: z.number().int().positive(),
  updatedAt: z.string().datetime(),
});

export const appConfigSchema = z.object({
  station: stationConfigSchema,
  schedule: weeklyScheduleSchema,
  meta: appConfigMetaSchema,
});

export type AppConfig = z.infer<typeof appConfigSchema>;
