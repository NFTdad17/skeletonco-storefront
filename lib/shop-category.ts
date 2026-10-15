import type { ProductCategory } from "@/lib/product";

const CATEGORY_RULES: { category: ProductCategory; pattern: RegExp }[] = [
  {
    category: "jackets",
    pattern: /\bjackets?\b/i,
  },
  {
    category: "long-sleeves",
    pattern: /\b(?:hoodies?|long[\s-]?sleeves?)\b/i,
  },
  {
    category: "headwear",
    pattern:
      /\b(?:bucket[\s-]?hats?|neck[\s-]?gaiters?|bandanas?|baseball caps?|trucker caps?|snapbacks?|dad hats?|beanies?|hats?|caps?)\b/i,
  },
  {
    category: "tees",
    pattern: /\b(?:pocket[\s-]?tees?|t[\s-]?shirts?|tees?)\b/i,
  },
  {
    category: "miscellaneous",
    pattern: /\b(?:fanny[\s-]?packs?|coffee mugs?|mugs?|cups?|stickers?)\b/i,
  },
];

function matchCategory(text: string): ProductCategory | null {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return null;
}

function matchWholeTag(tag: string): ProductCategory | null {
  const trimmed = tag.trim();
  for (const rule of CATEGORY_RULES) {
    const whole = new RegExp(`^(?:${rule.pattern.source})$`, rule.pattern.flags);
    if (whole.test(trimmed)) return rule.category;
  }
  return null;
}

export function categorizeProduct(title: string, tags: string[] = []): ProductCategory | null {
  const fromTitle = matchCategory(title);
  if (fromTitle) return fromTitle;

  for (const tag of tags) {
    const fromTag = matchWholeTag(tag);
    if (fromTag) return fromTag;
  }

  return null;
}
