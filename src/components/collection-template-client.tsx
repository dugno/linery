"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "@/components/language-provider";
import ProductCard from "@/components/product-card";
import type { Collection, ProductCardData } from "@/content/types";

type ProductListResponse = {
  data?: ProductCardData[];
  success: boolean;
};

function isAuthorFilter(title: string) {
  const normalizedTitle = title.trim().toLowerCase();

  return normalizedTitle === "author" || normalizedTitle === "tác giả";
}

export default function CollectionTemplateClient({ page }: { page: Collection }) {
  const { t } = useLanguage();
  const [availableAuthors, setAvailableAuthors] = useState<string[] | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<ProductCardData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const products = filteredProducts || page.products;

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/products?collection=${encodeURIComponent(page.slug)}&limit=100`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<ProductListResponse>)
      .then((payload) => {
        if (!payload.success) {
          return;
        }

        setAvailableAuthors(
          Array.from(
            new Set(
              (payload.data || [])
                .map((product) => product.vendor)
                .filter((vendor): vendor is string => Boolean(vendor)),
            ),
          ),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAvailableAuthors(null);
      });

    return () => controller.abort();
  }, [page.slug]);

  useEffect(() => {
    if (!selectedAuthor) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    fetch(
      `/api/products?collection=${encodeURIComponent(page.slug)}&author=${encodeURIComponent(selectedAuthor)}&limit=100`,
      {
        cache: "no-store",
        signal: controller.signal,
      },
    )
      .then((response) => response.json() as Promise<ProductListResponse>)
      .then((payload) => {
        if (!isActive) {
          return;
        }

        setFilteredProducts(payload.success ? payload.data || [] : []);
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }

        setFilteredProducts([]);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [page.products, page.slug, selectedAuthor]);

  return (
    <div className="row">
      <div className="col-lg-3 col-md-12 col-sm-12">
        <aside className="scroll card px-2 py-2 dqdt-sidebar sidebar left-content">
          <div className="wrap_background_aside asidecollection">
            <div className="filter-content aside-filter">
              {page.filters.slice(0, 4).map((filter) => {
                const authorFilter = isAuthorFilter(filter.title);
                const visibleItems = authorFilter && availableAuthors
                  ? filter.items.filter((item) => availableAuthors.includes(item))
                  : filter.items;

                return (
                  <aside key={filter.title} className="aside-item">
                    <div className="aside-title">
                      <h2 className="title-head margin-top-0">
                        <span>{filter.title}</span>
                      </h2>
                    </div>
                    <div className="aside-content filter-group">
                      <ul>
                        {visibleItems.slice(0, 12).map((item) => (
                          <li key={item} className="filter-item filter-item--check-box filter-item--green">
                            <span>
                              <label className="custom-checkbox">
                                <input
                                  type="checkbox"
                                  checked={authorFilter ? selectedAuthor === item : false}
                                  disabled={!authorFilter}
                                  onChange={() => {
                                    if (!authorFilter) {
                                      return;
                                    }

                                    if (selectedAuthor === item) {
                                      setSelectedAuthor(null);
                                      setFilteredProducts(null);
                                      setIsLoading(false);
                                      return;
                                    }

                                    setIsLoading(true);
                                    setSelectedAuthor(item);
                                  }}
                                />
                                <i className="fa" />
                                {item}
                              </label>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <div className="col-lg-9 col-md-12 col-sm-12">
        {selectedAuthor ? (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              {t("site.author")}: <strong>{selectedAuthor}</strong>
            </div>
            <button
              className="btn btn-link p-0"
              type="button"
              onClick={() => {
                setSelectedAuthor(null);
                setFilteredProducts(null);
                setIsLoading(false);
              }}
            >
              Clear
            </button>
          </div>
        ) : null}

        <div className="row" aria-busy={isLoading}>
          {products.map((product) => (
            <ProductCard key={product.href} product={product} />
          ))}

          {!isLoading && products.length === 0 ? (
            <div className="col-12">
              <p>{t("site.noResults")}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
