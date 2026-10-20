import type { StaticImageData } from "next/image";
import basketballShorts from "@/art/models/skelly-basketball-shorts-model.jpg";
import heavyFadeTee from "@/art/models/skelly-heavy-fade-tee-model.jpg";
import mensPajamaPants from "@/art/models/skelly-mens-pajama-pants-model.jpg";
import scatterMensPajamaPants from "@/art/models/skelly-scatter-mens-pajama-pants-model.jpg";
import womensPajamaPants from "@/art/models/skelly-womens-pajama-pants-model.jpg";
import scatterWomensPajamaPants from "@/art/models/skelly-scatter-womens-pajama-pants-model.jpg";
import patternWinterGaiter from "@/art/models/skelly-pattern-winter-neck-gaiter-model.jpg";
import patternMidweightGaiter from "@/art/models/skelly-pattern-midweight-neck-gaiter-model.jpg";
import patternLightweightGaiter from "@/art/models/skelly-pattern-lightweight-neck-gaiter-model.jpg";
import tattooWinterGaiter from "@/art/models/tattoo-flash-winter-neck-gaiter-model.jpg";
import tattooMidweightGaiter from "@/art/models/tattoo-flash-midweight-neck-gaiter-model.jpg";
import tattooLightweightGaiter from "@/art/models/tattoo-flash-lightweight-neck-gaiter-model.jpg";
import pocketTee from "@/art/models/pocket-tee-model.jpg";
import twoToneCapBack from "@/art/models/two-tone-cap-back.jpg";
import twoToneCapSide from "@/art/models/two-tone-cap-side.jpg";

function srcOf(image: StaticImageData): string {
  return image.src;
}

const MODEL_MOCKUPS: Record<string, string> = {
  "6ad0fa2538d906cb0703f502": srcOf(basketballShorts),
  "6ad0fa1d38d906cb0703f4f0": srcOf(mensPajamaPants),
  "6ad0fa1838d906cb0703f4e1": srcOf(scatterMensPajamaPants),
  "6ad0fa1438d906cb0703f4cf": srcOf(womensPajamaPants),
  "6ad0fa1038d906cb0703f4ca": srcOf(scatterWomensPajamaPants),
  "6ad054b76b0f2c518e029030": srcOf(heavyFadeTee),
  "6ad00c44e59f52a3c604a786": srcOf(patternWinterGaiter),
  "6ad00c42ef2f0ee1ca04dad4": srcOf(patternMidweightGaiter),
  "6ad00c41b436a5db4d01afac": srcOf(tattooWinterGaiter),
  "6ad00c3fe59f52a3c604a781": srcOf(tattooMidweightGaiter),
  "6ad008e6e59f52a3c604a45d": srcOf(patternLightweightGaiter),
  "6ad008e5e59f52a3c604a45b": srcOf(tattooLightweightGaiter),
  "6acfef973eab4e70cc0b1ddc": srcOf(pocketTee),
};

export function modelMockupSrc(productId: string): string | null {
  return MODEL_MOCKUPS[productId] ?? null;
}

// Extra angle shots appended to the carousel, keyed by Printify product id.
// variantIds limits a shot to matching colors; leave it empty to show on every color.
export type ExtraView = { src: string; variantIds: number[] };

const EXTRA_VIEWS: Record<string, ExtraView[]> = {
  // Skeleton Co Skelly Head Two-Tone Cap: back and side-profile shots on every color.
  "6ad527ab52e33f00a407f7c9": [
    { src: srcOf(twoToneCapBack), variantIds: [] },
    { src: srcOf(twoToneCapSide), variantIds: [] },
  ],
};

export function extraViewSrcs(productId: string, variantId: number | null): string[] {
  return (EXTRA_VIEWS[productId] ?? [])
    .filter(
      (view) =>
        view.variantIds.length === 0 || (variantId != null && view.variantIds.includes(variantId)),
    )
    .map((view) => view.src);
}
