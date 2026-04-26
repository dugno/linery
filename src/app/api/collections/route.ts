import { handleApiError, ok } from "@/server/api-response";
import { listCollections } from "@/server/firestore/storefront";

export const revalidate = 600;

export async function GET() {
  try {
    return ok(await listCollections());
  } catch (error) {
    return handleApiError(error);
  }
}
