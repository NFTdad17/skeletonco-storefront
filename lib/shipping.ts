export type ShippingAddress = {
  name: string;
  address1: string;
  city: string;
  region: string;
  zip: string;
  country: string;
};

export const shippingMetadataKeys = {
  name: "shipping_name",
  address1: "shipping_address1",
  city: "shipping_city",
  region: "shipping_region",
  zip: "shipping_zip",
  country: "shipping_country",
} as const;

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > max || /[\u0000-\u001F]/.test(trimmed)) return null;
  return trimmed;
}

export function parseShippingAddress(value: unknown): ShippingAddress | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const name = clean(input.name, 80);
  const address1 = clean(input.address1, 200);
  const city = clean(input.city, 80);
  const region = clean(input.region, 80);
  const zip = clean(input.zip, 20);
  const countryRaw = clean(input.country, 2);
  if (!name || !address1 || !city || !region || !zip || !countryRaw) return null;
  if (!/^[A-Za-z]{2}$/.test(countryRaw)) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{0,19}$/.test(zip)) return null;
  return {
    name,
    address1,
    city,
    region,
    zip,
    country: countryRaw.toUpperCase(),
  };
}

export function shippingMetadata(address: ShippingAddress): Record<string, string> {
  return {
    [shippingMetadataKeys.name]: address.name,
    [shippingMetadataKeys.address1]: address.address1,
    [shippingMetadataKeys.city]: address.city,
    [shippingMetadataKeys.region]: address.region,
    [shippingMetadataKeys.zip]: address.zip,
    [shippingMetadataKeys.country]: address.country,
  };
}

export function shippingFromMetadata(
  metadata: Record<string, string> | null | undefined,
): ShippingAddress | null {
  if (!metadata) return null;
  return parseShippingAddress({
    name: metadata[shippingMetadataKeys.name],
    address1: metadata[shippingMetadataKeys.address1],
    city: metadata[shippingMetadataKeys.city],
    region: metadata[shippingMetadataKeys.region],
    zip: metadata[shippingMetadataKeys.zip],
    country: metadata[shippingMetadataKeys.country],
  });
}

export function splitRecipientName(name: string): { first_name: string; last_name: string } {
  const space = name.indexOf(" ");
  if (space === -1) return { first_name: name, last_name: name };
  return {
    first_name: name.slice(0, space),
    last_name: name.slice(space + 1),
  };
}
