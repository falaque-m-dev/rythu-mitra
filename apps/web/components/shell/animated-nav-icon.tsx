"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedNavIconProps {
  icon: LucideIcon;
  active: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function AnimatedNavIcon({
  icon: Icon,
  active,
  className,
  size = "md"
}: AnimatedNavIconProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className={cn(
        "relative flex items-center justify-center rounded-2xl transition-colors",
        size === "md" ? "h-10 w-10" : "h-8 w-8",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground",
        className
      )}
      animate={
        reduceMotion
          ? undefined
          : active
            ? { scale: [1, 1.08, 0.98, 1], rotate: [0, -5, 5, 0], y: -1 }
            : { scale: 1, rotate: 0, y: 0 }
      }
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <Icon
        className={cn(
          "transition-all",
          size === "md" ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]",
          active ? "stroke-[2.4]" : "stroke-2"
        )}
        aria-hidden="true"
      />
      {active ? (
        <motion.span
          layoutId="nav-active-dot"
          className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        />
      ) : null}
    </motion.span>
  );
}
