import { handleApiError, ok, fail } from "@/server/api-response";
import { getProduct } from "@/server/firestore/storefront";

type ProductRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

export async function GET(_request: Request, context: ProductRouteContext) {
  try {
    const { slug } = await context.params;
    const product = await getProduct(slug);

    if (!product) {
      return fail("not_found", "Product not found.", 404);
    }

    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}
