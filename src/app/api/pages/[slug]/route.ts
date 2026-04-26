import { handleApiError, ok, fail } from "@/server/api-response";
import { getPage } from "@/server/firestore/storefront";

type PageRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 600;

export async function GET(_request: Request, context: PageRouteContext) {
  try {
    const { slug } = await context.params;
    const page = await getPage(slug);

    if (!page) {
      return fail("not_found", "Page not found.", 404);
    }

    return ok(page);
  } catch (error) {
    return handleApiError(error);
  }
}
