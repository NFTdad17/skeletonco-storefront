import { formatDollars } from "@/lib/format";
import type { ProductImage, ProductOption, ProductVariant, ProductView } from "@/lib/product";

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

function isColorOption(option: ProductOption): boolean {
  return option.type === "color" || /color/i.test(option.name);
}

export function offeredOptions(product: ProductView): ProductOption[] {
  const enabledIds = new Set(enabledVariants(product).flatMap((variant) => variant.optionIds));
  return product.options
    .map((option) => {
      if (!isColorOption(option)) return option;
      return {
        ...option,
        values: option.values.filter((value) => enabledIds.has(value.id)),
      };
    })
    .filter((option) => option.values.length > 0);
}

function cameraLabel(src: string): string {
  try {
    return new URL(src).searchParams.get("camera_label") ?? "";
  } catch {
    return "";
  }
}

function isWornCamera(camera: string): boolean {
  return /person/i.test(camera);
}

function isFrontWorn(camera: string): boolean {
  return isWornCamera(camera) && /front/i.test(camera);
}

function isStyledScene(camera: string): boolean {
  return camera === "lifestyle" || camera === "hanging" || camera === "size-chart" || camera.startsWith("context");
}

function flatRank(camera: string): number {
  if (camera === "flat-lay" || camera === "folded") return 0;
  if (camera.startsWith("flat") || camera.startsWith("folded")) return 1;
  return 2;
}

function primaryFlatLay(shots: ProductImage[]): ProductImage | null {
  const ranked = shots
    .map((image, index) => ({ image, index, rank: flatRank(cameraLabel(image.src)) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index);
  const best = ranked[0];
  if (!best) return null;
  if (best.rank < 2) return best.image;
  return shots.find((image) => cameraLabel(image.src) === "front") ?? shots[0];
}

export function productGallery(
  product: ProductView,
  variantId: number | null,
  modelSrc: string | null,
  extraSrcs: string[] = [],
): ProductImage[] {
  const matched = imagesForVariant(product, variantId);
  const worn = matched.filter((image) => isWornCamera(cameraLabel(image.src)));
  const shots = matched.filter((image) => {
    const camera = cameraLabel(image.src);
    return !isWornCamera(camera) && !isStyledScene(camera);
  });
  const primary = primaryFlatLay(shots);
  const rest = shots.filter((image) => image !== primary);
  const wornShots = worn.filter((image) => !(modelSrc && isFrontWorn(cameraLabel(image.src))));
  const gallery: ProductImage[] = [];
  if (primary) gallery.push({ ...primary, isDefault: true });
  if (modelSrc && worn.length > 0) {
    gallery.push({
      src: modelSrc,
      variantIds: worn[0]?.variantIds ?? [],
      isDefault: false,
    });
  }
  gallery.push(...wornShots.map((image) => ({ ...image, isDefault: false })));
  gallery.push(...rest.map((image) => ({ ...image, isDefault: false })));
  gallery.push(
    ...extraSrcs.map((src) => ({
      src,
      variantIds: variantId != null ? [variantId] : [],
      isDefault: false,
    })),
  );
  if (gallery.length > 0) return gallery;
  const fallback = worn[0] ?? matched[0];
  return fallback ? [{ ...fallback, isDefault: true }] : [];
}

export function imagesForVariant(product: ProductView, variantId: number | null): ProductImage[] {
  if (variantId != null) {
    const matched = product.images.filter((image) => image.variantIds.includes(variantId));
    if (matched.length > 0) return matched;
  }
  const shared = product.images.filter((image) => image.variantIds.length === 0);
  if (shared.length > 0) return shared;
  const fallback = product.images.find((image) => image.isDefault) ?? product.images[0];
  return fallback ? [fallback] : [];
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

export function startingPrice(variants: ProductVariant[]): number | null {
  const prices = variants.filter((variant) => variant.enabled).map((variant) => variant.price);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export function priceLabel(variants: ProductVariant[]): string | null {
  const min = startingPrice(variants);
  if (min == null) return null;
  const enabled = variants.filter((variant) => variant.enabled);
  const max = Math.max(...enabled.map((variant) => variant.price));
  return min === max ? formatDollars(min) : `From ${formatDollars(min)}`;
}
