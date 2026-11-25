"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Info, Loader2, MapPin, Search, Sprout, TrendingDown, TrendingUp } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/locale-provider";
import { ApiError, getMandiPrices } from "@/lib/api";
import type { MandiResult } from "@/lib/types";
import { commodityCategory, getCropForCommodity } from "@/lib/content";
import { formatCurrency, cn } from "@/lib/utils";

type Filter = "all" | "cereals" | "spices" | "vegetables";

export function MandiPanel() {
  const { locale, t } = useLocale();
  const [data, setData] = useState<MandiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const handleFailure = useCallback((err: unknown) => {
    const message = err instanceof ApiError ? err.message : "Could not load prices.";
    setError(message);
    toast.error(message);
  }, []);

  useEffect(() => {
    let active = true;
    getMandiPrices()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (active) handleFailure(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [handleFailure]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    getMandiPrices()
      .then((result) => setData(result))
      .catch(handleFailure)
      .finally(() => setLoading(false));
  }, [handleFailure]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.commodities.filter((item) => {
      if (filter !== "all" && commodityCategory(item.id, item.name_en) !== filter) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        item.name_en,
        item.name_te,
        item.market_en,
        item.market_te,
        item.variety
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [data, search, filter]);

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: t("mandi.all") },
    { value: "cereals", label: t("mandi.cereals") },
    { value: "spices", label: t("mandi.spices") },
    { value: "vegetables", label: t("mandi.vegetables") }
  ];

  return (
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:max-w-7xl">
        <header className="max-w-2xl">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {t("mandi.title")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{t("mandi.desc")}</p>
        {data?.updated_at ? (
          <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
            {t("mandi.updated")}: {data.updated_at}
          </p>
        ) : null}
        {data?.mode === "curated" ? (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground dark:text-accent" aria-hidden="true" />
            <span>
              <span className="font-bold text-foreground">{t("mandi.curated")}.</span>{" "}
              {t("mandi.curatedHint")}
            </span>
          </div>
        ) : null}
      </header>

      <div className="relative mt-5">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("mandi.search")}
          aria-label={t("mandi.search")}
          className="h-12 rounded-full border-border/80 bg-card pl-11 shadow-subtle"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((item) => {
          const active = filter === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "relative shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                active ? "text-primary-foreground" : "bg-card text-muted-foreground shadow-subtle"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="mandi-filter-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
              {t("common.loading")}…
            </CardContent>
          </Card>
        ) : null}

        {error && !loading ? (
          <Card className="border-destructive/40">
            <CardContent className="flex items-center justify-between gap-3 p-6">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>
                {t("actions.retry")}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">{t("mandi.empty")}</CardContent>
          </Card>
        ) : null}

        {!loading && !error ? (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] sm:gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, index) => {
                const crop = getCropForCommodity(item.id, item.name_en);
                const up = item.trend === "up";
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.12) }}
                  >
                      <Card className="overflow-hidden border-border/70 shadow-card">
                        <CardContent className="flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4 lg:px-5">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-16 bg-muted">
                          {crop ? (
                            <Image
                              src={crop.image}
                              alt={crop.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-primary/60">
                              <Sprout className="h-6 w-6" aria-hidden="true" />
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                        </div>

                          <div className="w-full min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h2 className="truncate text-sm font-black text-foreground">
                                {locale === "te" ? item.name_te : item.name_en}
                              </h2>
                              <p className="truncate text-[11px] text-muted-foreground">{item.variety}</p>
                            </div>
                            <Badge
                              variant={up ? "success" : "destructive"}
                              className="shrink-0 gap-1 rounded-full px-2 py-0.5 text-[10px]"
                            >
                              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {item.change}
                            </Badge>
                          </div>

                          <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {locale === "te" ? item.market_te : item.market_en}
                          </p>

                          <div className="mt-1.5 flex items-baseline gap-1">
                            <p className="text-lg font-black text-primary">
                              <NumberFlow
                                value={item.modal_price}
                                format={{ style: "currency", currency: "INR", maximumFractionDigits: 1 }}
                              />
                            </p>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {t("mandi.perKg")}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {t("mandi.range")}: {formatCurrency(item.min_price)} – {formatCurrency(item.max_price)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </div>
  );
}
