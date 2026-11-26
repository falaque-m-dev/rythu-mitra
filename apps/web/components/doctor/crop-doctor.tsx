"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  ImagePlus,
  Leaf,
  Loader2,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TextGenerateEffect } from "@/components/aceternity/text-generate-effect";
import { BlurFade } from "@/components/magic/blur-fade";
import { useLocale } from "@/components/providers/locale-provider";
import { ApiError, diagnose, synthesizeSpeech } from "@/lib/api";
import type { DiagnoseResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type ResultTab = "symptoms" | "organic" | "chemical" | "prevention";

export function CropDoctor() {
  const { locale, t } = useLocale();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [preparingAudio, setPreparingAudio] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const autoReadRef = useRef(false);

  const attachVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (video && streamRef.current) {
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      void video.play().catch(() => {});
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  }, []);

  const releaseAudio = useCallback(() => {
    const source = audioSourceRef.current;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // already stopped
      }
      source.disconnect();
      audioSourceRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    releaseAudio();
    setSpeaking(false);
  }, [releaseAudio]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      releaseAudio();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, [releaseAudio]);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      void videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  const runDiagnosis = useCallback(
    async (imageData: string) => {
      stopAudio();
      setAnalyzing(true);
      setError(null);
      setResult(null);
      autoReadRef.current = false;

      try {
        const data = await diagnose({ image: imageData, lang: locale });
        setResult(data);
        if (data.mode === "degraded") {
          toast.warning(t("status.degraded"), { description: t("status.degradedHint") });
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Something went wrong.";
        setError(message);
        toast.error(message);
      } finally {
        setAnalyzing(false);
      }
    },
    [locale, stopAudio, t]
  );

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error(t("doctor.imageRequired"));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          toast.error(t("doctor.fileReadFailed"));
          return;
        }
        setImage(reader.result);
        void runDiagnosis(reader.result);
      };
      reader.onerror = () => toast.error(t("doctor.fileReadFailed"));
      reader.readAsDataURL(file);
    },
    [runDiagnosis, t]
  );

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error(t("doctor.cameraUnsupported"));
      fileRef.current?.click();
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
      } catch {
        // Fallback for devices without back camera (e.g. desktop webcams, laptops)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      streamRef.current = stream;
      setCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => {});
      }
    } catch {
      toast.error(t("doctor.cameraDenied"));
      fileRef.current?.click();
    }
  }, [t]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.error(t("doctor.cameraNotReady"));
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      toast.error(t("doctor.captureFailed"));
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    setImage(dataUrl);
    void runDiagnosis(dataUrl);
  }, [runDiagnosis, stopCamera, t]);

  const reset = useCallback(() => {
    stopAudio();
    setResult(null);
    setImage(null);
    setError(null);
  }, [stopAudio]);

  const speak = useCallback(async () => {
    if (!result || preparingAudio) return;

    if (speaking) {
      stopAudio();
      return;
    }

    const d = result.diagnosis;
    const parts =
      locale === "te"
        ? [d.crop_te ?? d.crop, d.disease_te ?? d.disease, d.symptoms_te ?? d.symptoms, d.organic_te ?? d.organic_cure]
        : [d.crop, d.disease, d.symptoms, d.organic_cure];
    const text = parts.filter(Boolean).join(". ").slice(0, 1200);

    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) {
      toast.error(t("doctor.audioFailed"));
      return;
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
    }
    const context = audioContextRef.current;
    if (context.state === "suspended") {
      void context.resume();
    }

    setPreparingAudio(true);
    try {
      const blob = await synthesizeSpeech(text, locale);
      const buffer = await blob.arrayBuffer();
      const decoded = await context.decodeAudioData(buffer);
      const source = context.createBufferSource();
      source.buffer = decoded;
      source.connect(context.destination);
      audioSourceRef.current = source;
      source.onended = stopAudio;

      setSpeaking(true);
      source.start();
    } catch (err) {
      if (err instanceof ApiError && err.code === "tts_not_configured") {
        toast.error(t("doctor.voiceUnavailable"));
      } else {
        toast.error(err instanceof ApiError ? err.message : t("doctor.audioFailed"));
      }
    } finally {
      setPreparingAudio(false);
    }
  }, [locale, preparingAudio, result, speaking, stopAudio, t]);

  useEffect(() => {
    if (!result || autoReadRef.current || speaking || preparingAudio) return;
    autoReadRef.current = true;
    void speak();
  }, [result, speaking, preparingAudio, speak]);

  const pick = (en?: string, te?: string) => (locale === "te" ? te ?? en ?? "" : en ?? "");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
      <BlurFade>
        <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#083D1C_0%,#0E5A2A_55%,#1F7A3D_100%)] p-5 text-white shadow-elevated sm:p-7">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur">
              <ScanLine className="h-3 w-3" aria-hidden="true" />
              {t("doctor.title")}
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-balance sm:text-4xl">
              {t("doctor.title")}
            </h1>
            <p className="mt-2.5 max-w-lg text-sm font-medium leading-relaxed text-white/80">
              {t("doctor.desc")}
            </p>
          </div>
        </section>
      </BlurFade>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group flex flex-col items-start gap-3 rounded-[24px] border border-border/70 bg-card p-4 text-left shadow-card transition-transform duration-300 hover:-translate-y-0.5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-black text-foreground">{t("doctor.upload")}</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">JPG, PNG · up to 12 MB</span>
          </span>
        </button>
        <button
          type="button"
          onClick={startCamera}
          className="group flex flex-col items-start gap-3 rounded-[24px] border border-border/70 bg-card p-4 text-left shadow-card transition-transform duration-300 hover:-translate-y-0.5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 transition-transform group-hover:scale-105 dark:text-sky-300">
            <Camera className="h-6 w-6" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-black text-foreground">{t("doctor.camera")}</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">Use the rear camera</span>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) processFile(file);
            event.target.value = "";
          }}
        />
      </div>

      <div className="mt-5 space-y-4">
        {analyzing ? (
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black text-foreground">{t("doctor.analyzing")}</p>
                <p className="text-xs text-muted-foreground">{t("doctor.analyzingHint")}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {error && !analyzing ? (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
                <div>
                  <p className="text-sm font-black text-foreground">{t("doctor.requestFailed")}</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
              {image ? (
                <Button variant="outline" size="sm" onClick={() => void runDiagnosis(image)}>
                  {t("actions.retry")}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {!result && !analyzing && !error ? (
          <Card className="border-dashed bg-card/60">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center sm:p-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Leaf className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="text-sm font-black text-foreground">{t("doctor.empty")}</p>
              <p className="max-w-sm text-xs text-muted-foreground">{t("doctor.emptyHint")}</p>
              <div className="mt-3 grid w-full max-w-md grid-cols-3 gap-2 text-[10px] font-semibold text-muted-foreground">
                <div className="rounded-2xl bg-muted/60 p-2.5">
                  <Camera className="mx-auto mb-1 h-4 w-4 text-primary" />
                  Clear photo
                </div>
                <div className="rounded-2xl bg-muted/60 p-2.5">
                  <Sparkles className="mx-auto mb-1 h-4 w-4 text-primary" />
                  AI diagnosis
                </div>
                <div className="rounded-2xl bg-muted/60 p-2.5">
                  <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-primary" />
                  Safe remedy
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {result && !analyzing ? (
          <BlurFade>
            <Card className="overflow-hidden border-border/70 shadow-card">
              <CardHeader className="border-b border-border/70 bg-muted/35 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">{pick(result.diagnosis.crop, result.diagnosis.crop_te)}</Badge>
                  <Badge
                    variant={
                      result.diagnosis.severity.toLowerCase().includes("high") ||
                      result.diagnosis.severity.includes("తీవ్ర")
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {pick(result.diagnosis.severity, result.diagnosis.severity_te)}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-xl sm:text-2xl">
                  <TextGenerateEffect
                    key={pick(result.diagnosis.disease, result.diagnosis.disease_te)}
                    text={pick(result.diagnosis.disease, result.diagnosis.disease_te)}
                  />
                </CardTitle>
              </CardHeader>

              <CardContent className="grid gap-5 p-4 sm:p-5 md:grid-cols-12">
                <div className="md:col-span-4">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={t("doctor.imageAlt")}
                      className="aspect-square w-full rounded-2xl border border-border bg-muted object-cover"
                    />
                  ) : null}
                  <div className="mt-3 rounded-2xl bg-primary/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                      {t("home.farmTip")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {pick(result.diagnosis.prevention, result.diagnosis.prevention_te)}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-8">
                  <ResultTabs result={result} locale={locale} t={t} />
                </div>
              </CardContent>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void speak()}
                  disabled={preparingAudio}
                  className="rounded-full"
                >
                  {preparingAudio ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : speaking ? (
                    <VolumeX className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  {preparingAudio
                    ? t("doctor.preparingAudio")
                    : speaking
                      ? t("doctor.stop")
                      : t("doctor.listen")}
                </Button>
                <Button variant="ghost" size="sm" onClick={reset} className="rounded-full">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t("doctor.reset")}
                </Button>
              </div>
            </Card>
          </BlurFade>
        ) : null}
      </div>

      <Dialog
        open={cameraOpen}
        onOpenChange={(open) => {
          if (!open) stopCamera();
        }}
      >
        <DialogContent className="w-[calc(100%-1.5rem)] sm:w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
          <DialogTitle>{t("doctor.camera")}</DialogTitle>
          <DialogDescription>{t("doctor.desc")}</DialogDescription>
          <div className="relative aspect-[4/3] sm:aspect-video w-full max-h-[60vh] sm:max-h-[65vh] overflow-hidden rounded-2xl bg-black flex items-center justify-center shadow-inner">
            <video
              ref={attachVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {/* Viewfinder target framing guide */}
            <div className="pointer-events-none absolute inset-4 sm:inset-8 rounded-xl border border-white/20">
              <div className="absolute -left-0.5 -top-0.5 h-4 w-4 border-l-2 border-t-2 border-primary" />
              <div className="absolute -right-0.5 -top-0.5 h-4 w-4 border-r-2 border-t-2 border-primary" />
              <div className="absolute -bottom-0.5 -left-0.5 h-4 w-4 border-b-2 border-l-2 border-primary" />
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 border-b-2 border-r-2 border-primary" />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-1">
            <Button variant="outline" onClick={stopCamera} className="w-full sm:w-auto">
              {t("doctor.cancel")}
            </Button>
            <Button onClick={capture} className="w-full sm:w-auto font-bold">
              <Camera className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {t("doctor.capture")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResultTabs({
  result,
  locale,
  t
}: {
  result: DiagnoseResult;
  locale: string;
  t: (key: string) => string;
}) {
  const [tab, setTab] = useState<ResultTab>("symptoms");
  const tabs: { value: ResultTab; label: string }[] = [
    { value: "symptoms", label: t("doctor.symptoms") },
    { value: "organic", label: t("doctor.organic") },
    { value: "chemical", label: t("doctor.chemical") },
    { value: "prevention", label: t("doctor.prevention") }
  ];
  const pick = (en?: string, te?: string) => (locale === "te" ? te ?? en ?? "" : en ?? "");
  const content: Record<ResultTab, string> = {
    symptoms: pick(result.diagnosis.symptoms, result.diagnosis.symptoms_te),
    organic: pick(result.diagnosis.organic_cure, result.diagnosis.organic_te),
    chemical: pick(result.diagnosis.chemical_cure, result.diagnosis.chemical_te),
    prevention: pick(result.diagnosis.prevention, result.diagnosis.prevention_te)
  };

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto rounded-full bg-muted/60 p-1 scrollbar-none">
        {tabs.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={cn(
                "relative shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                active ? "text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="doctor-result-tab"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "mt-3 rounded-2xl border p-4 text-sm leading-relaxed",
            tab === "organic" && "border-primary/20 bg-primary/5 text-foreground",
            tab === "prevention" && "border-accent/30 bg-accent/5 text-foreground",
            tab === "chemical" && "border-border bg-muted/40 font-mono text-[13px] text-foreground",
            tab === "symptoms" && "border-border bg-muted/40 text-foreground"
          )}
        >
          {content[tab]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
