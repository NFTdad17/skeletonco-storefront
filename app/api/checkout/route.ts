import { NextRequest } from "next/server";
import { MAX_CART_ITEMS, MAX_CART_QUANTITY, type CheckoutItem } from "@/lib/cart";
import { imageForVariant, findVariant } from "@/lib/variants";
import { PrintifyError, PRINTIFY_SHOP_ID, loadProduct } from "@/lib/printify";
import { parseShippingAddress, shippingMetadata } from "@/lib/shipping";
import { getStripe } from "@/lib/stripe";

const STRIPE_MINIMUM_CENTS = 50;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function siteOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = (forwardedHost ?? request.headers.get("host") ?? "").split(",")[0]?.trim();
  const proto = (request.headers.get("x-forwarded-proto") ?? "https").split(",")[0]?.trim();
  if (!host) return request.nextUrl.origin;
  return `${proto}://${host}`;
}

function parseItems(body: unknown): CheckoutItem[] | null {
  if (!body || typeof body !== "object") return null;
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_CART_ITEMS) return null;

  const parsed: CheckoutItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") return null;
    const productId = (item as { productId?: unknown }).productId;
    const variantId = (item as { variantId?: unknown }).variantId;
    const quantity = (item as { quantity?: unknown }).quantity;
    if (typeof productId !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(productId)) return null;
    if (typeof variantId !== "number" || !Number.isInteger(variantId) || variantId <= 0) {
      return null;
    }
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_CART_QUANTITY
    ) {
      return null;
    }
    parsed.push({ productId, variantId, quantity });
  }
  return parsed;
}

function mergeItems(items: CheckoutItem[]): CheckoutItem[] | null {
  const merged = new Map<string, CheckoutItem>();
  for (const item of items) {
    const key = `${item.productId}:${item.variantId}`;
    const quantity = (merged.get(key)?.quantity ?? 0) + item.quantity;
    if (quantity > MAX_CART_QUANTITY) return null;
    merged.set(key, { ...item, quantity });
  }
  return [...merged.values()];
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Add something to the cart before checking out.", 400);
  }

  const parsed = parseItems(body);
  const items = parsed ? mergeItems(parsed) : null;
  if (!items) {
    return jsonError("Add something to the cart before checking out.", 400);
  }
  const shipping = parseShippingAddress(
    body && typeof body === "object" ? (body as { shipping?: unknown }).shipping : null,
  );
  if (!shipping) {
    return jsonError("Enter a complete shipping address. Country is a two-letter code.", 400);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonError("Checkout is unavailable right now.", 503);
  }

  try {
    const lineItems = [];
    const metaItems = [];

    for (const item of items) {
      const product = await loadProduct(item.productId);
      const variant = findVariant(product, item.variantId);
      const unitAmount = variant ? Math.round(variant.price) : 0;
      if (!variant || !variant.enabled || unitAmount < STRIPE_MINIMUM_CENTS) {
        return jsonError("One of those items isn't available.", 400);
      }

      const name =
        variant.title && variant.title !== product.title
          ? `${product.title} / ${variant.title}`
          : product.title;
      const imageSrc = imageForVariant(product, variant.id);
      const images = imageSrc?.startsWith("https://") ? [imageSrc] : [];

      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: {
            name: name.slice(0, 250),
            ...(images.length > 0 ? { images } : {}),
            metadata: {
              printify_product_id: product.id,
              printify_variant_id: String(variant.id),
            },
          },
        },
      });
      metaItems.push({
        product_id: product.id,
        variant_id: variant.id,
        quantity: item.quantity,
      });
    }

    const origin = siteOrigin(request);
    const itemsMeta = JSON.stringify(metaItems);
    const metadata: Record<string, string> = {
      printify_shop_id: PRINTIFY_SHOP_ID,
      ...shippingMetadata(shipping),
    };
    if (itemsMeta.length <= 500) {
      metadata.items = itemsMeta;
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    });

    if (!session.url) {
      return jsonError("Checkout didn't start. Please try again.", 502);
    }
    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof PrintifyError && error.status === 404) {
      return jsonError("One of those items isn't available.", 400);
    }
    console.error("Checkout failed", error instanceof Error ? error.message : "unknown");
    return jsonError("Checkout is unavailable right now.", 503);
  }
}
