import { ApiErrorResponse } from "@/server/api-response";
import { FieldValue, getFirebaseAdmin, Timestamp } from "@/server/firebase-admin";
import { serializeFirestoreValue } from "@/server/firestore/serialize";

export type ListOptions = {
  limit: number;
  orderBy?: string;
  paymentStatus?: string;
  query?: string;
  status?: string;
};

function collection(name: string) {
  return getFirebaseAdmin().db.collection(name);
}

export async function listDocs(collectionName: string, options: ListOptions = { limit: 50 }) {
  let query: FirebaseFirestore.Query = collection(collectionName).limit(options.limit);

  if (options.orderBy) {
    query = collection(collectionName).orderBy(options.orderBy, "desc").limit(options.limit);
  }

  const snapshot = await query.get();

  return snapshot.docs
    .map((doc) =>
      serializeFirestoreValue({
        id: doc.id,
        ...doc.data(),
      }),
    )
    .filter((doc) => {
      const item = doc as Record<string, unknown>;

      if (options.status && item.status !== options.status) {
        return false;
      }

      if (options.paymentStatus && item.paymentStatus !== options.paymentStatus) {
        return false;
      }

      if (!options.query) {
        return true;
      }

      return JSON.stringify(item).toLowerCase().includes(options.query.toLowerCase());
    });
}

export async function getDoc(collectionName: string, id: string) {
  const snapshot = await collection(collectionName).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = serializeFirestoreValue({
    id: snapshot.id,
    ...snapshot.data(),
  });

  if (collectionName !== "orders") {
    return data;
  }

  const itemsSnapshot = await snapshot.ref.collection("items").get();

  return {
    ...(data as Record<string, unknown>),
    items: itemsSnapshot.docs.map((doc) =>
      serializeFirestoreValue({
        id: doc.id,
        ...doc.data(),
      }),
    ),
  };
}

export async function createDoc(collectionName: string, id: string, data: Record<string, unknown>) {
  const ref = collection(collectionName).doc(id);
  const existing = await ref.get();

  if (existing.exists) {
    throw new ApiErrorResponse("conflict", "Tài liệu đã tồn tại.", 409);
  }

  await ref.set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return getDoc(collectionName, id);
}

export async function patchDoc(collectionName: string, id: string, data: Record<string, unknown>) {
  const ref = collection(collectionName).doc(id);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new ApiErrorResponse("not_found", "Không tìm thấy tài liệu.", 404);
  }

  await ref.set(
    {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return getDoc(collectionName, id);
}

export async function archiveProduct(slug: string, updatedBy: string) {
  return patchDoc("products", slug, {
    status: "archived",
    updatedBy,
  });
}

export async function deleteDoc(collectionName: string, id: string) {
  const ref = collection(collectionName).doc(id);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new ApiErrorResponse("not_found", "Không tìm thấy tài liệu.", 404);
  }

  await ref.delete();

  return {
    deleted: true,
    id,
  };
}

export function normalizeAdminData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (key === "expiresAt" && typeof value === "string") {
        return [key, Timestamp.fromDate(new Date(value))];
      }

      return [key, value];
    }),
  );
}
