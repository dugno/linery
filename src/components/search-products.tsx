"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";

import { useLanguage } from "@/components/language-provider";
import type { SearchIndexItem } from "@/content/types";

type SearchResponse = {
  data?: SearchIndexItem[];
  success: boolean;
};

function getQueryFromLocation() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("query") || "";
}

export default function SearchProducts() {
  const { t } = useLanguage();
  const query = useSyncExternalStore(
    (notify) => {
      window.addEventListener("popstate", notify);

      return () => window.removeEventListener("popstate", notify);
    },
    getQueryFromLocation,
    () => "",
  );
  const [results, setResults] = useState<SearchIndexItem[]>([]);
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (!normalizedQuery) {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/search?query=${encodeURIComponent(normalizedQuery)}&limit=48`, {
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<SearchResponse>)
      .then((payload) => {
        setResults(payload.success ? payload.data || [] : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setResults([]);
      })

    return () => controller.abort();
  }, [normalizedQuery]);

  if (!normalizedQuery) {
    return null;
  }

  const visibleResults = normalizedQuery ? results : [];

  return (
    <div className="search-results mt-4">
      <h2 className="title_page h3">{t("site.searchResults")} &quot;{query}&quot;</h2>
      {visibleResults.length ? (
        <div className="row">
          {visibleResults.map((item) => (
            <div key={`${item.type}-${item.href}`} className="item product-col col-6 col-md-4 col-lg-15">
              <div className="item_product_main">
                <div className="product-thumbnail pos-relative">
                  <Link className="image_thumb pos-relative embed-responsive embed-responsive-1by1" href={item.href} title={item.title}>
                    {item.imageUrl ? <img loading="lazy" className="img-fetured" src={item.imageUrl} alt={item.title} /> : null}
                  </Link>
                </div>
                <div className="product-info">
                  {item.author ? <span className="product-vendor">{item.author}</span> : null}
                  <span className="product-name">
                    <Link className="link line-clamp-2" href={item.href} title={item.title}>
                      {item.title}
                    </Link>
                  </span>
                  {item.price ? (
                    <div className="product-item-cta position-relative">
                      <div className="price-box">
                        <span className="price">{item.price}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>{t("site.noResults")}</p>
      )}
    </div>
  );
}
