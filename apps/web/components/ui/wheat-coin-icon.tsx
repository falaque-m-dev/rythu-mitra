import React from "react";

interface WheatCoinIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * Wheat stalk icon inspired by the iconic wheat corn stalks on the Indian 1 Rupee coin.
 * Features curved graceful stems with alternating full grains/awned ears.
 */
export function WheatCoinIcon({
  className = "w-6 h-6",
  size,
  width,
  height,
  ...props
}: WheatCoinIconProps) {
  const w = size ?? width ?? 24;
  const h = size ?? height ?? 24;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Central arching stalk stem */}
      <path d="M4 21c2.5-3.5 5.5-8 7.5-13.5C12.5 5 13.5 3 14.5 2" />
      {/* Top terminal grain with awn (whisker) */}
      <path d="M14.5 2c.8 1.5.8 3-.2 4-1 .8-2.2.8-2.8-.5" fill="currentColor" fillOpacity="0.2" />
      <path d="M14.5 2c.6-1.2 1.8-1.8 3-1.8" />
      {/* Top Right grain */}
      <path d="M13.8 6.5c1.8-.4 3.4.2 3.8 1.5.4 1.2-.6 2.4-2.2 2.5" fill="currentColor" fillOpacity="0.2" />
      <path d="M17.6 8c1.5-.4 2.8-.2 3.8.4" />
      {/* Upper Left grain */}
      <path d="M11.5 8c-1.8-.3-3.2.4-3.5 1.7-.3 1.2.8 2.3 2.5 2.3" fill="currentColor" fillOpacity="0.2" />
      <path d="M8 9.7c-1.5-.3-2.7-.1-3.6.5" />
      {/* Middle Right grain */}
      <path d="M11.8 11.5c1.8-.3 3.3.4 3.6 1.7.3 1.2-.7 2.3-2.4 2.4" fill="currentColor" fillOpacity="0.2" />
      <path d="M15.4 13.2c1.5-.3 2.7-.1 3.6.5" />
      {/* Lower Left grain */}
      <path d="M9.5 13.5c-1.7-.2-3.1.5-3.3 1.7-.3 1.2.8 2.2 2.4 2.2" fill="currentColor" fillOpacity="0.2" />
      <path d="M6.2 15.2c-1.4-.2-2.5 0-3.3.6" />
      {/* Lower Right grain */}
      <path d="M9.2 16.8c1.6-.2 3 .5 3.2 1.6.3 1.1-.6 2.1-2.2 2.2" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

export default WheatCoinIcon;
