import { NextResponse } from "next/server";

import { getFirebaseAdmin, isFirebaseConfigured } from "@/server/firebase-admin";

export const dynamic = "force-dynamic";

type HealthCheck = {
  checkedAt: string;
  db: {
    latencyMs?: number;
    message?: string;
    status: "healthy" | "not_configured" | "unhealthy";
  };
  server: {
    nodeEnv: string;
    status: "healthy";
    uptimeSeconds: number;
  };
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function checkFirestore() {
  if (!isFirebaseConfigured()) {
    return {
      status: "not_configured" as const,
      message: "Firebase environment variables are not configured.",
    };
  }

  const startedAt = Date.now();

  try {
    await withTimeout(getFirebaseAdmin().db.collection("siteSettings").limit(1).get(), 3000);

    return {
      status: "healthy" as const,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: "unhealthy" as const,
      latencyMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : "Unable to reach Firestore.",
    };
  }
}

export async function GET() {
  const db = await checkFirestore();
  const body: HealthCheck = {
    checkedAt: new Date().toISOString(),
    db,
    server: {
      nodeEnv: process.env.NODE_ENV || "development",
      status: "healthy",
      uptimeSeconds: Math.round(process.uptime()),
    },
  };
  const isHealthy = db.status === "healthy";

  return NextResponse.json(
    {
      success: isHealthy,
      data: body,
    },
    {
      status: isHealthy ? 200 : 503,
    },
  );
}
