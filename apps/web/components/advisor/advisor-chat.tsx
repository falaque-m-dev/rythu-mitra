"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, Send, Trash2 } from "lucide-react";
import { WheatCoinIcon } from "@/components/ui/wheat-coin-icon";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedShinyText } from "@/components/magic/animated-shiny-text";
import { useLocale } from "@/components/providers/locale-provider";
import { ApiError, sendChat, synthesizeSpeech } from "@/lib/api";
import type { AiMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: AiMode;
}

interface AdvisorChatProps {
  className?: string;
  compact?: boolean;
}

type BrowserRecognitionEvent = {
  results: Array<Array<{ transcript?: string }>>;
};

interface BrowserRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: BrowserRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type BrowserRecognitionCtor = new () => BrowserRecognition;

export function AdvisorChat({ className, compact = false }: AdvisorChatProps) {
  const { locale, t } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [preparingAudio, setPreparingAudio] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const spokenRef = useRef<string | null>(null);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const [voiceListening, setVoiceListening] = useState(false);

  const releaseAudio = useCallback(() => {
    const source = audioSourceRef.current;
    if (source) {
      try {
        source.stop();
      } catch {}
      source.disconnect();
      audioSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(
    () => () => {
      releaseAudio();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    },
    [releaseAudio]
  );

  const speak = useCallback(
    async (text: string) => {
      if (!text || speaking || preparingAudio) return;
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        toast.error(t("doctor.voiceUnavailable"));
        return;
      }
      audioContextRef.current ??= new AudioCtor();
      const context = audioContextRef.current;
      if (context.state === "suspended") await context.resume();
      setPreparingAudio(true);
      try {
        const blob = await synthesizeSpeech(text, locale);
        const buffer = await blob.arrayBuffer();
        const decoded = await context.decodeAudioData(buffer);
        const source = context.createBufferSource();
        source.buffer = decoded;
        source.connect(context.destination);
        audioSourceRef.current = source;
        source.onended = () => setSpeaking(false);
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
    },
    [locale, preparingAudio, speaking, t]
  );

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
    if (!lastAssistant) return;
    const spokenKey = `${lastAssistant.id}:${locale}`;
    if (spokenRef.current === spokenKey) return;
    spokenRef.current = spokenKey;
    void speak(lastAssistant.content);
  }, [locale, messages, speak]);

  const toggleVoice = useCallback(() => {
    if (!voiceListening) {
      const browserWindow = window as unknown as {
        SpeechRecognition?: BrowserRecognitionCtor;
        webkitSpeechRecognition?: BrowserRecognitionCtor;
      };
      const Ctor = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
      if (!Ctor) {
        toast.error(t("doctor.voiceUnavailable"));
        return;
      }
      const recognition = new Ctor();
      recognition.lang = locale === "te" ? "te-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = event.results.map((result) => result[0]?.transcript ?? "").join("");
        if (transcript) setInput((current) => (current ? `${current} ${transcript}` : transcript));
      };
      recognition.onend = () => setVoiceListening(false);
      recognition.onerror = () => setVoiceListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setVoiceListening(true);
    } else {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setVoiceListening(false);
    }
  }, [locale, t, voiceListening]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    },
    []
  );

  const send = async (value?: string) => {
    const query = (value ?? input).trim();
    if (!query || loading) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: query }
    ]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChat(query, locale);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          mode: data.mode
        }
      ]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("advisor.failed"));
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [t("advisor.suggestion1"), t("advisor.suggestion2"), t("advisor.suggestion3")];

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex items-center justify-between border-b border-border/80 py-3 pl-4 pr-12">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <WheatCoinIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">{t("advisor.title")}</p>
            <p className="text-[11px] text-muted-foreground">{t("advisor.subtitle")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs"
          onClick={() => setMessages([])}
          disabled={messages.length === 0 || loading}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("advisor.clear")}</span>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <WheatCoinIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed shadow-subtle">
              {t("advisor.greeting")}
            </div>
          </div>

          {messages.length === 0 && !compact ? (
            <div className="pl-9">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-left text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  {!isUser ? (
                    <span className="mr-2.5 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <WheatCoinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "rounded-tr-md bg-primary text-primary-foreground"
                        : "rounded-tl-md border border-border bg-card text-foreground shadow-subtle"
                    )}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                    {!isUser && message.mode ? (
                      <Badge
                        variant={message.mode === "live" ? "success" : "accent"}
                        className="mt-2"
                      >
                        {message.mode === "live" ? t("status.live") : t("status.degraded")}
                      </Badge>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center gap-2 pl-9 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              <AnimatedShinyText>{t("advisor.thinking")}</AnimatedShinyText>
            </div>
          ) : null}
        </div>
        <div ref={endRef} />
      </div>

      <div className="border-t border-border/80 bg-card p-3">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder={t("advisor.placeholder")}
            aria-label={t("advisor.placeholder")}
            disabled={loading}
            className="h-11 rounded-full border-border/80 bg-muted/40"
          />
          <Button
            type="button"
            onClick={toggleVoice}
            size="icon"
            className={cn("h-11 w-11 shrink-0 rounded-full", voiceListening && "animate-pulse bg-primary/10")}
            aria-label={voiceListening ? t("advisor.stopListening") : t("advisor.listen")}
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            onClick={() => void send()}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            aria-label={t("advisor.send")}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
