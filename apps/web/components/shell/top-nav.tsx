"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Languages, Moon, Search, Sprout, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocale } from "@/components/providers/locale-provider";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface TopNavProps {
  onOpenCommand: () => void;
}

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: SunMoon }
];

export function TopNav({ onOpenCommand }: TopNavProps) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const currentThemeIndex = themes.findIndex((option) => option.value === theme);
  const nextTheme = themes[(currentThemeIndex + 1) % themes.length];

  const toggleLanguage = () => setLocale(locale === "en" ? "te" : "en");

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("app.name")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-subtle">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-black tracking-tight text-foreground">{t("app.name")}</span>
            <span className="mt-0.5 hidden text-[10px] font-medium text-muted-foreground sm:block">
              {t("app.tagline")}
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full border border-border/70 bg-muted/50 p-1 md:flex"
          aria-label="Primary"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="top-nav-active"
                    className="absolute inset-0 rounded-full bg-card shadow-subtle"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className="relative z-10">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenCommand}
                className="h-9 w-9 rounded-full"
                aria-label={t("actions.command")}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("actions.command")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={toggleLanguage}
                aria-label={t("actions.language")}
              >
                <Languages className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{locale === "en" ? "English" : "తెలుగు"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("actions.language")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setTheme(nextTheme.value)}
                aria-label={t("actions.theme")}
              >
                {(() => {
                  const Icon = nextTheme.icon;
                  return <Icon className="h-4 w-4" aria-hidden="true" />;
                })()}
                <span className="sr-only">{nextTheme.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("actions.theme")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
