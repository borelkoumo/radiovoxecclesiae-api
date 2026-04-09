import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock repositories before importing the service
vi.mock("../../repositories/station.repository.js", () => ({
  getStationConfig: vi.fn(),
}));

vi.mock("../../repositories/schedule.repository.js", () => ({
  getWeeklySchedule: vi.fn(),
}));

import { getAppConfig } from "../app-config.service.js";
import { getStationConfig } from "../../repositories/station.repository.js";
import { getWeeklySchedule } from "../../repositories/schedule.repository.js";

const mockStation = {
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
  frequencies: [{ city: "Bafoussam", freq: "97.3 FM", lat: 5.4737, lng: 10.4179 }],
  contacts: {
    address: "Bafoussam II",
    website: "https://diocesedebafoussam.org",
    phone: "+237 690060301",
    email: "radiovoxecclesiae@gmail.com",
    facebook: "https://www.facebook.com/radiovoxecclesiae",
    whatsapp: "https://whatsapp.com/channel/0029VbBU76AHgZWcn3WWNA0L",
  },
  storeLinks: {
    googlePlay: "https://play.google.com/store",
    appStore: "https://apps.apple.com",
  },
  missions: [{ icon: "sparkles-outline", title: "Évangélisation", desc: "Diffusion." }],
  paymentUrls: { mtn: "tel:*126#", orange: "tel:#150#" },
  donationText: "Votre générosité permet à l'Évangile de résonner.",
  biblicalQuote: { text: "\"Chacun doit donner...\"", reference: "2 Corinthiens 9:7" },
  donationHeroImageUrl: null,
};

const mockSchedule = {
  lundi: {
    day: "lundi",
    dayIndex: 1,
    items: [
      { time: "05:30", endTime: "05:35", code: "RVE0", title: "Indicatif RVE", icon: "radio-outline", theme: null, artwork: null },
    ],
  },
};

describe("getAppConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns combined station + schedule + meta", async () => {
    vi.mocked(getStationConfig).mockResolvedValue(mockStation);
    vi.mocked(getWeeklySchedule).mockResolvedValue(mockSchedule);

    const result = await getAppConfig();

    expect(result.station).toEqual(mockStation);
    expect(result.schedule).toEqual(mockSchedule);
    expect(result.meta.version).toBe(1);
    expect(typeof result.meta.updatedAt).toBe("string");
    // updatedAt must be a valid ISO date string
    expect(() => new Date(result.meta.updatedAt)).not.toThrow();
  });

  it("fetches station and schedule in parallel", async () => {
    const calls: string[] = [];
    vi.mocked(getStationConfig).mockImplementation(async () => {
      calls.push("station");
      return mockStation;
    });
    vi.mocked(getWeeklySchedule).mockImplementation(async () => {
      calls.push("schedule");
      return mockSchedule;
    });

    await getAppConfig();

    // Both were called
    expect(calls).toContain("station");
    expect(calls).toContain("schedule");
    expect(calls).toHaveLength(2);
  });

  it("propagates station repository errors", async () => {
    vi.mocked(getStationConfig).mockRejectedValue(new Error("Firestore unavailable"));
    vi.mocked(getWeeklySchedule).mockResolvedValue(mockSchedule);

    await expect(getAppConfig()).rejects.toThrow("Firestore unavailable");
  });

  it("propagates schedule repository errors", async () => {
    vi.mocked(getStationConfig).mockResolvedValue(mockStation);
    vi.mocked(getWeeklySchedule).mockRejectedValue(new Error("Schedule fetch failed"));

    await expect(getAppConfig()).rejects.toThrow("Schedule fetch failed");
  });
});
