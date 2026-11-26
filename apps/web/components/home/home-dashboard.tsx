"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  CloudRain,
  Droplets,
  Leaf,
  Loader2,
  MapPin,
  ScanLine,
  TrendingDown,
  TrendingUp,
  Wind
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlurFade } from "@/components/magic/blur-fade";
import { useLocale } from "@/components/providers/locale-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { getMandiPrices, getWeather } from "@/lib/api";
import type { MandiCommodity, MandiResult, WeatherResult } from "@/lib/types";
import { getCropForCommodity, navIconMap, quickAccessTones } from "@/lib/content";
import { getWeatherVisual } from "@/lib/weather";
import { openAssistant } from "@/lib/assistant";
import { formatCurrency, cn } from "@/lib/utils";
import theme from "@/theme";

export function HomeDashboard() {
  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [mandi, setMandi] = useState<MandiResult | null>(null);
  const [mandiError, setMandiError] = useState(false);
  const [mandiLoading, setMandiLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const region = theme.weatherRegions[0];
    getWeather(region.lat, region.lon, region.name, locale)
      .then((result) => {
        if (active) {
          setWeather(result);
          setWeatherError(false);
        }
      })
      .catch(() => {
        if (active) setWeatherError(true);
      })
      .finally(() => {
        if (active) setWeatherLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    let active = true;
    getMandiPrices()
      .then((result) => {
        if (active) {
          setMandi(result);
          setMandiError(false);
        }
      })
      .catch(() => {
        if (active) setMandiError(true);
      })
      .finally(() => {
        if (active) setMandiLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const weatherVisual = useMemo(
    () => getWeatherVisual(weather?.condition_code, weather?.is_day ?? true),
    [weather?.condition_code, weather?.is_day]
  );
  const WeatherIcon = weatherVisual.icon;
  const today = weather?.forecast?.[0];
  const marketItems = mandi?.commodities.slice(0, 3) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
      <div className="grid gap-5 lg:grid-cols-12">
        <BlurFade className="lg:col-span-7">
          <section className="relative overflow-hidden rounded-[30px] bg-primaryDark text-white shadow-elevated">
            <Image
              src={theme.images.hero}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-[62%_center] opacity-80"
            />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(8,61,28,0.98)_0%,rgba(8,61,28,0.86)_34%,rgba(8,61,28,0.35)_66%,rgba(8,61,28,0.08)_100%)]" />
            <div className="relative flex min-h-[290px] flex-col justify-between p-5 sm:min-h-[320px] sm:p-7">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur">
                  <Leaf className="h-3 w-3" aria-hidden="true" />
                  {t("app.promise")}
                </p>
                <h1 className="mt-4 max-w-sm text-3xl font-black leading-[1.05] tracking-tight text-balance sm:text-4xl">
                  {t("home.subtitle")}
                </h1>
                <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-white/80">
                  {t("home.lead")}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild className="h-11 rounded-full bg-white px-5 text-primary hover:bg-white/90">
                  <Link href="/doctor">
                    <ScanLine className="h-4 w-4" aria-hidden="true" />
                    {t("home.scanNow")}
                  </Link>
                </Button>
                <Button
                  type="button"
                  onClick={openAssistant}
                  variant="outline"
                  className="h-11 rounded-full border-white/30 bg-white/10 px-5 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
                  <Leaf className="h-4 w-4" aria-hidden="true" />
                  {t("home.askAi")}
                </Button>
              </div>
            </div>
          </section>
        </BlurFade>

        <BlurFade delay={0.05} className="lg:col-span-5">
          <Card className="h-full overflow-hidden border-0 bg-card shadow-card">
            <CardContent className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("home.today")}
                  </p>
                  <h2 className="mt-1 flex items-center gap-1.5 text-lg font-black tracking-tight">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                    {weather?.city ?? "Hyderabad"}
                  </h2>
                </div>
                <Link
                  href="/weather"
                  className="flex h-8 items-center gap-1 rounded-full border border-border/70 px-3 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("home.viewAll")}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {weatherLoading ? (
                <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  {t("common.loading")}…
                </div>
              ) : weatherError || !weather ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                  <CloudRain className="h-9 w-9 text-primary/50" aria-hidden="true" />
                  {t("home.weatherUnavailable")}
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "mt-4 flex items-center justify-between gap-3 rounded-2xl p-4",
                      isDark && "border border-border/80 bg-card"
                    )}
                    style={isDark ? undefined : { background: weatherVisual.gradient }}
                  >
                    <div>
                      <p className="flex items-baseline gap-1 text-4xl font-black leading-none tracking-tight text-foreground">
                        {weather.temp}
                        <span className="text-lg font-bold text-muted-foreground">°C</span>
                      </p>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">
                        {locale === "te" ? weatherVisual.labelTe : weatherVisual.label}
                        {today ? ` · ${today.max}° / ${today.min}°` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex h-20 w-20 items-center justify-center rounded-full shadow-subtle",
                        isDark ? "bg-white/10" : "bg-white/60"
                      )}
                      style={{ color: isDark ? "hsl(var(--foreground))" : weatherVisual.ink }}
                    >
                      <WeatherIcon className="h-12 w-12" strokeWidth={1.7} aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniStat icon={Droplets} label={t("home.humidity")} value={`${weather.humidity}%`} />
                    <MiniStat icon={CloudRain} label={t("home.rain")} value={`${weather.rain_prob}%`} />
                    <MiniStat icon={Wind} label={t("home.wind")} value={`${weather.wind_speed} km/h`} />
                  </div>

                  <p className="mt-4 line-clamp-2 rounded-2xl bg-primary/5 px-3 py-2.5 text-xs font-medium leading-relaxed text-inkSoft dark:text-foreground/80">
                    {locale === "te" ? weather.advisory_te ?? weather.advisory : weather.advisory}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </BlurFade>
      </div>

      <BlurFade delay={0.08} className="mt-6">
        <SectionHeader title={t("home.popularCrops")} action={t("home.viewAll")} href="/mandi" />
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
          {theme.crops.slice(0, 6).map((crop) => (
            <Link
              key={crop.id}
              href="/mandi"
              className="group relative w-[142px] shrink-0 overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-card transition-transform duration-300 hover:-translate-y-1 sm:w-auto"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={crop.image}
                  alt={crop.name}
                  fill
                  sizes="(max-width: 640px) 142px, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <Badge className="absolute left-2 top-2 border-0 bg-white/90 text-[9px] font-bold text-primary backdrop-blur">
                  {crop.tag}
                </Badge>
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-black text-foreground">
                  {locale === "te" ? crop.nameTe : crop.name}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{crop.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </BlurFade>

      <BlurFade delay={0.1} className="mt-6">
        <SectionHeader title={t("home.quickAccess")} />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {theme.quickAccess.map((item) => {
            const Icon = navIconMap[item.icon] ?? navIconMap.leaf;
            const tone = quickAccessTones[item.tone];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[20px] border border-border/70 bg-card p-3.5 shadow-card ring-1 ring-inset transition-transform duration-300 hover:-translate-y-0.5",
                  tone.ring
                )}
              >
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", tone.bg, tone.text)}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black text-foreground">{t(item.labelKey)}</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {t("home.viewAll")}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </BlurFade>

      <div className="mt-6 grid gap-5 lg:grid-cols-12">
        <BlurFade delay={0.12} className="lg:col-span-7">
          <SectionHeader title={t("home.expertAdvice")} action={t("home.viewAll")} href="/advice" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {theme.advice.slice(0, 2).map((article) => (
              <Link
                key={article.id}
                href={`/advice#${article.id}`}
                className="group overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-card transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 28vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                  <Badge className="absolute left-3 top-3 border-0 bg-white/90 text-[9px] font-bold text-primary backdrop-blur">
                    {article.category}
                  </Badge>
                </div>
                <div className="p-3.5">
                  <h3 className="line-clamp-2 text-sm font-black leading-snug text-foreground">
                    {locale === "te" ? article.titleTe : article.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {locale === "te" ? article.excerptTe : article.excerpt}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                    {t("advice.readMore")}
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </BlurFade>

        <BlurFade delay={0.14} className="lg:col-span-5">
          <SectionHeader title={t("home.marketPrices")} action={t("home.viewAll")} href="/mandi" />
          <div className="mt-3 space-y-2.5">
            {mandiLoading ? (
              <Card>
                <CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {t("common.loading")}…
                </CardContent>
              </Card>
            ) : mandiError || marketItems.length === 0 ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">{t("home.marketUnavailable")}</CardContent>
              </Card>
            ) : (
              marketItems.map((item) => <MarketRow key={item.id} item={item} locale={locale} />)
            )}
            <div className="flex items-start gap-2 rounded-2xl bg-primary/5 px-3.5 py-3 text-[11px] leading-relaxed text-inkSoft dark:text-foreground/80">
              <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="font-bold text-foreground">{theme.crops[0].tip}</span>{" "}
                {t("home.farmTip")}
              </span>
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Droplets;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/60 px-2.5 py-2 text-center">
      <Icon className="mx-auto h-3.5 w-3.5 text-primary" aria-hidden="true" />
      <p className="mt-1 text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[11px] font-black text-foreground">{value}</p>
    </div>
  );
}

function SectionHeader({
  title,
  action,
  href
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-black tracking-tight text-foreground sm:text-lg">{title}</h2>
      {action && href ? (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-[11px] font-bold text-primary hover:underline"
        >
          {action}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function MarketRow({ item, locale }: { item: MandiCommodity; locale: string }) {
  const crop = getCropForCommodity(item.id, item.name_en);
  const up = item.trend === "up";
  return (
    <Link
      href="/mandi"
      className="flex items-center gap-3 rounded-[20px] border border-border/70 bg-card p-2.5 shadow-card transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
        {crop ? (
          <Image src={crop.image} alt={crop.name} fill sizes="56px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-primary/60">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-foreground">
          {locale === "te" ? item.name_te : item.name_en}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {locale === "te" ? item.market_te : item.market_en}
        </p>
        <p className="mt-1 text-sm font-black text-primary">
          {formatCurrency(item.modal_price)}
          <span className="ml-1 text-[10px] font-medium text-muted-foreground">{item.unit}</span>
        </p>
      </div>
      <Badge
        variant={up ? "success" : "destructive"}
        className="shrink-0 gap-1 rounded-full px-2 py-1 text-[10px]"
      >
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {item.change}
      </Badge>
    </Link>
  );
}
