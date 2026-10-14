export const MAX_CART_QUANTITY = 20;
export const MAX_CART_ITEMS = 20;

export type CartLine = {
  productId: string;
  variantId: number;
  title: string;
  variantTitle: string;
  unitAmount: number;
  imageSrc: string | null;
  quantity: number;
};

export type CheckoutItem = {
  productId: string;
  variantId: number;
  quantity: number;
};

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_CART_QUANTITY, Math.max(1, Math.round(quantity)));
}
