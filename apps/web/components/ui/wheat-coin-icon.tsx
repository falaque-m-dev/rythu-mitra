import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface WheatCropIconProps {
  className?: string;
  size?: number;
  alt?: string;
}

/**
 * Custom Wheat Crop icon using the vibrant golden wheat crop artwork with green leaves.
 */
export function WheatCropIcon({
  className = "w-6 h-6",
  size,
  alt = "Rythu Mitra AI Assistant"
}: WheatCropIconProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Image
        src="/images/wheat-crop-ai.png"
        alt={alt}
        width={size || 48}
        height={size || 48}
        className="h-full w-full object-contain pointer-events-none drop-shadow-sm"
        priority
      />
    </span>
  );
}

// Alias for compatibility
export const WheatCoinIcon = WheatCropIcon;
export default WheatCropIcon;
