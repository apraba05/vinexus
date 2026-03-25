"use client";

import { useState } from "react";
import Image from "next/image";

interface BrandLogoProps {
  iconSize?: number;
  textSize?: number;
  textColor?: string;
  muted?: boolean;
}

export default function BrandLogo({
  iconSize = 28,
  textSize = 24,
  textColor = "currentColor",
  muted = false,
}: BrandLogoProps) {
  const [iconSrc, setIconSrc] = useState("/brand-icon.png");

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.max(8, Math.round(iconSize * 0.32)),
        lineHeight: 1,
        color: textColor,
      }}
    >
      <Image
        src={iconSrc}
        alt="Vinexus"
        width={iconSize}
        height={iconSize}
        priority
        unoptimized
        onError={() => {
          if (iconSrc !== "/icon.png") {
            setIconSrc("/icon.png");
          }
        }}
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: Math.max(6, Math.round(iconSize * 0.24)),
          display: "block",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: textSize,
          fontWeight: 800,
          letterSpacing: "-0.06em",
          color: textColor,
          opacity: muted ? 0.9 : 1,
          fontFamily: "var(--font-sans, Inter, sans-serif)",
          textTransform: "uppercase",
        }}
      >
        Vinexus
      </span>
    </span>
  );
}
