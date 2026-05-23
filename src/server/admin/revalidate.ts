import { revalidateTag } from "next/cache";

export function revalidateStorefront(tags: string[] = []) {
  revalidateTag("storefront", "max");

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
}
