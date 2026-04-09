import { describe, it, expect } from "vitest";
import { stationConfigSchema, stationFrequencySchema } from "../station.schema.js";

const validFrequency = { city: "Bafoussam", freq: "97.3 FM", lat: 5.4737, lng: 10.4179 };

const validStation = {
  id: "rve-radio",
  name: "Radio Vox Ecclesiae",
  shortName: "RVE",
  frequency: "97.3 FM",
  diocese: "Diocèse de Bafoussam",
  country: "Cameroun",
  streamUrl: "https://radiovoxeclesiae.ice.infomaniak.ch/radiovoxeclesiae-128.aac",
  shareUrl: "https://radiovoxecclesiae.kodekonnect.com/",
  copyright: "© Radio Vox Ecclesiae",
  slogan: "La voix de l'Église",
  description: "La voix de l'Église",
  frequencies: [validFrequency],
  contacts: {
    address: "Bafoussam II, Cameroun",
    website: "https://diocesedebafoussam.org",
    phone: "+237 6 90 06 03 01",
    email: "radiovoxecclesiae@gmail.com",
    facebook: "https://www.facebook.com/radiovoxecclesiae",
    whatsapp: "https://whatsapp.com/channel/0029VbBU76AHgZWcn3WWNA0L",
  },
  storeLinks: {
    googlePlay: "https://play.google.com/store",
    appStore: "https://apps.apple.com",
  },
  missions: [{ icon: "sparkles-outline", title: "Évangélisation", desc: "Diffusion quotidienne." }],
  paymentUrls: { mtn: "tel:*126#", orange: "tel:#150#" },
  donationText: "Votre générosité permet à l'Évangile de résonner.",
  biblicalQuote: { text: "\"Chacun doit donner...\"", reference: "2 Corinthiens 9:7" },
  donationHeroImageUrl: null,
};

describe("stationFrequencySchema", () => {
  it("parses valid frequency", () => {
    const result = stationFrequencySchema.safeParse(validFrequency);
    expect(result.success).toBe(true);
  });

  it("rejects missing city", () => {
    const result = stationFrequencySchema.safeParse({ ...validFrequency, city: "" });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric lat", () => {
    const result = stationFrequencySchema.safeParse({ ...validFrequency, lat: "5.4737" });
    expect(result.success).toBe(false);
  });
});

describe("stationConfigSchema", () => {
  it("parses a valid station config", () => {
    const result = stationConfigSchema.safeParse(validStation);
    expect(result.success).toBe(true);
  });

  it("rejects invalid streamUrl", () => {
    const result = stationConfigSchema.safeParse({ ...validStation, streamUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid contact email", () => {
    const bad = { ...validStation, contacts: { ...validStation.contacts, email: "not-email" } };
    const result = stationConfigSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects empty frequencies array", () => {
    const result = stationConfigSchema.safeParse({ ...validStation, frequencies: [] });
    expect(result.success).toBe(false);
  });

  it("rejects empty missions array", () => {
    const result = stationConfigSchema.safeParse({ ...validStation, missions: [] });
    expect(result.success).toBe(false);
  });

  it("accepts donationHeroImageUrl as null", () => {
    const result = stationConfigSchema.safeParse({ ...validStation, donationHeroImageUrl: null });
    expect(result.success).toBe(true);
  });

  it("accepts donationHeroImageUrl as a valid URL", () => {
    const result = stationConfigSchema.safeParse({ ...validStation, donationHeroImageUrl: "https://cdn.example.com/hero.jpg" });
    expect(result.success).toBe(true);
  });

  it("rejects donationHeroImageUrl as an invalid URL string", () => {
    const result = stationConfigSchema.safeParse({ ...validStation, donationHeroImageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects missing paymentUrls.mtn", () => {
    const result = stationConfigSchema.safeParse({ ...validStation, paymentUrls: { orange: "tel:#150#" } });
    expect(result.success).toBe(false);
  });

  it("rejects empty donationText", () => {
    const result = stationConfigSchema.safeParse({ ...validStation, donationText: "" });
    expect(result.success).toBe(false);
  });

  it("rejects biblicalQuote with missing reference", () => {
    const result = stationConfigSchema.safeParse({ ...validStation, biblicalQuote: { text: "..." } });
    expect(result.success).toBe(false);
  });
});
