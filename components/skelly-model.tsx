"use client";

import dynamic from "next/dynamic";

const SkellyScene = dynamic(() => import("@/components/skelly-scene"), {
  ssr: false,
});

export function SkellyModel() {
  return (
    <div className="skelly-model" aria-hidden="true">
      <SkellyScene />
    </div>
  );
}
