import { getStationConfig } from "../repositories/station.repository.js";
import { getWeeklySchedule } from "../repositories/schedule.repository.js";
import type { AppConfig } from "../schemas/app-config.schema.js";

/**
 * Aggregates station config and weekly schedule in a single call.
 * Both Firestore reads are done in parallel to minimize latency.
 */
export async function getAppConfig(): Promise<AppConfig> {
  const [station, schedule] = await Promise.all([
    getStationConfig(),
    getWeeklySchedule(),
  ]);

  return {
    station,
    schedule,
    meta: {
      version: 1,
      updatedAt: new Date().toISOString(),
    },
  };
}
