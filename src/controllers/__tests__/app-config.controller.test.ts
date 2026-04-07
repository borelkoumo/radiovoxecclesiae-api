import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { errorHandler } from "../../middleware/error-handler.js";
import { appConfigRouter } from "../../routes/v1/app-config.routes.js";

vi.mock("../../services/app-config.service.js", () => ({
  getAppConfig: vi.fn(),
}));

import { getAppConfig } from "../../services/app-config.service.js";

const mockConfig = {
  station: {
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
    storeLinks: { googlePlay: "https://play.google.com/store", appStore: "https://apps.apple.com" },
    missions: [{ icon: "sparkles-outline", title: "Évangélisation", desc: "Diffusion." }],
  },
  schedule: {
    lundi: {
      day: "lundi",
      dayIndex: 1,
      items: [{ time: "05:30", endTime: "05:35", code: "RVE0", title: "Indicatif", icon: "radio-outline", theme: null }],
    },
  },
  meta: { version: 1, updatedAt: "2026-04-07T10:00:00.000Z" },
};

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/app-config", appConfigRouter);
  app.use(errorHandler);
  return app;
}

describe("GET /api/v1/app-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with app config envelope", async () => {
    vi.mocked(getAppConfig).mockResolvedValue(mockConfig);
    const app = buildTestApp();

    const res = await request(app).get("/api/v1/app-config");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.station.id).toBe("rve-radio");
    expect(res.body.data.schedule).toBeDefined();
    expect(res.body.data.meta.version).toBe(1);
  });

  it("returns 500 with error envelope when service throws AppError", async () => {
    const { AppError } = await import("../../utils/app-error.js");
    vi.mocked(getAppConfig).mockRejectedValue(
      new AppError(503, "Firestore unavailable", "FIRESTORE_ERROR")
    );
    const app = buildTestApp();

    const res = await request(app).get("/api/v1/app-config");

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Firestore unavailable");
    expect(res.body.code).toBe("FIRESTORE_ERROR");
  });

  it("returns 500 for unexpected errors", async () => {
    vi.mocked(getAppConfig).mockRejectedValue(new Error("Unexpected"));
    const app = buildTestApp();

    const res = await request(app).get("/api/v1/app-config");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
