"use client";

import { useState } from "react";

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
  const [iconSrc, setIconSrc] = useState<string>("/favicon.png");
  const [iconFailed, setIconFailed] = useState(false);

  const handleIconError = () => {
    setIconSrc((current) => {
      if (current === "/favicon.png") return "/brand-icon.png";
      if (current === "/brand-icon.png") return "/icon.png";
      // All PNG fallbacks exhausted — render the SVG text fallback instead
      setIconFailed(true);
      return current;
    });
  };

  const radius = Math.max(6, Math.round(iconSize * 0.24));
  const imgStyle: React.CSSProperties = {
    width: iconSize,
    height: iconSize,
    borderRadius: radius,
    display: "block",
    flexShrink: 0,
  };

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
      {iconFailed ? (
        // SVG fallback — renders without any network request
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 32 32"
          style={imgStyle}
          aria-hidden="true"
        >
          <rect width="32" height="32" rx={radius} fill="#1a6b8a" />
          <text
            x="16"
            y="23"
            textAnchor="middle"
            fontSize="18"
            fontWeight="800"
            fontFamily="Inter, sans-serif"
            fill="#e0f2fe"
          >
            V
          </text>
        </svg>
      ) : (
        // Use a native img tag to avoid Next.js Image processing in Electron
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc}
          alt="Vinexus"
          width={iconSize}
          height={iconSize}
          onError={handleIconError}
          style={imgStyle}
        />
      )}
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
