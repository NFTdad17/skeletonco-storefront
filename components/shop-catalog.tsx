"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { ProductCategory, ProductSummary } from "@/lib/product";

const TABS: { id: "popular" | "all" | ProductCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "popular", label: "Popular" },
  { id: "tees", label: "Tees" },
  { id: "long-sleeves", label: "Long Sleeves" },
  { id: "jackets", label: "Jackets" },
  { id: "headwear", label: "Headwear" },
  { id: "miscellaneous", label: "Miscellaneous" },
];

const POPULAR_PINS = [
  /\bheavy blend hoodies?\b/i,
  /\bthree panel fleece hoodies?\b/i,
  /\bpom pom beanies?\b/i,
  /\bleather patch caps?\b/i,
  /\bcrew\s?necks?\b/i,
];

type PriceSort = "low-high" | "high-low";

function comparePrice(left: number | null, right: number | null, sort: PriceSort) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return sort === "low-high" ? left - right : right - left;
}

function popularOrder(products: ProductSummary[]) {
  const pinned: { product: ProductSummary; rank: number }[] = [];
  const rest: ProductSummary[] = [];
  for (const product of products) {
    const rank = POPULAR_PINS.findIndex((pattern) => pattern.test(product.title));
    if (rank === -1) rest.push(product);
    else pinned.push({ product, rank });
  }
  pinned.sort((left, right) => left.rank - right.rank);
  return [...pinned.map((entry) => entry.product), ...rest];
}

export function ShopCatalog({ products }: { products: ProductSummary[] }) {
  const [category, setCategory] = useState<(typeof TABS)[number]["id"]>("popular");
  const [sort, setSort] = useState<PriceSort>("low-high");
  const filtered =
    category === "all" || category === "popular"
      ? products
      : products.filter((product) => product.category === category);
  const visible =
    category === "popular"
      ? popularOrder(filtered)
      : [...filtered].sort((left, right) => comparePrice(left.price, right.price, sort));
  const selected = TABS.find((tab) => tab.id === category) ?? TABS[1];

  return (
    <>
      <div className="category-bar">
        <div className="category-tabs" role="group" aria-label="Filter products">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="category-tab"
              aria-pressed={category === tab.id}
              onClick={() => setCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="category-sort">
          <select
            aria-label="Sort by price"
            value={sort}
            onChange={(event) => setSort(event.target.value as PriceSort)}
          >
            <option value="low-high">Low to high</option>
            <option value="high-low">High to low</option>
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        category === "all" || category === "popular" ? (
          <div className="empty">
            <h2>Nothing is listed right now</h2>
            <p className="muted">
              New pieces will show up here when they&apos;re published in the shop.
            </p>
          </div>
        ) : (
          <p className="status">Nothing in {selected.label} right now.</p>
        )
      ) : (
        <ul className="grid">
          {visible.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
