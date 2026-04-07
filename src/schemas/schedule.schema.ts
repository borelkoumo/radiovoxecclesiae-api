import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

export const scheduleItemSchema = z.object({
  time: z.string().regex(timeRegex, "Time must be HH:MM"),
  endTime: z.string().regex(timeRegex, "endTime must be HH:MM"),
  code: z.string().nullable(),
  title: z.string().min(1),
  icon: z.string().min(1),
  theme: z.string().nullable(),
});

export const dayScheduleSchema = z.object({
  day: z.string().min(1),
  dayIndex: z.number().int().min(0).max(6),
  items: z.array(scheduleItemSchema),
});

export const weeklyScheduleSchema = z.record(z.string(), dayScheduleSchema);

export const VALID_DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

export type ValidDay = (typeof VALID_DAYS)[number];

export const validDaySchema = z.enum(VALID_DAYS);
