export function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function plainText(value: string): string {
  return value
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function metaDescription(value: string): string {
  const text = plainText(value).replace(/\s+/g, " ").trim();
  if (text.length <= 155) return text;
  const clipped = text.slice(0, 155);
  const lastSpace = clipped.lastIndexOf(" ");
  const shortened = (lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trimEnd();
  return `${shortened}…`;
}
