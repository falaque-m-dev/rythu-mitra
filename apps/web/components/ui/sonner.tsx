"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/providers/theme-provider";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      position="top-center"
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border bg-card text-card-foreground shadow-elevated font-sans",
          title: "text-sm font-semibold",
          description: "text-sm text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
          error: "border-destructive/40",
          warning: "border-accent/50",
          success: "border-primary/40"
        }
      }}
    />
  );
}
