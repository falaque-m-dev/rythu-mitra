"use client";

import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocale } from "@/components/providers/locale-provider";
import { TopNav } from "@/components/shell/top-nav";
import { MobileNav } from "@/components/shell/mobile-nav";
import { CommandMenu } from "@/components/shell/command-menu";
import { AssistantDock } from "@/components/shell/assistant-dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="app-bg flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <TopNav onOpenCommand={() => setCommandOpen(true)} />
        <main id="main-content" className="flex-1 pb-28 md:pb-12">
          {children}
        </main>
        <footer className="hidden border-t border-border/60 py-6 text-center text-xs text-muted-foreground md:block">
          <p className="font-semibold text-foreground">{t("app.name")}</p>
          <p className="mt-1">{t("footer.note")}</p>
        </footer>
        <MobileNav />
        <AssistantDock />
        <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    </TooltipProvider>
  );
}
