"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { WheatCoinIcon } from "@/components/ui/wheat-coin-icon";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AdvisorChat } from "@/components/advisor/advisor-chat";
import { useLocale } from "@/components/providers/locale-provider";
import { OPEN_ASSISTANT_EVENT } from "@/lib/assistant";

export function AssistantDock() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="fixed bottom-[calc(5.35rem+var(--safe-bottom))] right-4 z-40 md:bottom-6 md:right-6">
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("assistant.open")}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0E5A2A_0%,#1F7A3D_55%,#6DBE45_100%)] text-white shadow-[0_18px_42px_-16px_rgba(8,61,28,0.55)] outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          whileTap={reduceMotion ? undefined : { scale: 0.93 }}
          animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {!reduceMotion ? (
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" aria-hidden="true" />
          ) : null}
          <span className="absolute inset-1 rounded-full border border-white/25" aria-hidden="true" />
          <WheatCoinIcon className="relative h-8 w-8 scale-110" aria-hidden="true" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-black text-accent-foreground shadow">
            AI
          </span>
        </motion.button>
      </div>

      <DialogContent className="flex h-[min(88dvh,720px)] w-[calc(100%-1rem)] max-w-md flex-col gap-0 overflow-hidden rounded-[28px] border-border/80 p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">{t("advisor.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("assistant.openHint")}</DialogDescription>
        <AdvisorChat compact />
      </DialogContent>
    </Dialog>
  );
}
