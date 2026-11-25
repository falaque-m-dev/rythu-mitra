"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/providers/locale-provider";
import { AnimatedNavIcon } from "@/components/shell/animated-nav-icon";
import { primaryMobileNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-[26px] border border-border/80 bg-card/95 shadow-elevated backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.4rem, var(--safe-bottom))" }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-4 gap-1 px-1.5 pt-1.5">
        {primaryMobileNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-bold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <AnimatedNavIcon icon={item.icon} active={isActive} />
              <span className="max-w-full truncate px-1 pt-0.5">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
