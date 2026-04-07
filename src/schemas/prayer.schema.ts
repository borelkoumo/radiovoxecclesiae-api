import { z } from "zod";

export const createPrayerSchema = z.object({
  text: z.string().min(1, "Le texte est requis").max(500, "500 caractères maximum"),
  author: z.string().max(100, "100 caractères maximum").optional(),
  isAnonymous: z.boolean().default(false),
});

export type CreatePrayerInput = z.infer<typeof createPrayerSchema>;

export const listPrayersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type ListPrayersQuery = z.infer<typeof listPrayersQuerySchema>;
