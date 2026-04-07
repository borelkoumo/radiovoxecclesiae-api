import { getFirestore } from "../config/firebase.js";
import { dayScheduleSchema, VALID_DAYS } from "../schemas/schedule.schema.js";
import type { DaySchedule, WeeklySchedule } from "../types/schedule.types.js";
import { AppError } from "../utils/app-error.js";

const COLLECTION = "schedules";

/**
 * Reads all 7 day documents in parallel (single Firestore roundtrip via getAll).
 */
export async function getWeeklySchedule(): Promise<WeeklySchedule> {
  const db = getFirestore();
  const refs = VALID_DAYS.map((day) => db.collection(COLLECTION).doc(day));
  const snaps = await db.getAll(...refs);

  const schedule: WeeklySchedule = {};

  for (const snap of snaps) {
    if (!snap.exists) continue;

    const raw = snap.data();
    const result = dayScheduleSchema.safeParse(raw);
    if (!result.success) {
      throw AppError.internal(
        `Schedule for ${snap.id} has invalid shape`,
        "SCHEDULE_INVALID"
      );
    }
    schedule[snap.id] = result.data;
  }

  return schedule;
}

export async function getDaySchedule(day: string): Promise<DaySchedule | null> {
  const db = getFirestore();
  const snap = await db.collection(COLLECTION).doc(day).get();

  if (!snap.exists) return null;

  const result = dayScheduleSchema.safeParse(snap.data());
  if (!result.success) {
    throw AppError.internal(
      `Schedule for ${day} has invalid shape`,
      "SCHEDULE_INVALID"
    );
  }

  return result.data;
}
