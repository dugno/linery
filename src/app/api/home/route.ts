import { handleApiError, ok, fail } from "@/server/api-response";
import { getHome } from "@/server/firestore/storefront";

export const revalidate = 600;

export async function GET() {
  try {
    const home = await getHome();

    if (!home) {
      return fail("not_found", "Home page not found.", 404);
    }

    return ok(home);
  } catch (error) {
    return handleApiError(error);
  }
}
