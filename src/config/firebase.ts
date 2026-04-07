import admin from "firebase-admin";
import { env } from "./env.js";

let firestoreInstance: admin.firestore.Firestore | null = null;

export function getFirestore(): admin.firestore.Firestore {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        // Render stores the key with literal \n — convert back to real newlines
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  firestoreInstance = admin.firestore();
  firestoreInstance.settings({ databaseId: env.FIREBASE_DATABASE_ID });
  return firestoreInstance;
}

/** Exposed for testing — resets the singleton so tests can inject mocks */
export function _resetFirestoreInstance(): void {
  firestoreInstance = null;
}
