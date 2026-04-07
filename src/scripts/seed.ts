/**
 * Seed script — migrates static data from the Expo frontend into Firestore.
 *
 * Usage:
 *   FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY=... \
 *   npm run seed
 *
 * Idempotent: uses set() with merge so re-running does not duplicate data.
 * Reads JSON files from the Expo project's constants/program/ directory.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
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

// ── Station data (mirrors RADIO_CONFIG from the Expo project) ─────────────────

const stationData = {
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
  description:
    "La voix de l'Église — la radio de l'évangélisation, la radio de l'Église catholique à Bafoussam.",
  frequencies: [
    { city: "Bafoussam", freq: "97.3 FM", lat: 5.4737, lng: 10.4179 },
    { city: "Dschang", freq: "103.7 FM", lat: 5.4438, lng: 10.053 },
    { city: "Bangangté", freq: "105.8 FM", lat: 5.15, lng: 10.5167 },
  ],
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
  missions: [
    {
      icon: "sparkles-outline",
      title: "Évangélisation",
      desc: "Diffusion quotidienne de la messe et des prières.",
    },
    {
      icon: "school-outline",
      title: "Éducation",
      desc: "Programmes de formation civique et sanitaire.",
    },
  ],
};

// ── Schedule JSON files (path relative to the Expo project) ──────────────────

const SCHEDULE_DAYS = [
  { file: "lundi.json", day: "lundi", dayIndex: 1 },
  { file: "mardi.json", day: "mardi", dayIndex: 2 },
  { file: "mercredi.json", day: "mercredi", dayIndex: 3 },
  { file: "jeudi.json", day: "jeudi", dayIndex: 4 },
  { file: "vendredi.json", day: "vendredi", dayIndex: 5 },
  { file: "samedi.json", day: "samedi", dayIndex: 6 },
  { file: "dimanche.json", day: "dimanche", dayIndex: 0 },
] as const;

// Resolve path to the Expo project's JSON files (sibling directory)
const EXPO_PROGRAM_DIR = resolve(
  __dirname,
  "../../../radiovoxecclesiae/src/constants/program"
);

type RawItem = {
  time: string;
  endTime: string;
  code: string | null;
  title: string;
  theme: string | null;
  icon: string;
};

type RawDay = { day: string; schedule: RawItem[] };

function loadDaySchedule(file: string, day: string, dayIndex: number) {
  const filePath = resolve(EXPO_PROGRAM_DIR, file);
  const raw: RawDay = JSON.parse(readFileSync(filePath, "utf-8")) as RawDay;

  return {
    day,
    dayIndex,
    items: raw.schedule.map((item) => ({
      time: item.time,
      endTime: item.endTime,
      code: item.code ?? null,
      title: item.title,
      icon: item.icon,
      theme: item.theme ?? null,
    })),
  };
}

// ── Prayers seed data (from SAMPLE_PRAYERS in prayers.tsx) ───────────────────

/**
 * Returns a random Firestore Timestamp within the last `maxDaysAgo` days.
 */
function randomTimestampInLastDays(maxDaysAgo: number): admin.firestore.Timestamp {
  const now = Date.now();
  const msAgo = Math.floor(Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000);
  return admin.firestore.Timestamp.fromMillis(now - msAgo);
}

const PRAYERS_SEED = [
  {
    text: "Seigneur, nous te confions tous les malades et les personnes en souffrance. Que ta main de guérison les touche et leur apporte réconfort et paix.",
    author: "Marie-Claire",
    isAnonymous: false,
  },
  {
    text: "Père éternel, entre tes mains je remets ma vie. Que la Vierge Marie, patronne de notre diocèse, nous couvre de son manteau maternel.",
    author: "Jean-Pierre",
    isAnonymous: false,
  },
  {
    text: "Seigneur Jésus miséricordieux, viens au secours de notre pays le Cameroun, bénis nos familles et guide nos pas sur le chemin de la paix.",
    author: "François",
    isAnonymous: false,
  },
  {
    text: "Merci Seigneur pour toutes les grâces reçues. Je te confie cette nouvelle année avec tout ce qu'elle comportera. Que ta volonté se réalise. Amen.",
    author: "Anonyme",
    isAnonymous: true,
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log("🌱 Starting Firestore seed...\n");

  // 1. Station config
  await db
    .collection("stations")
    .doc("rve-radio")
    .set(stationData, { merge: true });
  console.log("✅ stations/rve-radio written");

  // 2. Weekly schedule (parallel writes)
  await Promise.all(
    SCHEDULE_DAYS.map(async ({ file, day, dayIndex }) => {
      const data = loadDaySchedule(file, day, dayIndex);
      await db.collection("schedules").doc(day).set(data, { merge: true });
      console.log(`✅ schedules/${day} written (${data.items.length} items)`);
    })
  );

  // 3. Prayers — skip if collection already has documents
  const existingSnap = await db.collection("prayers").limit(1).get();
  if (!existingSnap.empty) {
    console.log("ℹ️  prayers collection already has data — skipping seed");
  } else {
    await Promise.all(
      PRAYERS_SEED.map(async (prayer) => {
        const docData = {
          ...prayer,
          createdAt: randomTimestampInLastDays(7),
          status: "approved",
        };
        const ref = await db.collection("prayers").add(docData);
        console.log(`✅ prayers/${ref.id} written (${prayer.author})`);
      })
    );
  }

  console.log("\n🎉 Seed complete.");
  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
