import { handleApiError, ok, fail } from "@/server/api-response";
import { getCollectionBySlug } from "@/server/firestore/storefront";

type CollectionRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

export async function GET(_request: Request, context: CollectionRouteContext) {
  try {
    const { slug } = await context.params;
    const collection = await getCollectionBySlug(slug);

    if (!collection) {
      return fail("not_found", "Collection not found.", 404);
    }

    return ok(collection);
  } catch (error) {
    return handleApiError(error);
  }
}
