import { z } from "zod";

export const stationFrequencySchema = z.object({
  city: z.string().min(1),
  freq: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

export const stationContactsSchema = z.object({
  address: z.string(),
  website: z.string().url(),
  phone: z.string(),
  email: z.string().email(),
  facebook: z.string().url(),
  whatsapp: z.string().url(),
});

export const storeLinksSchema = z.object({
  googlePlay: z.string().url(),
  appStore: z.string().url(),
});

export const stationMissionSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  desc: z.string().min(1),
});

export const stationConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  frequency: z.string().min(1),
  diocese: z.string().min(1),
  country: z.string().min(1),
  streamUrl: z.string().url(),
  shareUrl: z.string().url(),
  copyright: z.string().min(1),
  slogan: z.string().min(1),
  description: z.string().min(1),
  frequencies: z.array(stationFrequencySchema).min(1),
  contacts: stationContactsSchema,
  storeLinks: storeLinksSchema,
  missions: z.array(stationMissionSchema).min(1),
});

export type StationConfigInput = z.input<typeof stationConfigSchema>;
