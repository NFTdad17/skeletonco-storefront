import "server-only";
import { cache } from "react";
import { plainText } from "@/lib/format";
import type {
  ProductOption,
  ProductSummary,
  ProductVariant,
  ProductView,
} from "@/lib/product";
import { categorizeProduct } from "@/lib/shop-category";
import { imageForVariant, initialVariant, priceLabel, startingPrice } from "@/lib/variants";

const PRINTIFY_BASE_URL = "https://api.printify.com/v1";
export const PRINTIFY_SHOP_ID = "27129548";
const USER_AGENT = "SynergyCo-Storefront/1.0";
const MAX_PAGES = 50;

export class PrintifyError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PrintifyError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProductId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asIdList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const id = asNumber(entry);
    return id == null ? [] : [id];
  });
}

function normalizeVariant(value: unknown): ProductVariant | null {
  if (!isRecord(value)) return null;
  const id = asNumber(value.id);
  const price = asNumber(value.price);
  if (id == null || price == null) return null;
  const available = value.is_available !== false;
  const enabled = value.is_enabled !== false && available;
  return {
    id,
    title: typeof value.title === "string" ? plainText(value.title) : "",
    price,
    enabled,
    isDefault: value.is_default === true,
    optionIds: asIdList(value.options),
  };
}

function normalizeOption(value: unknown): ProductOption | null {
  if (!isRecord(value) || typeof value.name !== "string") return null;
  const values = Array.isArray(value.values)
    ? value.values.flatMap((entry) => {
        if (!isRecord(entry)) return [];
        const id = asNumber(entry.id);
        if (id == null || typeof entry.title !== "string") return [];
        const colors = Array.isArray(entry.colors)
          ? entry.colors.filter((color): color is string => typeof color === "string")
          : [];
        return [{ id, title: plainText(entry.title), colors }];
      })
    : [];
  return {
    name: plainText(value.name),
    type: typeof value.type === "string" ? value.type : "",
    values,
  };
}

function normalizeProduct(value: unknown): ProductView | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === "string" ? value.id : value.id == null ? "" : String(value.id);
  const title = typeof value.title === "string" ? plainText(value.title) : "";
  if (!id || !title) return null;

  const images = Array.isArray(value.images)
    ? value.images.flatMap((image) => {
        if (!isRecord(image) || typeof image.src !== "string" || image.src.length === 0) {
          return [];
        }
        return [
          {
            src: image.src,
            variantIds: asIdList(image.variant_ids),
            isDefault: image.is_default === true,
          },
        ];
      })
    : [];

  const options = Array.isArray(value.options)
    ? value.options.flatMap((option) => {
        const normalized = normalizeOption(option);
        return normalized ? [normalized] : [];
      })
    : [];

  const variants = Array.isArray(value.variants)
    ? value.variants.flatMap((variant) => {
        const normalized = normalizeVariant(variant);
        return normalized ? [normalized] : [];
      })
    : [];

  return {
    id,
    title,
    description: plainText(typeof value.description === "string" ? value.description : ""),
    images,
    options,
    variants,
  };
}

type PrintifyAddressTo = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  region: string;
  address1: string;
  city: string;
  zip: string;
};

export type PrintifyOrderInput = {
  externalId: string;
  lineItems: { product_id: string; variant_id: number; quantity: number }[];
  addressTo: PrintifyAddressTo;
};

