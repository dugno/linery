import type { NextResponse } from "next/server";

import { getFirebaseAdmin } from "@/server/firebase-admin";

export const SESSION_COOKIE_NAME = "firebase_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export type SessionUser = {
  email?: string;
  uid: string;
};

function parseCookieHeader(header: string | null) {
  return Object.fromEntries(
    (header || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf("=");

        if (separatorIndex === -1) {
          return [cookie, ""];
        }

        return [cookie.slice(0, separatorIndex), decodeURIComponent(cookie.slice(separatorIndex + 1))];
      }),
  );
}

export function getRequestCookie(request: Request, name: string) {
  return parseCookieHeader(request.headers.get("cookie"))[name];
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const sessionCookie = getRequestCookie(request, SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await getFirebaseAdmin().auth.verifySessionCookie(sessionCookie, true);

    return {
      email: decodedToken.email,
      uid: decodedToken.uid,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, sessionCookie: string) {
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
