import { handleApiError, ok, fail } from "@/server/api-response";
import { getSiteSettings } from "@/server/firestore/storefront";

export const revalidate = 3600;

export async function GET() {
  try {
    const settings = await getSiteSettings();

    if (!settings) {
      return fail("not_found", "Site settings not found.", 404);
    }

    return ok(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
