"use client";

import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdvisorChat } from "@/components/advisor/advisor-chat";
import { useLocale } from "@/components/providers/locale-provider";

export function Advisor() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-5 max-w-2xl">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          {t("advisor.title")}
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("advisor.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("advisor.desc")}</p>
      </header>

      <Card className="flex h-[72dvh] flex-col overflow-hidden">
        <AdvisorChat />
      </Card>
    </div>
  );
}
