"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, CloudRain, Droplets, Loader2, MapPin, Thermometer, Wind } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlurFade } from "@/components/magic/blur-fade";
import { useLocale } from "@/components/providers/locale-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { ApiError, getWeather } from "@/lib/api";
import type { WeatherResult } from "@/lib/types";
import { formatWeatherDay, getWeatherVisual } from "@/lib/weather";
import { cn } from "@/lib/utils";
import theme from "@/theme";

export function WeatherPanel() {
  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [regionName, setRegionName] = useState(theme.weatherRegions[0].name);
  const [data, setData] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(
    (name: string) => {
      const region = theme.weatherRegions.find((item) => item.name === name) ?? theme.weatherRegions[0];
      return getWeather(region.lat, region.lon, region.name, locale);
    },
    [locale]
  );

  const handleFailure = useCallback((err: unknown) => {
    const message = err instanceof ApiError ? err.message : "Could not load weather.";
    setError(message);
    toast.error(message);
  }, []);

  useEffect(() => {
    let active = true;
    fetchWeather(regionName)
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
        }
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
  }, [regionName, fetchWeather, handleFailure]);

  const selectRegion = (name: string) => {
    setLoading(true);
    setError(null);
    setRegionName(name);
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    fetchWeather(regionName)
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch(handleFailure)
      .finally(() => setLoading(false));
  };

  const visual = useMemo(
    () => getWeatherVisual(data?.condition_code, data?.is_day ?? true),
    [data?.condition_code, data?.is_day]
  );
  const WeatherIcon = visual.icon;
  const today = data?.forecast?.[0];
  const forecast = data?.forecast ?? [];
  const regionGroups = useMemo(
    () =>
      theme.weatherRegions.reduce<Record<string, typeof theme.weatherRegions>>((groups, region) => {
        (groups[region.state] ??= []).push(region);
        return groups;
      }, {}),
    []
  );

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {t("weather.title")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{t("weather.desc")}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="region" className="text-[11px] font-bold text-muted-foreground">
            {t("weather.location")}
          </label>
          <div className="relative">
            <select
              id="region"
              value={regionName}
              onChange={(event) => selectRegion(event.target.value)}
              className="h-11 w-full appearance-none rounded-full border border-border bg-card pl-4 pr-12 text-sm font-bold text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:min-w-[13rem]"
            >
              {Object.entries(regionGroups).map(([state, regions]) => (
                <optgroup key={state} label={locale === "te" ? regions[0].stateTe : state}>
                  {regions.map((region) => (
                    <option key={region.name} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
      </header>

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
            <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>
                {t("actions.retry")}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {data && !loading && !error ? (
          <BlurFade>
            <div className="grid gap-4 lg:grid-cols-12">
              <Card
                className={cn(
                  "overflow-hidden border-0 shadow-card lg:col-span-7",
                  isDark && "border border-border/80 bg-card"
                )}
                style={isDark ? undefined : { background: visual.gradient }}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {data.city}
                      </p>
                      <p className="mt-2 flex items-baseline gap-1 text-6xl font-black leading-none tracking-tighter text-foreground sm:text-7xl">
                        <NumberFlow value={data.temp} />
                        <span className="text-2xl font-bold text-muted-foreground">°C</span>
                      </p>
                      <p className="mt-2 text-sm font-bold text-inkSoft dark:text-foreground/80">
                        {locale === "te" ? visual.labelTe : visual.label}
                        {today ? ` · ${today.max}° / ${today.min}°` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex h-24 w-24 items-center justify-center rounded-full shadow-subtle sm:h-28 sm:w-28",
                        isDark ? "bg-white/10" : "bg-white/55"
                      )}
                      style={{ color: visual.ink }}
                    >
                      <WeatherIcon className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.4} aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <WeatherMetric icon={Thermometer} label={t("home.feelsLike")} value={`${data.apparent_temp}°C`} isDark={isDark} />
                    <WeatherMetric icon={Droplets} label={t("weather.humidity")} value={`${data.humidity}%`} isDark={isDark} />
                    <WeatherMetric icon={CloudRain} label={t("weather.rain")} value={`${data.rain_prob}%`} isDark={isDark} />
                    <WeatherMetric icon={Wind} label={t("weather.wind")} value={`${data.wind_speed} km/h`} isDark={isDark} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card shadow-card lg:col-span-5">
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-base font-black tracking-tight text-foreground">{t("weather.advisory")}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {locale === "te" ? data.advisory_te ?? data.advisory : data.advisory}
                  </p>
                  <div className="mt-5 rounded-2xl bg-primary/5 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                      {t("home.today")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {locale === "te" ? visual.labelTe : visual.label}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("weather.highLow")}: {today ? `${today.max}° / ${today.min}°` : `${data.temp}°`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4 border-border/70 bg-card shadow-card">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black tracking-tight text-foreground">{t("weather.week")}</h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                    {data.city}
                  </span>
                </div>

                {forecast.length > 0 ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-7 sm:gap-2">
                    {forecast.map((day, index) => {
                      const dayVisual = getWeatherVisual(day.code, true);
                      const DayIcon = dayVisual.icon;
                      return (
                        <div
                          key={day.date}
                          data-testid="forecast-day"
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-2.5 sm:flex-col sm:items-center sm:gap-1.5 sm:px-2 sm:py-3 sm:text-center",
                            isDark ? "bg-secondary" : "bg-muted/35"
                          )}
                        >
                          <p className="w-12 shrink-0 text-[11px] font-black text-foreground sm:w-auto">
                            {formatWeatherDay(day.date, locale, index)}
                          </p>
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                              isDark ? "bg-white/10" : "bg-white/70"
                            )}
                            style={{ color: dayVisual.ink }}
                          >
                            <DayIcon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.6} aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1 sm:flex-none">
                            <p className="text-xs font-black text-foreground">
                              {day.max}° <span className="font-medium text-muted-foreground">/ {day.min}°</span>
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground sm:justify-center">
                              <CloudRain className="h-3 w-3" aria-hidden="true" />
                              {day.rain_prob}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">{t("common.unavailable")}</p>
                )}
              </CardContent>
            </Card>
          </BlurFade>
        ) : null}
      </div>
    </div>
  );
}

function WeatherMetric({
  icon: Icon,
  label,
  value,
  isDark
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div className={cn("rounded-2xl px-2.5 py-2.5 text-center shadow-subtle backdrop-blur", isDark ? "bg-white/10" : "bg-white/55")}>
      <Icon className="mx-auto h-4 w-4 text-primary" aria-hidden="true" />
      <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{label}</p>
      <p className="text-xs font-black text-foreground">{value}</p>
    </div>
  );
}
