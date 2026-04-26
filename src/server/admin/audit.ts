import { FieldValue, getFirebaseAdmin } from "@/server/firebase-admin";

import type { AdminUser } from "./auth";

export type AuditAction = "archive" | "create" | "delete" | "patch" | "role_update" | "upload" | "user_status_update";

export async function writeAuditLog({
  action,
  admin,
  after,
  before,
  collectionName,
  documentId,
}: {
  action: AuditAction;
  admin: AdminUser;
  after?: unknown;
  before?: unknown;
  collectionName: string;
  documentId: string;
}) {
  await getFirebaseAdmin().db.collection("auditLogs").add({
    action,
    adminEmail: admin.email || null,
    adminUid: admin.uid,
    after: after ?? null,
    before: before ?? null,
    collectionName,
    documentId,
    createdAt: FieldValue.serverTimestamp(),
  });
}
