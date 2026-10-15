"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

const SCALE = 3;
const HOVER_QUERY = "(hover: hover) and (pointer: fine) and (min-width: 48rem)";

type ZoomView = {
  panelTop: number;
  panelLeft: number;
  panelSize: number;
  imageWidth: number;
  imageHeight: number;
  imageX: number;
  imageY: number;
  lensTop: number;
  lensLeft: number;
  lensWidth: number;
  lensHeight: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function containedBox(frameWidth: number, frameHeight: number, imageWidth: number, imageHeight: number) {
  const frameRatio = frameWidth / frameHeight;
  const imageRatio = imageWidth / imageHeight;
  if (imageRatio > frameRatio) {
    const height = frameWidth / imageRatio;
    return { offsetX: 0, offsetY: (frameHeight - height) / 2, width: frameWidth, height };
  }
  const width = frameHeight * imageRatio;
  return { offsetX: (frameWidth - width) / 2, offsetY: 0, width, height: frameHeight };
}

export function HoverZoom({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [zoom, setZoom] = useState<ZoomView | null>(null);

  useEffect(() => {
    const media = window.matchMedia(HOVER_QUERY);
    const sync = () => {
      const next = media.matches;
      setEnabled(next);
      if (!next) setZoom(null);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function move(event: MouseEvent<HTMLElement>) {
    if (!enabled) return;
    const frame = frameRef.current?.getBoundingClientRect();
    const image = imageRef.current;
    if (!frame || !image || frame.width < 1 || frame.height < 1) return;

    const naturalWidth = image.naturalWidth || frame.width;
    const naturalHeight = image.naturalHeight || frame.height;
    const fit = containedBox(frame.width, frame.height, naturalWidth, naturalHeight);
    const localX = clamp(event.clientX - frame.left, fit.offsetX, fit.offsetX + fit.width);
    const localY = clamp(event.clientY - frame.top, fit.offsetY, fit.offsetY + fit.height);
    const across = (localX - fit.offsetX) / fit.width;
    const down = (localY - fit.offsetY) / fit.height;

    const panelSize = Math.round(Math.min(440, Math.max(300, fit.width * 0.85)));
    const imageWidth = fit.width * SCALE;
    const imageHeight = fit.height * SCALE;
    const margin = 16;
    const gap = 16;
    let panelLeft = frame.right + gap;
    if (panelLeft + panelSize > window.innerWidth - margin) panelLeft = frame.left - gap - panelSize;
    panelLeft = clamp(panelLeft, margin, Math.max(margin, window.innerWidth - margin - panelSize));
    let panelTop = event.clientY - panelSize / 2;
    panelTop = clamp(panelTop, margin, Math.max(margin, window.innerHeight - margin - panelSize));

    const lensWidth = Math.min(panelSize / SCALE, fit.width);
    const lensHeight = Math.min(panelSize / SCALE, fit.height);
    const lensLeft = clamp(localX - lensWidth / 2, fit.offsetX, fit.offsetX + fit.width - lensWidth);
    const lensTop = clamp(localY - lensHeight / 2, fit.offsetY, fit.offsetY + fit.height - lensHeight);

    setZoom({
      panelTop,
      panelLeft,
      panelSize,
      imageWidth,
      imageHeight,
      imageX: panelSize / 2 - across * imageWidth,
      imageY: panelSize / 2 - down * imageHeight,
      lensTop,
      lensLeft,
      lensWidth,
      lensHeight,
    });
  }

  return (
    <span
      ref={frameRef}
      className="zoom-frame"
      onMouseEnter={move}
      onMouseMove={move}
      onMouseLeave={() => setZoom(null)}
    >
      {/* Printify returns image URLs from more than one host. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imageRef} src={src} alt={alt} className={className} />
      {zoom ? (
        <span
          className="zoom-lens"
          aria-hidden="true"
          style={{
            top: zoom.lensTop,
            left: zoom.lensLeft,
            width: zoom.lensWidth,
            height: zoom.lensHeight,
          }}
        />
      ) : null}
      {enabled && zoom
        ? createPortal(
            <div
              className="zoom-preview"
              aria-hidden="true"
              style={{
                top: zoom.panelTop,
                left: zoom.panelLeft,
                width: zoom.panelSize,
                height: zoom.panelSize,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="zoom-preview-image"
                style={{
                  width: zoom.imageWidth,
                  height: zoom.imageHeight,
                  transform: `translate(${zoom.imageX}px, ${zoom.imageY}px)`,
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
