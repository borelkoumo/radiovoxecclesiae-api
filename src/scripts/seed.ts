/**
 * Seed script — populates Firestore from local JSON files under data/.
 *
 * Usage:
 *   npm run seed                 # seed everything
 *   npm run seed -- station      # station config only
 *   npm run seed -- schedule     # weekly schedule only
 *   npm run seed -- prayers      # sample prayers only
 *
 * Idempotent: uses set() with merge so re-running does not duplicate data.
 */

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "../config/env.js";

// ── Firebase init ─────────────────────────────────────────────────────────────

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(admin.app(), env.FIREBASE_DATABASE_ID);

// ── Helpers ───────────────────────────────────────────────────────────────────

const DATA_DIR = resolve(__dirname, "../../data");

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(DATA_DIR, file), "utf-8")) as T;
}

function randomTimestampInLastDays(maxDaysAgo: number): admin.firestore.Timestamp {
  const now = Date.now();
  const msAgo = Math.floor(Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000);
  return admin.firestore.Timestamp.fromMillis(now - msAgo);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type RawItem = {
  time: string;
  endTime: string;
  code: string | null;
  title: string;
  theme: string | null;
  icon: string;
  artwork: string | null;
};

type RawDay = { day: string; schedule: RawItem[] };

type RawPrayer = {
  text: string;
  author: string;
  isAnonymous: boolean;
};

// ── Seed functions ────────────────────────────────────────────────────────────

async function clearCollection(name: string): Promise<void> {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
  console.log(`🗑️  ${name} cleared (${snap.size} docs)`);
}

async function seedStation(force: boolean): Promise<void> {
  if (force) await clearCollection("stations");
  const stationData = loadJson<Record<string, unknown>>("station.json");
  await db.collection("stations").doc("rve-radio").set(stationData);
  console.log("✅ stations/rve-radio written");
}

const SCHEDULE_DAYS = [
  { file: "lundi.json",    day: "lundi",    dayIndex: 1 },
  { file: "mardi.json",    day: "mardi",    dayIndex: 2 },
  { file: "mercredi.json", day: "mercredi", dayIndex: 3 },
  { file: "jeudi.json",    day: "jeudi",    dayIndex: 4 },
  { file: "vendredi.json", day: "vendredi", dayIndex: 5 },
  { file: "samedi.json",   day: "samedi",   dayIndex: 6 },
  { file: "dimanche.json", day: "dimanche", dayIndex: 0 },
] as const;

async function seedSchedule(force: boolean): Promise<void> {
  if (force) await clearCollection("schedules");
  await Promise.all(
    SCHEDULE_DAYS.map(async ({ file, day, dayIndex }) => {
      const raw = loadJson<RawDay>(`schedule/${file}`);
      const data = {
        day,
        dayIndex,
        items: raw.schedule.map((item) => ({
          time: item.time,
          endTime: item.endTime,
          code: item.code ?? null,
          title: item.title,
          icon: item.icon,
          theme: item.theme ?? null,
          artwork: item.artwork ?? null,
        })),
      };
      await db.collection("schedules").doc(day).set(data);
      console.log(`✅ schedules/${day} written (${data.items.length} items)`);
    }),
  );
}

async function seedPrayers(force: boolean): Promise<void> {
  if (force) {
    await clearCollection("prayers");
  } else {
    const existingSnap = await db.collection("prayers").limit(1).get();
    if (!existingSnap.empty) {
      console.log("ℹ️  prayers collection already has data — skipping seed (use --force to overwrite)");
      return;
    }
  }
  const prayers = loadJson<RawPrayer[]>("prayers.json");
  await Promise.all(
    prayers.map(async (prayer) => {
      const ref = await db.collection("prayers").add({
        ...prayer,
        createdAt: randomTimestampInLastDays(7),
        status: "approved",
      });
      console.log(`✅ prayers/${ref.id} written (${prayer.author})`);
    }),
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

const TARGETS = {
  station: seedStation,
  schedule: seedSchedule,
  prayers: seedPrayers,
} as const;

type Target = keyof typeof TARGETS;

async function seed(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const arg = args.find((a) => !a.startsWith("-")) as Target | undefined;

  if (arg !== undefined && !(arg in TARGETS)) {
    console.error(
      `❌ Unknown target "${arg}". Valid targets: ${Object.keys(TARGETS).join(", ")}`,
    );
    process.exit(1);
  }

  const targets = arg ? [arg] : (Object.keys(TARGETS) as Target[]);
  console.log(`🌱 Seeding: ${targets.join(", ")}${force ? " (--force)" : ""}\n`);

  for (const target of targets) {
    await TARGETS[target](force);
  }

  console.log("\n🎉 Seed complete.");
  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
