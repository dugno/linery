import crypto from "node:crypto";
import path from "node:path";

import { ApiErrorResponse } from "@/server/api-response";
import { writeAuditLog } from "@/server/admin/audit";
import type { AdminUser } from "@/server/admin/auth";
import { getFirebaseAdmin } from "@/server/firebase-admin";
import { serializeFirestoreValue } from "@/server/firestore/serialize";

const STORAGE_PREFIX = "media/assets";

function sanitizeDocId(value: string) {
  return value.replace(/[/?#[\]]/g, "-");
}

function getContentType(fileName: string, fallback?: string) {
  if (fallback && fallback !== "application/octet-stream") {
    return fallback;
  }

  switch (path.extname(fileName).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function buildDownloadUrl(bucketName: string, storagePath: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

export async function listMediaAssets(limit = 100) {
  const snapshot = await getFirebaseAdmin().db.collection("mediaAssets").limit(limit).get();

  return snapshot.docs.map((doc) =>
    serializeFirestoreValue({
      id: doc.id,
      ...doc.data(),
    }),
  );
}

export async function uploadMediaAsset(file: File, admin: AdminUser) {
  if (!file.type.startsWith("image/")) {
    throw new ApiErrorResponse("invalid_file", "Chỉ cho phép tải lên tệp ảnh.", 422);
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new ApiErrorResponse("file_too_large", "Ảnh phải có dung lượng từ 8MB trở xuống.", 422);
  }

  const { bucket, db } = getFirebaseAdmin();
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const fileName = `${crypto.randomUUID()}-${safeName}`;
  const storagePath = `${STORAGE_PREFIX}/${fileName}`;
  const token = crypto.randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = getContentType(fileName, file.type);

  await bucket.file(storagePath).save(buffer, {
    contentType,
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
    resumable: false,
  });

  const doc = {
    bucket: bucket.name,
    contentType,
    fileName,
    originalName: file.name,
    originalPath: `/media/assets/${fileName}`,
    size: file.size,
    storagePath,
    uploadedBy: admin.uid,
    url: buildDownloadUrl(bucket.name, storagePath, token),
  };
  const ref = db.collection("mediaAssets").doc(sanitizeDocId(fileName));

  await ref.set(doc, { merge: true });
  await writeAuditLog({ action: "upload", admin, after: doc, collectionName: "mediaAssets", documentId: ref.id });

  return serializeFirestoreValue({
    id: ref.id,
    ...doc,
  });
}

export async function deleteMediaAsset(id: string, admin: AdminUser) {
  const { bucket, db } = getFirebaseAdmin();
  const ref = db.collection("mediaAssets").doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new ApiErrorResponse("not_found", "Không tìm thấy ảnh.", 404);
  }

  const data = snapshot.data() as { storagePath?: string };

  if (data.storagePath) {
    await bucket.file(data.storagePath).delete({ ignoreNotFound: true });
  }

  await ref.delete();
  await writeAuditLog({ action: "delete", admin, before: { id, ...snapshot.data() }, collectionName: "mediaAssets", documentId: id });

  return {
    deleted: true,
    id,
  };
}
