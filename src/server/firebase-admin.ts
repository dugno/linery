import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function isFirebaseConfigured() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

export function isFirebaseStorageConfigured() {
  return Boolean(isFirebaseConfigured() && process.env.FIREBASE_STORAGE_BUCKET);
}

export function isFirebaseAuthConfigured() {
  return Boolean(isFirebaseConfigured() && process.env.FIREBASE_WEB_API_KEY);
}

function getPrivateKey() {
  return requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

function getFirebaseApp() {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  return initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: getPrivateKey(),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export function getFirebaseAdmin() {
  const app = getFirebaseApp();

  return {
    app,
    auth: getAuth(app),
    bucket: getStorage(app).bucket(),
    db: getFirestore(app),
  };
}

export { FieldValue, Timestamp };
