import { handleApiError, ok, fail } from "@/server/api-response";
import { getArticle } from "@/server/firestore/storefront";

type ArticleRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 600;

export async function GET(_request: Request, context: ArticleRouteContext) {
  try {
    const { slug } = await context.params;
    const article = await getArticle(slug);

    if (!article) {
      return fail("not_found", "Article not found.", 404);
    }

    return ok(article);
  } catch (error) {
    return handleApiError(error);
  }
}