async function printifySend(path: string, body?: unknown): Promise<unknown> {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) {
    throw new PrintifyError("PRINTIFY_API_TOKEN is not set", 500);
  }

  const response = await fetch(`${PRINTIFY_BASE_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": USER_AGENT,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new PrintifyError("Not found", 404);
  }
  if (!response.ok) {
    throw new PrintifyError(`Printify request failed (${response.status})`, response.status);
  }
  return response.json() as Promise<unknown>;
}

async function printifyGet(path: string): Promise<unknown> {
  return printifySend(path);
}

export async function createPrintifyOrder(input: PrintifyOrderInput): Promise<string> {
  const payload = await printifySend(`/shops/${PRINTIFY_SHOP_ID}/orders.json`, {
    external_id: input.externalId,
    line_items: input.lineItems,
    shipping_method: 1,
    send_shipping_notification: false,
    address_to: input.addressTo,
  });
  if (isRecord(payload) && typeof payload.id === "string") return payload.id;
  return "";
}

function readPage(payload: unknown): { items: unknown[]; hasNext: boolean } {
  if (Array.isArray(payload)) return { items: payload, hasNext: false };
  if (!isRecord(payload)) return { items: [], hasNext: false };
  const items = Array.isArray(payload.data) ? payload.data : [];
  const hasNext = typeof payload.next_page_url === "string" && payload.next_page_url.length > 0;
  return { items, hasNext };
}

function productTags(value: unknown): string[] {
  if (!isRecord(value) || !Array.isArray(value.tags)) return [];
  return value.tags.flatMap((tag) => (typeof tag === "string" ? [plainText(tag)] : []));
}

function isRemovedFromShop(title: string): boolean {
  const singleSticker = /\bstickers?\b/i.test(title) && !/\b3[\s-]?packs?\b/i.test(title);
  return (
    /\bheavy fade tees?\b/i.test(title) ||
    /\bdistressed dad hats?\b/i.test(title) ||
    /\blogo cotton pocket tees?\b/i.test(title) ||
    /\btattoo flash zip hoodies?\b/i.test(title) ||
    /\b(?:skelly|scally) throw pillows?\b/i.test(title) ||
    /\bfall pumpkin family logo doormats?\b/i.test(title) ||
    singleSticker
  );
}

function productIdOf(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.id === "string") return value.id;
  if (value.id == null) return null;
  return String(value.id);
}

export async function listProducts(): Promise<ProductSummary[]> {
  try {
    const summaries: ProductSummary[] = [];
    const seen = new Set<string>();
    let page = 1;

    while (page <= MAX_PAGES) {
      const payload = await printifyGet(
        `/shops/${PRINTIFY_SHOP_ID}/products.json?page=${page}`,
      );
      const { items, hasNext } = readPage(payload);
      const pageIds = items.flatMap((item) => {
        const id = productIdOf(item);
        return id ? [id] : [];
      });
      if (pageIds.length > 0 && pageIds.every((id) => seen.has(id))) break;

      for (const item of items) {
        if (isRecord(item) && (item.visible === false || item.is_deleted === true)) continue;
        const product = normalizeProduct(item);
        if (!product || seen.has(product.id) || isRemovedFromShop(product.title)) continue;
        seen.add(product.id);
        summaries.push({
          id: product.id,
          title: product.title,
          imageSrc: imageForVariant(product, initialVariant(product)?.id ?? null),
          priceLabel: priceLabel(product.variants),
          price: startingPrice(product.variants),
          category: categorizeProduct(product.title, productTags(item)),
        });
      }

      if (!hasNext || items.length === 0) break;
      page += 1;
    }

    return summaries;
  } catch (error) {
    console.warn(
      "Printify product list failed",
      error instanceof Error ? error.message : "unknown",
    );
    return [];
  }
}

export const loadProduct = cache(async (id: string): Promise<ProductView> => {
  if (!isProductId(id)) {
    throw new PrintifyError("Not found", 404);
  }
  const payload = await printifyGet(
    `/shops/${PRINTIFY_SHOP_ID}/products/${encodeURIComponent(id)}.json`,
  );
  if (isRecord(payload) && (payload.visible === false || payload.is_deleted === true)) {
    throw new PrintifyError("Not found", 404);
  }
  const product = normalizeProduct(payload);
  if (!product || isRemovedFromShop(product.title)) {
    throw new PrintifyError("Not found", 404);
  }
  return product;
});

export const getProduct = cache(async (id: string): Promise<ProductView | null> => {
  try {
    return await loadProduct(id);
  } catch (error) {
    if (!(error instanceof PrintifyError && error.status === 404)) {
      console.warn(
        "Printify product fetch failed",
        error instanceof Error ? error.message : "unknown",
      );
    }
    return null;
  }
});
