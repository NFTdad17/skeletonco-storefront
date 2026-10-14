import { formatDollars } from "@/lib/format";
import type { ProductVariant, ProductView } from "@/lib/product";

export function enabledVariants(product: ProductView): ProductVariant[] {
  return product.variants.filter((variant) => variant.enabled);
}

export function initialVariant(product: ProductView): ProductVariant | null {
  const enabled = enabledVariants(product);
  return enabled.find((variant) => variant.isDefault) ?? enabled[0] ?? null;
}

export function variantMatching(
  product: ProductView,
  optionIds: number[],
): ProductVariant | null {
  const enabled = enabledVariants(product);
  const exact = enabled.find(
    (variant) =>
      variant.optionIds.length === optionIds.length &&
      optionIds.every((id) => variant.optionIds.includes(id)),
  );
  if (exact) return exact;
  return (
    enabled.find((variant) => optionIds.every((id) => variant.optionIds.includes(id))) ??
    null
  );
}

export function findVariant(
  product: ProductView,
  variantId: number,
): ProductVariant | null {
  return product.variants.find((variant) => variant.id === variantId) ?? null;
}

export function imageForVariant(
  product: ProductView,
  variantId: number | null,
): string | null {
  if (variantId != null) {
    const matched = product.images.find((image) => image.variantIds.includes(variantId));
    if (matched) return matched.src;
  }
  const fallback = product.images.find((image) => image.isDefault) ?? product.images[0];
  return fallback?.src ?? null;
}

export function priceLabel(variants: ProductVariant[]): string | null {
  const prices = variants.filter((variant) => variant.enabled).map((variant) => variant.price);
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatDollars(min) : `From ${formatDollars(min)}`;
}
