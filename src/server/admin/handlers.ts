import type { ZodSchema } from "zod";

import { ApiErrorResponse, handleApiError, ok } from "@/server/api-response";
import { writeAuditLog } from "@/server/admin/audit";
import { requirePermission, withAuditFields } from "@/server/admin/auth";
import { archiveProduct, createDoc, deleteDoc, getDoc, listDocs, normalizeAdminData, patchDoc } from "@/server/admin/firestore";
import type { AdminPermission } from "@/server/admin/permissions";
import { getSearchParamNumber, parseJson } from "@/server/request";

type IdContext<ParamName extends string> = {
  params: Promise<Record<ParamName, string>>;
};

export function listHandler(collectionName: string, permission: AdminPermission, orderBy?: string) {
  return async function GET(request: Request) {
    try {
      await requirePermission(request, permission);
      const url = new URL(request.url);
      const limit = getSearchParamNumber(url.searchParams, "limit", 50, 200);

      return ok(
        await listDocs(collectionName, {
          limit,
          orderBy,
          paymentStatus: url.searchParams.get("paymentStatus") || undefined,
          query: url.searchParams.get("q") || undefined,
          status: url.searchParams.get("status") || undefined,
        }),
      );
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function getHandler<ParamName extends string>(collectionName: string, paramName: ParamName, permission: AdminPermission) {
  return async function GET(request: Request, context: IdContext<ParamName>) {
    try {
      await requirePermission(request, permission);
      const params = await context.params;
      const doc = await getDoc(collectionName, params[paramName]);

      if (!doc) {
        throw new ApiErrorResponse("not_found", "Không tìm thấy tài liệu.", 404);
      }

      return ok(doc);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function createHandler(collectionName: string, schema: ZodSchema<Record<string, unknown>>, idField: string, permission: AdminPermission) {
  return async function POST(request: Request) {
    try {
      const admin = await requirePermission(request, permission);
      const input = await parseJson(request, schema);
      const id = String(input[idField]);
      const data = normalizeAdminData(withAuditFields(input, admin, true));
      const created = await createDoc(collectionName, id, data);

      await writeAuditLog({ action: "create", admin, after: created, collectionName, documentId: id });

      return ok(created, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function patchHandler<ParamName extends string>(collectionName: string, paramName: ParamName, schema: ZodSchema<Record<string, unknown>>, permission: AdminPermission) {
  return async function PATCH(request: Request, context: IdContext<ParamName>) {
    try {
      const admin = await requirePermission(request, permission);
      const params = await context.params;
      const input = await parseJson(request, schema);
      const data = normalizeAdminData(withAuditFields(input, admin));
      const before = await getDoc(collectionName, params[paramName]);
      const patched = await patchDoc(collectionName, params[paramName], data);

      await writeAuditLog({ action: "patch", admin, after: patched, before, collectionName, documentId: params[paramName] });

      return ok(patched);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function deleteHandler<ParamName extends string>(collectionName: string, paramName: ParamName, permission: AdminPermission) {
  return async function DELETE(request: Request, context: IdContext<ParamName>) {
    try {
      const admin = await requirePermission(request, permission);
      const params = await context.params;
      const before = await getDoc(collectionName, params[paramName]);
      const deleted = await deleteDoc(collectionName, params[paramName]);

      await writeAuditLog({ action: "delete", admin, before, collectionName, documentId: params[paramName] });

      return ok(deleted);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function archiveProductHandler() {
  return async function DELETE(request: Request, context: IdContext<"slug">) {
    try {
      const admin = await requirePermission(request, "products.archive");
      const params = await context.params;
      const before = await getDoc("products", params.slug);
      const archived = await archiveProduct(params.slug, admin.uid);

      await writeAuditLog({ action: "archive", admin, after: archived, before, collectionName: "products", documentId: params.slug });

      return ok(archived);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
