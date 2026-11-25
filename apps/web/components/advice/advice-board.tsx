"use client";

import Image from "next/image";
import { BookOpen, Clock, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/magic/blur-fade";
import { useLocale } from "@/components/providers/locale-provider";
import theme from "@/theme";

export function AdviceBoard() {
  const { locale, t } = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
      <BlurFade>
        <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#083D1C_0%,#0E5A2A_55%,#1F7A3D_100%)] p-5 text-white shadow-elevated sm:p-7">
          <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur">
            <BookOpen className="h-3 w-3" aria-hidden="true" />
            {t("advice.all")}
          </span>
          <h1 className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-tight text-balance sm:text-4xl">
            {t("advice.title")}
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-white/80">
            {t("advice.desc")}
          </p>
        </section>
      </BlurFade>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {theme.advice.map((article, index) => (
          <BlurFade key={article.id} delay={Math.min(index * 0.04, 0.16)}>
            <article
              id={article.id}
              className="scroll-mt-24 overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-card"
            >
              <div className="relative h-48 overflow-hidden sm:h-52">
                <Image
                  src={article.image}
                  alt={locale === "te" ? article.titleTe : article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                <Badge className="absolute left-3 top-3 border-0 bg-white/90 text-[9px] font-bold text-primary backdrop-blur">
                  {article.category}
                </Badge>
              </div>
              <div className="p-4 sm:p-5">
                <h2 className="text-lg font-black leading-snug tracking-tight text-foreground">
                  {locale === "te" ? article.titleTe : article.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {locale === "te" ? article.excerptTe : article.excerpt}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                    {article.author}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {article.readTime}
                  </span>
                </div>
              </div>
            </article>
          </BlurFade>
        ))}
      </div>
    </div>
  );
}
