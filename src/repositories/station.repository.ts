import { getFirestore } from "../config/firebase.js";
import { stationConfigSchema } from "../schemas/station.schema.js";
import type { StationConfig } from "../types/station.types.js";
import { AppError } from "../utils/app-error.js";

const COLLECTION = "stations";
const DOC_ID = "rve-radio";

export async function getStationConfig(): Promise<StationConfig> {
  const db = getFirestore();
  const snap = await db.collection(COLLECTION).doc(DOC_ID).get();

  if (!snap.exists) {
    throw AppError.notFound("Station config not found in Firestore", "STATION_NOT_FOUND");
  }

  const raw = snap.data();
  const result = stationConfigSchema.safeParse(raw);
  if (!result.success) {
    throw AppError.internal("Station config in Firestore has invalid shape", "STATION_INVALID");
  }

  return result.data;
}
