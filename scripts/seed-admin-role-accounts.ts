import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { ADMIN_ROLES, type AdminRole } from "../src/server/admin/permissions";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex);
    let value = trimmedLine.slice(separatorIndex + 1);

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] ||= value;
  }
}

function makePassword() {
  return `Tsq@${crypto.randomBytes(12).toString("base64url")}1`;
}

function roleToName(role: AdminRole) {
  return role
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env.local"));

  const firebaseAdminModule = await import("../src/server/firebase-admin");
  const firebaseAdmin = (firebaseAdminModule as typeof firebaseAdminModule & { default?: typeof firebaseAdminModule }).default || firebaseAdminModule;
  const { FieldValue } = firebaseAdmin;
  const { auth, db } = firebaseAdmin.getFirebaseAdmin();
  const emailDomain = process.env.ADMIN_SEED_EMAIL_DOMAIN || "example.com";
  const accounts = [];

  for (const role of ADMIN_ROLES) {
    const email = `rbac.${role}@${emailDomain}`;
    const password = makePassword();
    const displayName = `RBAC ${roleToName(role)}`;
    let user;

    try {
      user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, {
        disabled: false,
        displayName,
        emailVerified: true,
        password,
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code !== "auth/user-not-found") {
        throw error;
      }

      user = await auth.createUser({
        disabled: false,
        displayName,
        email,
        emailVerified: true,
        password,
      });
    }

    const firstName = roleToName(role);
    const lastName = "RBAC";

    await db.collection("customers").doc(user.uid).set(
      {
        email,
        extraPermissions: [],
        firstName,
        lastName,
        revokedPermissions: [],
        role,
        status: "active",
        uid: user.uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const snapshot = await db.collection("customers").doc(user.uid).get();

    if (!snapshot.data()?.createdAt) {
      await snapshot.ref.set({ createdAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    accounts.push({
      email,
      password,
      role,
      uid: user.uid,
    });
  }

  const outputPath = path.join(process.cwd(), ".admin-role-accounts.local.json");

  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        accounts,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`Created or updated ${accounts.length} RBAC seed accounts.`);
  console.log(`Credentials written to ${outputPath}. This file is ignored by git.`);
  console.table(accounts.map(({ email, role, uid }) => ({ email, role, uid })));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
