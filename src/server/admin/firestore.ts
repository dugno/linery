import { ApiErrorResponse } from "@/server/api-response";
import { FieldValue, getFirebaseAdmin, Timestamp } from "@/server/firebase-admin";
import { serializeFirestoreValue } from "@/server/firestore/serialize";

export type ListOptions = {
  limit: number;
  page?: number;
  orderBy?: string;
  paymentStatus?: string;
  query?: string;
  status?: string;
};

export type ListDocsResult = {
  items: Array<Record<string, unknown>>;
  total: number;
};

function collection(name: string) {
  return getFirebaseAdmin().db.collection(name);
}

export async function listDocs(collectionName: string, options: ListOptions = { limit: 50 }): Promise<ListDocsResult> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const offset = (page - 1) * options.limit;
  let baseQuery: FirebaseFirestore.Query = collection(collectionName);

  if (options.orderBy) {
    baseQuery = baseQuery.orderBy(options.orderBy, "desc");
  }

  if (options.status) {
    baseQuery = baseQuery.where("status", "==", options.status);
  }

  if (options.paymentStatus) {
    baseQuery = baseQuery.where("paymentStatus", "==", options.paymentStatus);
  }

  if (options.query) {
    const snapshot = await baseQuery.get();
    const filtered = snapshot.docs
      .map((doc) =>
        serializeFirestoreValue({
          id: doc.id,
          ...doc.data(),
        }) as Record<string, unknown>,
      )
      .filter((doc) => {
        if (options.status && doc.status !== options.status) {
          return false;
        }

        if (options.paymentStatus && doc.paymentStatus !== options.paymentStatus) {
          return false;
        }

        return JSON.stringify(doc).toLowerCase().includes(options.query!.toLowerCase());
      });

    return {
      items: filtered.slice(offset, offset + options.limit),
      total: filtered.length,
    };
  }

  const query = baseQuery.limit(options.limit).offset(offset);
  const snapshot = await query.get();
  const countSnapshot = await baseQuery.count().get();

  return {
    items: snapshot.docs.map((doc) =>
      serializeFirestoreValue({
        id: doc.id,
        ...doc.data(),
      }) as Record<string, unknown>,
    ),
    total: countSnapshot.data().count,
  };
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
