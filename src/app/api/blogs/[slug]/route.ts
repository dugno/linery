import { handleApiError, ok, fail } from "@/server/api-response";
import { getBlog } from "@/server/firestore/storefront";

type BlogRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 600;

export async function GET(_request: Request, context: BlogRouteContext) {
  try {
    const { slug } = await context.params;
    const blog = await getBlog(slug);

    if (!blog) {
      return fail("not_found", "Blog not found.", 404);
    }

    return ok(blog);
  } catch (error) {
    return handleApiError(error);
  }
}
