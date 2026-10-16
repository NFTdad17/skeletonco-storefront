"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type AnimationEvent } from "react";

const LINES = [
  "Oh hey.",
  "What products are you looking for?",
  "We specialize in rugs.",
  "Alright, quit poking me.",
];

const TYPE_MS = 30;

const SkellyScene = dynamic(() => import("@/components/skelly-scene"), {
  ssr: false,
});

export function SkellyModel() {
  const hoverCount = useRef(0);
  const [open, setOpen] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [formed, setFormed] = useState(false);
  const [typedCount, setTypedCount] = useState(0);
  const line = LINES[lineIndex] ?? LINES[0];

  function show() {
    const index = hoverCount.current % LINES.length;
    hoverCount.current += 1;
    setLineIndex(index);
    setTypedCount(0);
    setFormed(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setOpen(true);
  }

  function hide() {
    setOpen(false);
    setFormed(false);
    setTypedCount(0);
  }

  useEffect(() => {
    if (!open || !formed || typedCount >= line.length) return;
    const timer = window.setTimeout(() => setTypedCount((count) => count + 1), TYPE_MS);
    return () => window.clearTimeout(timer);
  }, [formed, line.length, open, typedCount]);

  function onBubbleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.animationName !== "skelly-bubble-in") return;
    setFormed(true);
  }

  return (
    <div className="skelly-model" onMouseEnter={show} onMouseLeave={hide}>
      <div className="skelly-canvas" aria-hidden="true">
        <SkellyScene />
      </div>
      {open ? (
        <div className="skelly-bubble" onAnimationEnd={onBubbleAnimationEnd}>
          <p className="skelly-bubble-copy">
            <span className="skelly-bubble-measure">{line}</span>
            <span className="skelly-bubble-typed">{line.slice(0, typedCount)}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
