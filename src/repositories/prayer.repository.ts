import { z } from "zod";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "../config/firebase.js";
import type { Prayer, PrayerListResult } from "../types/prayer.types.js";
import type { CreatePrayerInput, ListPrayersQuery } from "../schemas/prayer.schema.js";
import { AppError } from "../utils/app-error.js";

const COLLECTION = "prayers";

const prayerDocSchema = z.object({
  text: z.string().min(1),
  author: z.string().min(1),
  isAnonymous: z.boolean(),
  createdAt: z.instanceof(Timestamp),
  status: z.enum(["approved", "pending", "rejected"]).default("approved"),
});

function docToPrayer(id: string, data: FirebaseFirestore.DocumentData): Prayer {
  const result = prayerDocSchema.safeParse(data);
  if (!result.success) {
    throw AppError.internal(`Prayer ${id} has invalid shape`, "PRAYER_INVALID");
  }
  return {
    id,
    text: result.data.text,
    author: result.data.author,
    isAnonymous: result.data.isAnonymous,
    createdAt: result.data.createdAt.toDate().toISOString(),
    status: result.data.status,
  };
}

export async function listPrayers(query: ListPrayersQuery): Promise<PrayerListResult> {
  const db = getFirestore();
  let ref = db
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(query.limit + 1); // fetch one extra to detect next page

  if (query.cursor) {
    const cursorSnap = await db.collection(COLLECTION).doc(query.cursor).get();
    if (cursorSnap.exists) {
      ref = ref.startAfter(cursorSnap);
    }
  }

  const snap = await ref.get();
  const docs = snap.docs;
  const hasMore = docs.length > query.limit;
  const page = hasMore ? docs.slice(0, query.limit) : docs;

  const lastDoc = page[page.length - 1];
  return {
    prayers: page.map((d) => docToPrayer(d.id, d.data())),
    nextCursor: hasMore && lastDoc ? lastDoc.id : null,
  };
}

export async function createPrayer(input: CreatePrayerInput): Promise<Prayer> {
  const db = getFirestore();
  const author = input.isAnonymous ? "Anonyme" : (input.author?.trim() || "Anonyme");

  const docData = {
    text: input.text.trim(),
    author,
    isAnonymous: input.isAnonymous,
    createdAt: FieldValue.serverTimestamp(),
    status: "approved" as const,
  };

  const ref = await db.collection(COLLECTION).add(docData);
  const snap = await ref.get();
  const data = snap.data()!;

  return docToPrayer(ref.id, data);
}
